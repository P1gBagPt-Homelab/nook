# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary users are members of a shared multi-person or couple household running on local homelab infrastructure (`Project Janus`). They need to coordinate grocery needs in real time, keep track of pantry/fridge stock, track home appliance warranties and maintenance, and manage split household living expenses without context fragmentation.

## Product Purpose

Nook is an open-source, modular household and life operating system. It unifies three traditionally fragmented domains—grocery/pantry inventory, home appliance maintenance, and shared household finance—into a single, cohesive, mobile-first experience deployed to a private self-hosted homelab.

## Positioning

Unlike cloud SaaS tools (Splitwise, Bring!, Notion, Todoist) that isolate data into separate silos and charge subscriptions, Nook connects the full domestic lifecycle on local bare-metal infrastructure: buying groceries automatically updates pantry inventory and logs shared ledger expenses in one continuous flow.

## Operating Context

- Deployed on **Project Janus** bare-metal homelab (`Ubuntu Server 24.04 LTS`, Coolify PaaS, Traefik reverse proxy).
- Connects to shared core services via Docker external network `coolify` (`PostgreSQL 18`, `Redis 7.2`, `MinIO S3`, `RabbitMQ`, `GlitchTip`).
- Accessed primarily on smartphones (mobile web / PWA) during fast in-store supermarket runs and kitchen cooking routines, with desktop tablet access for monthly reviews.

## Capabilities and Constraints

- **Grocery & Kitchen (2 Submodules)**:
  - *Shopping Cart*: Preparation, in-store barcode camera scanning / checkoff, and 1-tap "Arrived Home" unpack flow.
  - *Home Stock*: Location-based inventory (Fridge, Pantry, Freezer), depletion tracking, and 1-tap replenishment back to cart.
- **House Management**: Appliance dossier registry, QR code label printing, PDF manual lockers (MinIO S3), and recurring maintenance schedules.
- **Household Finance**: Splitwise-style shared expense splitting, category budgets, and recurring subscriptions tracker.
- **Strict Architecture Invariants**:
  - Never spin up dedicated database containers; connect strictly to multi-tenant `coolify` Postgres/Redis/MinIO services.
  - Zero hardcoded secrets; environment variables driven.
  - Standard `/health` check and metrics.

## Brand Commitments

- **Name**: Nook — Household & Life OS
- **Aesthetic**: "Market Hall Wayfinding" — bright-aisle vitreous enamel legibility, 1px hairline structure, unmistakable pillar color routes, and locked tabular figures.
- **Visual Personality**: Warm enamel cream canvas (`#F7F5EE`), deep rail charcoal (`#14191D`), hairline dividers (`#D6D1C4`), and functional pillar accents: signal vermilion (`#D9381E`, Grocery/Scan), market emerald (`#047857`, Pantry/Unpack), cobalt route (`#1D4ED8`, Finance), amber warning (`#B45309`, Low-Stock/Maintenance), and plum route (`#6D28D9`, House).

## Evidence on Hand

- Production-grade monorepo scaffold (`npm` workspaces with `@nook/api`, `@nook/web`, `@nook/shared`).
- Comprehensive specification blueprints in `docs/planning/` (`01_PRODUCT_VISION_AND_MODULES.md` through `09_TESTING_STRATEGY_AND_PLAYWRIGHT.md`).
- Fully implemented PWA UI with bottom navigation dock, barcode camera scanner modal (`@zxing/browser` + BarcodeDetector API), Vaul bottom drawers, and Lucide icons.

## Product Principles

1. **Zero Context Loss**: Actions bridge domains naturally—supermarket trips automatically stock pantries and log split receipts.
2. **Thumb-First Mobile Ergonomics**: Every critical action, drawer, and scanner trigger sits comfortably within the lower thumb sweep.
3. **Optimistic & Tactile**: Immediate local UI state transitions, haptic vibration pulses, and fluid drawer physics.
4. **Local-First & Private**: Data stays in the household homelab cluster; zero external cloud lock-in.

## Accessibility & Inclusion

- High contrast text (`#18181B` on `#FAFAF8` / `#FFFFFF`).
- Touch targets designed to exceed 44×44px with 9999px pill radii.
- Support for keyboard navigation and screen-reader accessible ARIA labels on bottom dock and scanner controls.
