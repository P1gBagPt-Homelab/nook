# 03. Key Decisions, Trade-Offs & Roadmap

This document records confirmed choices and remaining architectural decisions for the application.

---

## ✅ Confirmed Decisions

| Area | Decision | Details & Strategy |
| :--- | :--- | :--- |
| **Mobile Form Factor** | **Mobile-First PWA (Progressive Web App)** | Installable to phone home screen, full-bleed mobile viewport, zero app store friction. |
| **Offline Scope** | **Online-First (No Offline for now)** | Avoids complex client-side offline syncing engines. Kept lightweight and fast with optimistic UI state. |
| **In-Store Barcode Scanner** | **Camera Barcode Scan + Product Creator** | Scan EAN/UPC barcode with device camera. Auto-lookup in local catalog; if new, pre-fills via Open Food Facts API and opens a sleek bottom sheet to snap photo, enter price, title, and category. Photos stored in MinIO S3. |
| **Notifications** | **Prepared Modular Interface (Dormant)** | Architected with clean event interfaces and database tables, but kept disabled/dormant initially until required. |
| **Design Aesthetic** | **Minimalist with Subtle Happy Colors** | Clean whitespace, crisp typography, warm porcelain backgrounds, with cheerful subtle accents (warm peach, fresh sage, sunshine amber). |
| **Authentication Model** | **Admin-Controlled Invitation (No Public Registration)** | First access triggers a 1-time setup wizard to create the Admin & Household. Public registration is permanently closed. Only the Admin can invite new members. Invited members set their password on first login. |
| **Architecture Pattern** | **Modular Monolith (Decoupled Monorepo)** | Clear domain encapsulation (`modules/`) with single-transaction ACID consistency across cart, stock, and finance, eliminating microservice latency and overhead. |
| **Backend API Engine** | **Dedicated Fastify API (Node 22 + TypeScript)** | Standalone, ultra-high-speed REST API (65k+ req/sec, 1–5ms latency), Drizzle ORM, Zod validation, and automated Swagger OpenAPI interactive docs at `/docs`. Decoupled from the frontend. |
| **API Standards & Docs** | **Janus Guide 22 Standards** | 5 Golden Endpoints (`/healthz`, `/readyz`, `/version`, `/openapi.json`, `/docs`), interactive **Scalar** UI at `/docs` (0MB overhead), and **RFC 7807 Problem Details** error handling with `X-Request-ID` correlation to GlitchTip. |
| **API Testing & Linting** | **Bruno + Spectral (FOSS, $0.00)** | Git-committed `.bru` collection inside repo (`bruno/`) executed in CI via `@usebruno/cli` before Coolify deploys. OpenAPI schema enforced with Spectral. |
| **Frontend PWA & E2E** | **Vite + React 19 + Playwright** | Ultra-fast client PWA, full-bleed mobile viewport, camera scanner, optimistic updates, and Playwright mobile browser tests (Pixel 7 / iPhone 14). |

---

## 🧭 Decision 1: High-Speed Backend & API Architecture

You specified: *"I want a robust API but super fast I dont want to have performance problems"*.

Here are the two best architectural patterns to achieve ultra-fast performance on Project Janus:

### Option A (Recommended): Next.js 15 (Standalone) + Drizzle ORM + Connection Pooling
* **Stack**: Next.js 15 App Router, React 19, TypeScript, **Drizzle ORM** (compiled prepared SQL), `pg` connection pool to PostgreSQL 18, `@aws-sdk/client-s3` (direct MinIO presigned uploads).
* **Performance Profile**:
  * **Database Latency**: 1–3ms (Drizzle emits zero-overhead raw prepared SQL directly on the local Docker network).
  * **API Response Time**: 15–35ms.
  * **Image Uploads**: 0ms server load (Mobile client streams photos directly to MinIO using presigned S3 URLs, so the web API never bottlenecks).
  * **Deploy**: Single lightweight container (`templates/Dockerfile.nodejs`).
* **Why it's great**: Full type-safety shared between frontend and backend, single codebase to maintain, optimistic UI updates.

### Option B: High-Throughput Dedicated API (Fastify / Hono Node) + Vite/Next Frontend
* **Stack**: **Fastify** or **Hono** standalone micro-API container running purely JSON endpoints + separate Next.js/Vite frontend container.
* **Performance Profile**:
  * **API Latency**: 5–15ms (Fastify is one of the fastest Node frameworks in existence, handling 50k+ req/sec).
* **Trade-off**: Requires maintaining two containers and Docker configurations in Coolify rather than one.

> **Recommendation**: **Option A** with Drizzle ORM and direct MinIO presigned streaming gives blazing speed while keeping deployments simple and robust.

---

## 🧭 Decision 2: Product Barcode Fallback Service

When you scan an item for the first time in a supermarket:
* **Option 1**: Local DB first ➔ If missing, query **Open Food Facts API** (free, open-source database of 3M+ products worldwide with names, brands, categories) ➔ Pre-fill the form ➔ You add your custom price and take a photo.
* **Option 2**: Completely manual entry for new products (no external API calls).

> **Recommendation**: Option 1 gives the fastest, most delightful grocery shopping experience.

---

## 🗺️ Implementation Roadmap

### 🏁 Phase 1: Core Foundation & Grocery Scanner (MVP)
1. Initialize repository with `base-project` configuration (Coolify Dockerfile, CI/CD).
2. Database schema migration with PostgreSQL 18:
   - Users & Households
   - `product_catalog` (barcodes, titles, brands, prices, MinIO image keys)
   - `shopping_lists` & `shopping_items`
   - `pantry_items`
3. Mobile PWA shell with minimalist, subtle happy design system.
4. Camera barcode scanner integration with bottom-sheet new product creator.
5. MinIO S3 presigned direct photo uploads.
6. Real-time collaborative shopping list with optimistic tap-to-check.

### 🏁 Phase 2: Personal & Household Finance
1. Expense tracking with category envelopes (Groceries, Home, Utilities).
2. Recurring subscriptions calendar with monthly burn rate.
3. Shared expense split ledger ("Who owes whom").
4. Automatic grocery expense generation from completed shopping trips.

### 🏁 Phase 3: House Management
1. Appliance registry with MinIO PDF manual uploads.
2. Recurring maintenance timers (HVAC, filters).
3. Chores rotation and mobile checklist.

### 🏁 Phase 4: Local AI (Janus RTX 2070 Ollama) & Notifications Activation
1. Receipt OCR extraction via Ollama.
2. Expiring pantry recipe suggestions.
3. Enabling notifications (Telegram / WebPush).
