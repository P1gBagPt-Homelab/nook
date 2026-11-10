# Nook — The Open-Source Modular Household & Life Operating System

> **Project Name**: **Nook** (`nook`)  
> **License**: MIT / FOSS Open-Source  
> **Status**: Ready for Implementation  
> **Architecture**: Monorepo (Dedicated Fastify API + Vite React PWA)  
> **Host Infrastructure**: Project Janus Homelab (`base-project` foundation)

Welcome to **Nook** — a modern, minimalist, open-source household operating system designed for self-hosters and families. Nook seamlessly integrates your grocery stock, collaborative shopping cart, home maintenance, and household finances into one cohesive, joyful platform.

---

## 📑 Complete Documentation Index

| # | Document | Purpose & Summary |
| :-: | :--- | :--- |
| **01** | **[Product Vision & Feature Modules](./01_PRODUCT_VISION_AND_MODULES.md)** | Full breakdown of the core pillars (House Management, Grocery Stock & Cart, Finance) and cross-module synergies. |
| **02** | **[Architecture & Janus Core Services](./02_ARCHITECTURE_AND_JANUS_SERVICES.md)** | Modular monolith topology, host mapping (Postgres 18, Redis 7.2, MinIO S3, RabbitMQ, Ollama GPU), and performance pipeline. |
| **03** | **[Decisions, Trade-Offs & Roadmap](./03_DECISIONS_AND_TRADEOFFS.md)** | Confirmed architectural choices: Fastify + Vite React PWA + Bruno + Scalar + Playwright. |
| **04** | **[Database Schema Specification](./04_DATABASE_SCHEMA_SPEC.md)** | Complete PostgreSQL 18 & Drizzle ORM table definitions, foreign keys, indexes, and entity-relationship models (`nook_db`). |
| **05** | **[API Specification](./05_API_SPECIFICATION.md)** | Endpoints, Zod schemas, 5 Golden Endpoints, RFC 7807 error details, and direct presigned S3 photo uploads. |
| **06** | **[UI/UX Design Tokens & Components](./06_UI_UX_DESIGN_TOKENS_AND_COMPONENTS.md)** | Minimalist design system, subtle joyful color tokens (peach, sage, amber), mobile thumb-zones, scanner reticle, and bottom drawer. |
| **07** | **[Step-by-Step Agent Implementation Plan](./07_STEP_BY_STEP_IMPLEMENTATION_PLAN.md)** | Discrete, sequential tasks for AI agents and developers with explicit commands, file paths, and verification criteria. |
| **08** | **[Fastify Dedicated API Guide](./08_FASTIFY_ARCHITECTURE_GUIDE.md)** | Fastify v5 architecture, Scalar embedded docs (`/docs`), 5 Golden Endpoints, RFC 7807 error details, and GlitchTip correlation. |
| **09** | **[Testing Strategy, Bruno & Playwright](./09_TESTING_STRATEGY_AND_PLAYWRIGHT.md)** | Complete QA plan: Vitest unit tests, Fastify integration tests, Git-native Bruno collections (`bruno/`), Spectral linting, and Playwright mobile E2E. |

---

## 🏛️ System Topology (Nook Monorepo)

```mermaid
graph TD
    subgraph Client Layer
        PWA["📱 Nook Mobile PWA (apps/web - Port 3000)<br/>- Camera Barcode Scanner<br/>- Presigned S3 Direct Uploads<br/>- Joyful Minimalist UI"]
    end

    subgraph Dedicated API Layer
        API["⚡ Nook API (apps/api - Port 8000)<br/>- Fastify v5 (65k+ req/sec, 1-5ms)<br/>- Embedded Scalar Docs (/docs)<br/>- Drizzle ORM (Zero-Overhead Raw SQL)<br/>- 5 Golden Endpoints (/healthz, /readyz)"]
    end

    subgraph Host Infrastructure (External 'coolify' Network)
        PG[("🐘 Postgres 18 (Port 5432)<br/>DB: nook_db")]
        RD[("⚡ Redis 7.2 (Port 6379/3)<br/>Active List Cache")]
        S3[("📦 MinIO S3 (Port 9000)<br/>Bucket: nook-media")]
        RMQ[("🐰 RabbitMQ (Port 5672)<br/>VHost: /nook")]
        AI[("🧠 Ollama RTX 2070 (Port 11434)<br/>Receipt OCR & Meal AI")]
    end

    PWA -->|Direct Photo PUT| S3
    PWA -->|Ultra-Fast REST API| API
    API --> PG
    API --> RD
    API --> S3
    API --> RMQ
    API --> AI
```

---

## 🚀 Dedicated Step-by-Step Implementation Guides

For detailed, step-by-step code and execution instructions, refer to the **[`implementation-plans/`](file:///c:/Users/Daniel/Desktop/Projects/Janus/implementation-plans)** directory:
* **[00. Roadmap & Overview](file:///c:/Users/Daniel/Desktop/Projects/Janus/implementation-plans/00_OVERVIEW_AND_EXECUTION_ROADMAP.md)**
* **[01. Step 1: Monorepo Scaffolding](file:///c:/Users/Daniel/Desktop/Projects/Janus/implementation-plans/01_STEP_1_MONOREPO_SCAFFOLDING.md)**
* **[02. Step 2: PostgreSQL 18 & Drizzle ORM](file:///c:/Users/Daniel/Desktop/Projects/Janus/implementation-plans/02_STEP_2_DATABASE_AND_DRIZZLE.md)**
* **[03. Step 3: Admin Auth & Member Setup](file:///c:/Users/Daniel/Desktop/Projects/Janus/implementation-plans/03_STEP_3_AUTH_AND_ADMIN_SETUP.md)**
* **[04. Step 4: MinIO S3 Presigned Uploads](file:///c:/Users/Daniel/Desktop/Projects/Janus/implementation-plans/04_STEP_4_MINIO_PRESIGNED_UPLOADS.md)**
* **[05. Step 5: Barcode Scanner & Catalog](file:///c:/Users/Daniel/Desktop/Projects/Janus/implementation-plans/05_STEP_5_BARCODE_AND_CATALOG.md)**
* **[06. Step 6: Shopping Cart & Home Stock](file:///c:/Users/Daniel/Desktop/Projects/Janus/implementation-plans/06_STEP_6_GROCERY_CART_AND_STOCK.md)**
* **[07. Step 7: Testing Suite (Vitest, Bruno, Playwright)](file:///c:/Users/Daniel/Desktop/Projects/Janus/implementation-plans/07_STEP_7_TESTING_SUITE.md)**
* **[08. Step 8: Janus Deployment & CI/CD](file:///c:/Users/Daniel/Desktop/Projects/Janus/implementation-plans/08_STEP_8_JANUS_DEPLOY_AND_CI.md)**
* **[09. Phase 2: Personal Finance Module](file:///c:/Users/Daniel/Desktop/Projects/Janus/implementation-plans/09_PHASE_2_FINANCE_MODULE.md)**
* **[10. Phase 3: House Management Module](file:///c:/Users/Daniel/Desktop/Projects/Janus/implementation-plans/10_PHASE_3_HOUSE_MANAGEMENT.md)**

