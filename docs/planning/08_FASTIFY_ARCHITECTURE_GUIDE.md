# 08. Fastify Dedicated API Architecture & Guide

> **Backend Engine**: [Fastify v5](https://fastify.dev/) (Node.js 22 LTS + TypeScript)  
> **Database ORM**: Drizzle ORM + PostgreSQL 18 Connection Pool  
> **Interactive Docs**: [Scalar](https://scalar.com/) via `@scalar/fastify-api-reference` at `http://localhost:8000/docs`  
> **Design Pattern**: Encapsulated Modular Monolith via Fastify Plugins  
> **API Standards**: 5 Golden Endpoints + RFC 7807 Problem Details + GlitchTip Sentry  

Welcome to Fastify! If you're coming from Express or Next.js, Fastify will feel like a breath of fresh air: it is significantly faster (benchmarking up to **75,000 req/sec**), has an elegant modular plugin system, and provides built-in schema serialization that cuts JSON serialization time in half.

---

## 1. Fastify Server Setup with Scalar Documentation

We embed **Scalar** directly into Fastify using `@scalar/fastify-api-reference`. There are zero extra containers and zero cloud dependencies:

```typescript
// apps/api/src/server.ts
import Fastify from "fastify";
import scalarTheme from "@scalar/fastify-api-reference";
import fastifySwagger from "@fastify/swagger";
import { authPlugin } from "./modules/auth";
import { catalogPlugin } from "./modules/catalog";
import { stockPlugin } from "./modules/stock";
import { cartPlugin } from "./modules/cart";
import { financePlugin } from "./modules/finance";
import { housePlugin } from "./modules/house";
import { correlationIdPlugin } from "./plugins/correlation-id";
import { rfc7807ErrorHandler } from "./plugins/error-handler";

export async function buildServer() {
  const server = Fastify({
    logger: {
      level: process.env.NODE_ENV === "production" ? "info" : "debug",
    },
  });

  // 1. Core Request Correlation & RFC 7807 Error Handler
  await server.register(correlationIdPlugin);
  server.setErrorHandler(rfc7807ErrorHandler);

  // 2. Middlewares
  await server.register(import("@fastify/cors"), { origin: true, credentials: true });
  await server.register(import("@fastify/cookie"));

  // 3. OpenAPI 3.1 Specification & Scalar Interactive Reference
  await server.register(fastifySwagger, {
    openapi: {
      info: {
        title: "Nook API",
        description: "Modular Household Operating System API",
        version: "1.0.0",
      },
      servers: [
        { url: "http://localhost:8000", description: "Local Development" },
        { url: "https://home.janus-lab.duckdns.org", description: "Janus Production" },
      ],
    },
  });

  // Mount Scalar directly on /docs
  await server.register(scalarTheme, {
    routePrefix: "/docs",
    configuration: {
      theme: "elysia",
      spec: {
        content: () => server.swagger(),
      },
    },
  });

  // Expose raw /openapi.json for Bruno & Spectral
  server.get("/openapi.json", async () => server.swagger());

  // 4. Register Modular Monolith Domains (Clean Prefix Scoping)
  await server.register(authPlugin, { prefix: "/api/auth" });
  await server.register(catalogPlugin, { prefix: "/api/catalog" });
  await server.register(stockPlugin, { prefix: "/api/stock" });
  await server.register(cartPlugin, { prefix: "/api/cart" });
  await server.register(financePlugin, { prefix: "/api/finance" });
  await server.register(housePlugin, { prefix: "/api/house" });

  // 5. The 5 Golden Endpoints (Janus Guide 22)
  server.get("/healthz", async () => ({ status: "alive" }));
  
  server.get("/readyz", async (req, reply) => {
    const isDbOk = await checkDbHealth(server);
    const isRedisOk = await checkRedisHealth(server);
    const isStorageOk = await checkMinioHealth(server);

    const isHealthy = isDbOk && isRedisOk && isStorageOk;
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
  });

  server.get("/version", async () => ({
    version: process.env.APP_VERSION || "1.0.0",
    git_sha: process.env.GIT_SHA || "dev",
    environment: process.env.NODE_ENV || "development",
  }));

  return server;
}
```

---

## 2. Standardized RFC 7807 Error Handler & GlitchTip

```typescript
// apps/api/src/plugins/error-handler.ts
import { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import * as Sentry from "@sentry/node";

export function rfc7807ErrorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  const traceId = (request.headers["x-request-id"] as string) || "unknown";
  const statusCode = error.statusCode || 500;

  // Log to GlitchTip / Sentry for server errors
  if (statusCode >= 500) {
    Sentry.withScope((scope) => {
      scope.setTag("request_id", traceId);
      scope.setExtra("path", request.url);
      Sentry.captureException(error);
    });
  }

  return reply.status(statusCode).send({
    type: `https://janus-lab.duckdns.org/errors/${error.code || "internal-error"}`,
    title: error.name || "Internal Server Error",
    status: statusCode,
    detail: error.message,
    instance: request.url,
    trace_id: traceId,
  });
}
```

---

## 2. Ultra-Fast Data Validation & Serialization

Fastify uses two compiler engines under the hood:
1. **Ajv (Another JSON Schema Validator)**: Validates incoming request params, query, and body in sub-millisecond C++ speed.
2. **`fast-json-stringify`**: Instead of calling slow `JSON.stringify()`, Fastify compiles a tailored serializer function based on your output schema. This makes API responses return **2x to 5x faster** than standard Express/Next.js handlers.

### Example: A Fastify Route with Zod / TypeBox Schema

```typescript
// apps/api/src/modules/catalog/routes.ts
import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { db } from "../../lib/db";
import { productCatalog } from "../../lib/db/schema";
import { eq, and } from "drizzle-orm";

const scanBarcodeSchema = {
  params: z.object({
    barcode: z.string().min(4).max(64),
  }),
  response: {
    200: z.object({
      source: z.enum(["local", "openfoodfacts"]),
      product: z.object({
        barcode: z.string(),
        title: z.string(),
        brand: z.string().nullable(),
        defaultPrice: z.string().nullable(),
        imageUrl: z.string().nullable(),
      }),
    }),
  },
};

export const catalogRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/scan/:barcode", { schema: scanBarcodeSchema }, async (request, reply) => {
    const { barcode } = request.params as { barcode: string };
    const householdId = request.user.householdId;

    // 1. Instant DB Lookup via Drizzle (<2ms)
    const [existing] = await db
      .select()
      .from(productCatalog)
      .where(and(eq(productCatalog.householdId, householdId), eq(productCatalog.barcode, barcode)));

    if (existing) {
      return { source: "local", product: existing };
    }

    // 2. Fallback to Open Food Facts
    const external = await fetchOpenFoodFacts(barcode);
    return { source: "openfoodfacts", product: external };
  });
};
```

---

## 3. Interactive Swagger UI Built-In (`/docs`)

Because Fastify routes declare schemas, Fastify automatically renders an **interactive OpenAPI 3.0 Swagger UI** at `http://localhost:8000/docs`:
* Live endpoint documentation with request/response schemas.
* "Try it out" button to execute requests directly in the browser.
* Zero manual Postman collection maintenance.

---

## 4. Drizzle ORM Connection Pooling in Fastify

In Fastify, database connections are managed via a Fastify plugin decorator so the connection pool is cleanly initialized on startup and gracefully drained on `SIGTERM`:

```typescript
// apps/api/src/plugins/database.ts
import fp from "fastify-plugin";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../lib/db/schema";

export default fp(async (fastify) => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20, // Connection pool
    idleTimeoutMillis: 30000,
  });

  const db = drizzle(pool, { schema });

  // Decorate fastify instance
  fastify.decorate("db", db);
  fastify.decorate("pgPool", pool);

  fastify.addHook("onClose", async () => {
    await pool.end(); // Graceful shutdown on redeploy
  });
});
```

---

## 5. Folder Structure for `apps/api`

```text
apps/api/
├── src/
│   ├── modules/               # Modular Monolith Domains
│   │   ├── auth/              # Setup, Login, Invitations, Session hooks
│   │   ├── catalog/           # Barcodes, Open Food Facts, MinIO uploads
│   │   ├── stock/             # Home inventory & depletion
│   │   ├── cart/              # Prepare -> In-store collect -> Unpack
│   │   ├── finance/           # Expenses, splits, subscriptions
│   │   └── house/             # Maintenance, assets, manuals
│   │
│   ├── plugins/               # Fastify Core Plugins
│   │   ├── database.ts        # Drizzle + Postgres 18 pool
│   │   ├── redis.ts           # Redis 7.2 client
│   │   ├── s3.ts              # MinIO presigned URL generator
│   │   ├── swagger.ts         # Automated OpenAPI docs
│   │   └── auth-guard.ts      # Session cookie authentication hook
│   │
│   ├── lib/
│   │   └── db/
│   │       ├── schema.ts      # Drizzle table definitions
│   │       └── migrations/    # Generated SQL migrations
│   │
│   └── index.ts               # Server bootstrap & listen (Port 8000)
│
├── drizzle.config.ts
├── package.json
└── tsconfig.json
```
