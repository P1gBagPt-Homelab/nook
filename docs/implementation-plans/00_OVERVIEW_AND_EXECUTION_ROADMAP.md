# Nook — Master Implementation Plans & Execution Roadmap

> **Project Name**: **Nook** (`nook`)  
> **Repository Path**: `C:\Users\Daniel\Desktop\Projects\Janus\nook`  
> **Repository Architecture**: Decoupled Monorepo (`apps/api` Fastify v5 + `apps/web` Vite React 19 + `packages/shared`)  
> **Deployment Target**: Project Janus Homelab via Coolify (attached to `coolify` external network)  
> **Standards Compliance**: Project Janus Guide 22 (5 Golden Endpoints, Scalar, RFC 7807, Bruno, Spectral, GlitchTip)  

This directory contains the **modular, highly detailed, step-by-step execution plans** for implementing Nook directly within the initialized repository at **`C:\Users\Daniel\Desktop\Projects\Janus\nook`**. Every step is self-contained with exact terminal commands, file paths, code implementations, verification gates, and acceptance criteria.

---

## 🗂️ How the `nook/` Repository is Structured

The repository at `C:\Users\Daniel\Desktop\Projects\Janus\nook` inherits the base homelab blueprints and evolves into the full monorepo:

```text
nook/
├── .github/
│   └── workflows/
│       ├── deploy.yml            # CI test gate (Spectral, Bruno, Vitest, Playwright) + Coolify deploy
│       └── test.yml              # Pull Request CI pipeline
├── .spectral.yaml                # OpenAPI 3.1 contract linting rules
├── .env.example                  # Environment template for nook_db & nook-media
├── docker-compose.yml            # Multi-service compose (api:8000 + web:3000 on 'coolify' net)
├── package.json                  # Root monorepo workspace configuration
│
├── apps/
│   ├── api/                      # ⚡ Dedicated Fastify v5 Backend (Port 8000)
│   │   ├── src/
│   │   │   ├── modules/          # Encapsulated plugins (auth, catalog, cart, stock)
│   │   │   ├── plugins/          # Database (Drizzle), S3 (MinIO), Scalar (/docs)
│   │   │   └── server.ts
│   │   ├── Dockerfile            # Multi-stage Alpine Node.js runner (non-root)
│   │   └── package.json
│   │
│   └── web/                      # 📱 Dedicated Vite React 19 PWA (Port 3000)
│       ├── src/                  # Minimalist joyful UI, camera barcode scanner, bottom drawer
│       ├── Dockerfile            # Multi-stage Nginx Alpine static runner (<10MB RAM)
│       └── package.json
│
├── packages/
│   └── shared/                   # 🔗 Shared TypeScript types & Zod schemas
│       ├── src/
│       │   ├── schemas.ts
│       │   └── types.ts
│       └── package.json
│
├── bruno/                        # 🐶 Git-native Bruno API tests (.bru plain-text files)
│   ├── bruno.json
│   ├── environments/
│   └── 01-Health/ ...
│
├── e2e/                          # 🎭 Playwright mobile tests (Pixel 7 / iPhone 14)
│   └── playwright.config.ts
│
├── docs/                         # Homelab architecture, planning, and implementation plans
│   ├── planning/
│   └── implementation-plans/
│
└── scripts/
    ├── provision-db.sh           # Non-interactive script to provision 'nook_db' on Postgres 18
    └── verify-connections.py     # Connection diagnostic utility
```

---

## 🗺️ Master Step-by-Step Index

| Step | File | Working Directory | Scope & Deliverables |
| :-: | :--- | :--- | :--- |
| **01** | **[01_STEP_1_MONOREPO_SCAFFOLDING.md](./01_STEP_1_MONOREPO_SCAFFOLDING.md)** | `nook/` | Root monorepo setup, `apps/api` (Fastify v5), `apps/web` (Vite React), `packages/shared`, `bruno/` init, `.spectral.yaml`, and `docker-compose.yml`. |
| **02** | **[02_STEP_2_DATABASE_AND_DRIZZLE.md](./02_STEP_2_DATABASE_AND_DRIZZLE.md)** | `nook/apps/api` | PostgreSQL 18 connection pool (`pg`), Drizzle ORM schema, migration scripts, and seed data for `nook_db`. |
| **03** | **[03_STEP_3_AUTH_AND_ADMIN_SETUP.md](./03_STEP_3_AUTH_AND_ADMIN_SETUP.md)** | `nook/apps/api` | First-run Admin bootstrap wizard (`/setup`), Admin-controlled member invitations, Argon2 hashing, and secure session cookies. |
| **04** | **[04_STEP_4_MINIO_PRESIGNED_UPLOADS.md](./04_STEP_4_MINIO_PRESIGNED_UPLOADS.md)** | `nook/apps/api` | MinIO S3 integration, presigned direct client upload engine (`nook-media` bucket), and zero-API-bottleneck photo storage. |
| **05** | **[05_STEP_5_BARCODE_AND_CATALOG.md](./05_STEP_5_BARCODE_AND_CATALOG.md)** | `nook/` | Hardware camera scanner hook, local DB catalog lookup, Open Food Facts fallback resolver, and product digitalization drawer. |
| **06** | **[06_STEP_6_GROCERY_CART_AND_STOCK.md](./06_STEP_6_GROCERY_CART_AND_STOCK.md)** | `nook/` | My Stock inventory management and 3-phase Shopping Cart (Prepare ➔ In-Store Collect ➔ "Arrived Home" Unpack to Stock). |
| **07** | **[07_STEP_7_TESTING_SUITE.md](./07_STEP_7_TESTING_SUITE.md)** | `nook/` | Vitest unit tests, Fastify in-process integration tests, Git-native Bruno collections, Spectral linting, and Playwright mobile E2E. |
| **08** | **[08_STEP_8_JANUS_DEPLOY_AND_CI.md](./08_STEP_8_JANUS_DEPLOY_AND_CI.md)** | `nook/` | 5 Golden Endpoints, RFC 7807 error handler, GlitchTip Sentry tracking, multi-stage Dockerfiles, and Coolify CI/CD workflow. |
| **09** | **[09_PHASE_2_FINANCE_MODULE.md](./09_PHASE_2_FINANCE_MODULE.md)** | `nook/` | Detailed implementation for Phase 2: Category expense tracking, receipt capture, subscription calendar, and shared split ledger. |
| **10** | **[10_PHASE_3_HOUSE_MANAGEMENT.md](./10_PHASE_3_HOUSE_MANAGEMENT.md)** | `nook/` | Detailed implementation for Phase 3: Appliance dossier, MinIO PDF manuals, maintenance schedules, chores, and QR codes. |

---

## 🚦 Non-Negotiable Operational Directives

Before executing any step in `C:\Users\Daniel\Desktop\Projects\Janus\nook`, AI agents and developers must strictly follow these rules:
1. **Target Working Directory**: All development takes place inside `C:\Users\Daniel\Desktop\Projects\Janus\nook`.
2. **No Standalone Database Containers**: Connect to centralized PostgreSQL 18 (`postgres:5432`) and Redis 7.2 (`redis:6379/3`).
3. **Network Attachment**: All containers in `docker-compose.yml` must join the external `coolify` network.
4. **Presigned Uploads Only**: Camera photos must stream directly to MinIO (`http://minio:9000`); the API must never proxy binary images.
5. **Testing Gates**: Every API endpoint must have a corresponding `.bru` test in `bruno/`.
