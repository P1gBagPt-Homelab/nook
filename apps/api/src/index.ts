import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import swagger from "@fastify/swagger";
import scalarTheme from "@scalar/fastify-api-reference";
import dotenv from "dotenv";

dotenv.config({ path: "../../.env" });

const app = Fastify({ logger: true });

async function main() {
  await app.register(cors, { origin: true, credentials: true });
  await app.register(cookie);

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

  const port = Number(process.env.PORT) || 8000;
  await app.listen({ port, host: "0.0.0.0" });
  console.log(`🚀 Nook API running at http://localhost:${port}`);
  console.log(`📖 Scalar Docs at http://localhost:${port}/docs`);
}

main().catch((err) => {
  app.log.error(err);
  process.exit(1);
});
