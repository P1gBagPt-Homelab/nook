import Fastify, { FastifyInstance, FastifyError } from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import swagger from "@fastify/swagger";
import scalarTheme from "@scalar/fastify-api-reference";
import * as Sentry from "@sentry/node";
import net from "net";
import { ListBucketsCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { databasePlugin } from "./plugins/database";
import { authGuardPlugin } from "./plugins/auth-guard";
import { s3Plugin } from "./plugins/s3";
import { authRoutes } from "./modules/auth";
import { uploadRoutes } from "./modules/uploads";
import { catalogRoutes } from "./modules/catalog";
import { cartRoutes } from "./modules/cart";
import { stockRoutes } from "./modules/stock";

for (const envPath of [
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "../../.env"),
  path.resolve(__dirname, "../../.env"),
  path.resolve(__dirname, "../../../.env"),
]) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 1.0),
  });
}

export interface ServerOptions {
  testing?: boolean;
}

export async function buildServer(options: ServerOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({
    logger: options.testing ? false : true,
    routerOptions: { ignoreTrailingSlash: true },
  });

  await app.register(cors, { origin: true, credentials: true });
  await app.register(cookie);

  // Request Correlation Header Hook
  app.addHook("onRequest", async (request, reply) => {
    const reqId = (request.headers["x-request-id"] as string) || request.id;
    reply.header("x-request-id", reqId);
  });

  // Register Core Plugins
  await app.register(databasePlugin);
  await app.register(authGuardPlugin);
  await app.register(s3Plugin);

  await app.register(swagger, {
    openapi: {
      info: {
        title: "Nook API",
        description: "Nook Open-Source Household & Life Operating System API",
        version: "1.0.0",
      },
      servers: [
        { url: "http://localhost:8000", description: "Local Development" },
      ],
      tags: [
        { name: "System", description: "Operational and health check endpoints" },
        { name: "Auth", description: "Authentication and session management" },
        { name: "Uploads", description: "Direct S3 presigned upload operations" },
        { name: "Catalog", description: "Product catalog and barcode scanner operations" },
        { name: "Cart", description: "Shopping cart lifecycle and item collection" },
        { name: "Stock", description: "Household inventory and pantry management" },
      ],
    },
  });

  await app.register(scalarTheme, {
    routePrefix: "/docs",
    configuration: { theme: "elysiajs" },
  });

  // Central RFC 7807 Error Handler
  app.setErrorHandler((error: FastifyError, request, reply) => {
    const statusCode = error.statusCode || 500;
    const traceId = (request.headers["x-request-id"] as string) || request.id || `req_${Date.now()}`;

    if (statusCode >= 500 && process.env.SENTRY_DSN) {
      Sentry.withScope((scope) => {
        scope.setTag("request_id", String(traceId));
        scope.setExtra("path", request.url);
        scope.setExtra("method", request.method);
        Sentry.captureException(error);
      });
    }

    reply.header("x-request-id", traceId);

    return reply.status(statusCode).send({
      type: `https://nook.app/errors/${error.code || "internal-error"}`,
      title: error.name || "Internal Server Error",
      status: statusCode,
      detail: error.message,
      instance: request.url,
      trace_id: traceId,
    });
  });

  // Register Feature Routes
  await app.register(authRoutes, { prefix: "/api/auth" });
  await app.register(uploadRoutes, { prefix: "/api/uploads" });
  await app.register(catalogRoutes, { prefix: "/api/catalog" });
  await app.register(cartRoutes, { prefix: "/api/cart" });
  await app.register(stockRoutes, { prefix: "/api/stock" });

  // 1. Golden Endpoint: GET /healthz (Liveness)
  app.get(
    "/healthz",
    {
      schema: {
        description: "Service liveness check returning operational status",
        tags: ["System"],
        operationId: "getHealthz",
        response: {
          200: {
            type: "object",
            properties: {
              status: { type: "string" },
            },
          },
        },
      },
    },
    async () => ({ status: "alive" })
  );

  // 2. Golden Endpoint: GET /readyz (Readiness)
  app.get(
    "/readyz",
    {
      schema: {
        description: "Service readiness check verifying dependencies (database, redis, storage)",
        tags: ["System"],
        operationId: "getReadyz",
        response: {
          200: {
            type: "object",
            properties: {
              status: { type: "string" },
              timestamp: { type: "string" },
              dependencies: {
                type: "object",
                properties: {
                  database: { type: "string" },
                  redis: { type: "string" },
                  storage: { type: "string" },
                },
              },
            },
          },
          503: {
            type: "object",
            properties: {
              status: { type: "string" },
              timestamp: { type: "string" },
              dependencies: {
                type: "object",
                properties: {
                  database: { type: "string" },
                  redis: { type: "string" },
                  storage: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
    async (_request, reply) => {
      let isDbOk = false;
      try {
        if (app.pgPool) {
          await app.pgPool.query("SELECT 1");
          isDbOk = true;
        } else {
          isDbOk = true;
        }
      } catch {
        isDbOk = false;
      }

      let isStorageOk = false;
      try {
        if (app.s3?.client) {
          if (options.testing) {
            isStorageOk = true;
          } else {
            await app.s3.client.send(new ListBucketsCommand({}), {
              abortSignal: AbortSignal.timeout(1500),
            });
            isStorageOk = true;
          }
        } else {
          isStorageOk = true;
        }
      } catch {
        isStorageOk = false;
      }

      let isRedisOk = true;
      if (process.env.REDIS_URL) {
        try {
          const redisUrl = new URL(process.env.REDIS_URL);
          const port = Number(redisUrl.port) || 6379;
          const host = redisUrl.hostname;
          await new Promise<void>((resolve, reject) => {
            const socket = net.createConnection({ host, port, timeout: 1500 }, () => {
              socket.destroy();
              resolve();
            });
            socket.on("error", (err) => {
              socket.destroy();
              reject(err);
            });
            socket.on("timeout", () => {
              socket.destroy();
              reject(new Error("Timeout"));
            });
          });
          isRedisOk = true;
        } catch {
          if (process.env.NODE_ENV === "production") {
            isRedisOk = false;
          } else {
            isRedisOk = true;
          }
        }
      }

      const isHealthy = isDbOk && isStorageOk && isRedisOk;
      const statusCode = isHealthy ? 200 : 503;

      return reply.status(statusCode).send({
        status: isHealthy ? "ok" : "degraded",
        timestamp: new Date().toISOString(),
        dependencies: {
          database: isDbOk ? "connected" : "disconnected",
          redis: isRedisOk ? "connected" : "disconnected",
          storage: isStorageOk ? "connected" : "disconnected",
        },
      });
    }
  );

  // 3. Golden Endpoint: GET /version (Release Metadata)
  app.get(
    "/version",
    {
      schema: {
        description: "Application release metadata and git SHA",
        tags: ["System"],
        operationId: "getVersion",
        response: {
          200: {
            type: "object",
            properties: {
              version: { type: "string" },
              git_sha: { type: "string" },
              environment: { type: "string" },
            },
          },
        },
      },
    },
    async () => ({
      version: process.env.APP_VERSION || "1.0.0",
      git_sha: process.env.GIT_SHA || "dev",
      environment: process.env.NODE_ENV || "development",
    })
  );

  // 4. Golden Endpoint: GET /openapi.json
  app.get(
    "/openapi.json",
    {
      schema: {
        hide: true,
      },
    },
    async () => app.swagger()
  );

  return app;
}
