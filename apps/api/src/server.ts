import Fastify, { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import swagger from "@fastify/swagger";
import scalarTheme from "@scalar/fastify-api-reference";
import dotenv from "dotenv";
import { databasePlugin } from "./plugins/database";

dotenv.config({ path: "../../.env" });

export interface ServerOptions {
  testing?: boolean;
}

export async function buildServer(options: ServerOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({
    logger: options.testing ? false : true,
  });

  await app.register(cors, { origin: true, credentials: true });
  await app.register(cookie);

  // Register Database Plugin
  await app.register(databasePlugin);

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
      ],
    },
  });

  await app.register(scalarTheme, {
    routePrefix: "/docs",
    configuration: { theme: "elysiajs" },
  });

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
