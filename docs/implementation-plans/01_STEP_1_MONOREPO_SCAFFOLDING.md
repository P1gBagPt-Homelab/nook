# 01. Step 1: Monorepo Scaffolding & Base Infrastructure

> **Goal**: Initialize the Nook decoupled monorepo workspace inside `C:\Users\Daniel\Desktop\Projects\Janus\nook`, set up `apps/api` (Fastify v5), `apps/web` (Vite React 19), `packages/shared`, `bruno/`, and root `docker-compose.yml`.  
> **Working Directory**: `C:\Users\Daniel\Desktop\Projects\Janus\nook`  
> **Prerequisites**: Node.js 22 LTS, npm / pnpm installed on developer machine.  

---

## 📋 Task 1.1: Root Monorepo Initialization

1. Navigate to the `nook` directory:
   ```bash
   cd C:\Users\Daniel\Desktop\Projects\Janus\nook
   ```

2. In the `nook/` root, create or update `package.json`:
   ```json
   {
     "name": "nook",
     "version": "1.0.0",
     "private": true,
     "description": "Nook — Open-Source Modular Household & Life Operating System",
     "workspaces": [
       "apps/*",
       "packages/*"
     ],
     "scripts": {
       "dev": "npm run dev --workspaces --parallel",
       "dev:api": "npm run dev --workspace=@nook/api",
       "dev:web": "npm run dev --workspace=@nook/web",
       "build": "npm run build --workspaces",
       "test": "npm run test --workspaces",
       "lint:spectral": "spectral lint http://localhost:8000/openapi.json",
       "test:bruno": "bru run bruno --env Local --bail",
       "test:e2e": "playwright test"
     },
     "devDependencies": {
       "@stoplight/spectral-cli": "^6.14.0",
       "@usebruno/cli": "^1.39.0",
       "prettier": "^3.4.0",
       "typescript": "^5.7.0"
     }
   }
   ```

2. Create root `.gitignore`:
   ```text
   node_modules/
   dist/
   build/
   .next/
   .env
   .env.local
   *.log
   coverage/
   test-results/
   playwright-report/
   ```

---

## 📋 Task 1.2: Shared Package (`packages/shared`)

1. Create directory:
   ```bash
   mkdir -p packages/shared/src
   ```

2. Create `packages/shared/package.json`:
   ```json
   {
     "name": "@nook/shared",
     "version": "1.0.0",
     "private": true,
     "main": "./src/index.ts",
     "types": "./src/index.ts",
     "dependencies": {
       "zod": "^3.24.0"
     }
   }
   ```

3. Create `packages/shared/src/index.ts`:
   ```typescript
   export * from "./schemas";
   export * from "./types";
   ```

4. Create `packages/shared/src/schemas.ts`:
   ```typescript
   import { z } from "zod";

   // Auth Schemas
   export const setupAdminSchema = z.object({
     householdName: z.string().min(2).max(64),
     name: z.string().min(2).max(64),
     email: z.string().email(),
     password: z.string().min(8).max(128),
   });

   export const loginSchema = z.object({
     email: z.string().email(),
     password: z.string().min(1),
   });

   // Catalog Schemas
   export const createProductSchema = z.object({
     barcode: z.string().min(4).max(64),
     title: z.string().min(1).max(128),
     brand: z.string().max(64).optional(),
     category: z.string().default("General"),
     unit: z.string().default("pcs"),
     defaultPrice: z.number().positive().optional(),
     imageKey: z.string().optional(),
   });

   // Cart & Stock Schemas
   export const unpackCartSchema = z.object({
     transferAll: z.boolean().default(true),
     itemIds: z.array(z.string().uuid()).optional(),
     targetLocation: z.string().default("Pantry"),
     logExpense: z.boolean().default(false),
     totalAmount: z.number().positive().optional(),
   });
   ```

5. Create `packages/shared/src/types.ts`:
   ```typescript
   import { z } from "zod";
   import { setupAdminSchema, loginSchema, createProductSchema, unpackCartSchema } from "./schemas";

   export type SetupAdminInput = z.infer<typeof setupAdminSchema>;
   export type LoginInput = z.infer<typeof loginSchema>;
   export type CreateProductInput = z.infer<typeof createProductSchema>;
   export type UnpackCartInput = z.infer<typeof unpackCartSchema>;

   export interface UserProfile {
     id: string;
     householdId: string;
     email: string;
     name: string;
     role: "admin" | "member" | "viewer";
     mustSetPassword: boolean;
   }
   ```

---

## 📋 Task 1.3: Dedicated Fastify API (`apps/api`)

1. Initialize directory and dependencies:
   ```bash
   mkdir -p apps/api/src/{plugins,modules,lib}
   ```
   In `apps/api/package.json`:
   ```json
   {
     "name": "@nook/api",
     "version": "1.0.0",
     "private": true,
     "scripts": {
       "dev": "tsx watch src/index.ts",
       "build": "tsc",
       "start": "node dist/index.js",
       "test": "vitest run"
     },
     "dependencies": {
       "@fastify/cookie": "^11.0.0",
       "@fastify/cors": "^10.0.0",
       "@fastify/sensible": "^6.0.0",
       "@fastify/swagger": "^9.4.0",
       "@nook/shared": "*",
       "@scalar/fastify-api-reference": "^1.25.0",
       "argon2": "^0.41.0",
       "dotenv": "^16.4.0",
       "drizzle-orm": "^0.39.0",
       "fastify": "^5.2.0",
       "fastify-plugin": "^5.0.0",
       "jose": "^5.9.0",
       "pg": "^8.13.0",
       "zod": "^3.24.0"
     },
     "devDependencies": {
       "@types/node": "^22.0.0",
       "@types/pg": "^8.11.0",
       "drizzle-kit": "^0.30.0",
       "tsx": "^4.19.0",
       "typescript": "^5.7.0",
       "vitest": "^3.0.0"
     }
   }
   ```

2. Create basic `apps/api/src/index.ts`:
   ```typescript
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
         info: { title: "Nook API", version: "1.0.0" },
       },
     });

     await app.register(scalarTheme, {
       routePrefix: "/docs",
       configuration: { theme: "elysia" },
     });

     app.get("/healthz", async () => ({ status: "alive" }));
     app.get("/openapi.json", async () => app.swagger());

     const port = Number(process.env.PORT) || 8000;
     await app.listen({ port, host: "0.0.0.0" });
     console.log(`🚀 Nook API running at http://localhost:${port}`);
     console.log(`📖 Scalar Docs at http://localhost:${port}/docs`);
   }

   main().catch((err) => {
     app.log.error(err);
     process.exit(1);
   });
   ```

---

## 📋 Task 1.4: Mobile-First Vite React PWA (`apps/web`)

1. Initialize Vite React TypeScript project:
   ```bash
   npm create vite@latest apps/web -- --template react-ts
   ```

2. In `apps/web`, install core UI dependencies:
   ```bash
   cd apps/web
   npm install @nook/shared tailwindcss @tailwindcss/vite clsx tailwind-merge lucide-react vaul framer-motion @tanstack/react-query
   ```

3. Configure PWA metadata in `apps/web/index.html`:
   ```html
   <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
   <meta name="theme-color" content="#FAFAF8" />
   <meta name="apple-mobile-web-app-capable" content="yes" />
   <meta name="apple-mobile-web-app-status-bar-style" content="default" />
   <link rel="manifest" href="/manifest.json" />
   <title>Nook</title>
   ```

4. Create `apps/web/public/manifest.json`:
   ```json
   {
     "name": "Nook",
     "short_name": "Nook",
     "description": "Your Open-Source Household & Life Operating System",
     "start_url": "/",
     "display": "standalone",
     "background_color": "#FAFAF8",
     "theme_color": "#FAFAF8",
     "icons": [
       { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
       { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
     ]
   }
   ```

---

## 📋 Task 1.5: Bruno Git-Native Test Setup (`bruno/`)

1. Initialize `bruno/` structure:
   ```bash
   mkdir -p bruno/environments bruno/01-Health
   ```

2. Create `bruno/bruno.json`:
   ```json
   {
     "version": "1",
     "name": "Nook API",
     "type": "collection",
     "ignore": ["node_modules", ".git"]
   }
   ```

3. Create `bruno/environments/Local.bru`:
   ```text
   vars {
     baseUrl: http://localhost:8000
   }
   ```

4. Create `bruno/01-Health/Liveness-Healthz.bru`:
   ```text
   meta {
     name: Liveness Check
     type: http
     seq: 1
   }

   get {
     url: {{baseUrl}}/healthz
     body: none
     auth: none
   }

   assert {
     res.status: eq 200
     res.body.status: eq alive
   }
   ```

---

## 📋 Task 1.6: Spectral OpenAPI Linter & Docker Compose

1. Create root `.spectral.yaml`:
   ```yaml
   extends: "spectral:oas"
   rules:
     operation-description: error
     operation-tags: error
     info-contact: off
   ```

2. Create root `docker-compose.yml`:
   ```yaml
   version: '3.8'

   services:
     api:
       build:
         context: .
         dockerfile: apps/api/Dockerfile
       container_name: nook-api
       restart: unless-stopped
       ports:
         - "8000:8000"
       environment:
         - NODE_ENV=production
         - DATABASE_URL=${DATABASE_URL}
         - REDIS_URL=${REDIS_URL}
         - S3_ENDPOINT=${S3_ENDPOINT}
         - S3_BUCKET=${S3_BUCKET:-nook-media}
         - S3_ACCESS_KEY=${S3_ACCESS_KEY}
         - S3_SECRET_KEY=${S3_SECRET_KEY}
       networks:
         - coolify
       healthcheck:
         test: ["CMD", "curl", "-f", "http://localhost:8000/healthz"]
         interval: 30s
         timeout: 5s
         retries: 3

     web:
       build:
         context: .
         dockerfile: apps/web/Dockerfile
       container_name: nook-web
       restart: unless-stopped
       ports:
         - "3000:80"
       networks:
         - coolify

   networks:
     coolify:
       external: true
   ```

---

## ✅ Acceptance Criteria & Verification

1. Run `npm install` from the root; all workspaces link cleanly without errors.
2. In terminal 1, run `npm run dev:api`:
   * Fastify starts on port 8000.
   * Visiting `http://localhost:8000/docs` displays the interactive **Scalar** interface.
   * Visiting `http://localhost:8000/healthz` returns `{"status":"alive"}`.
3. In terminal 2, run `bru run bruno --env Local`:
   * The `Liveness-Healthz.bru` test executes and passes (1/1 green).
