import Fastify, { FastifyInstance, FastifyError } from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import swagger from "@fastify/swagger";
import scalarTheme from "@scalar/fastify-api-reference";
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

export interface ServerOptions {
  testing?: boolean;
}

export async function buildServer(options: ServerOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({
    logger: options.testing ? false : true,
  });

  await app.register(cors, { origin: true, credentials: true });
  await app.register(cookie);

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
    return reply.status(statusCode).send({
      type: `https://nook.app/errors/${error.code || "internal-error"}`,
      title: error.name || "Internal Server Error",
      status: statusCode,
      detail: error.message,
    });
  });

  // Register Feature Routes
  await app.register(authRoutes, { prefix: "/api/auth" });
  await app.register(uploadRoutes, { prefix: "/api/uploads" });
  await app.register(catalogRoutes, { prefix: "/api/catalog" });
  await app.register(cartRoutes, { prefix: "/api/cart" });
  await app.register(stockRoutes, { prefix: "/api/stock" });

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
