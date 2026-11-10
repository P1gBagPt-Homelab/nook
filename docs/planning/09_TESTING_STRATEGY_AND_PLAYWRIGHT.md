# 09. Testing Strategy: Unit, Integration, Bruno & Playwright E2E

> **Test Runner**: [Vitest](https://vitest.dev/) (Native ESM & TypeScript, ultra-fast)  
> **API Contracts & Smoke Tests**: [Bruno](https://www.usebruno.com/) (Git-native `.bru` collections + `@usebruno/cli`)  
> **Contract Linting**: [Spectral](https://stoplight.io/open-source/spectral) (OpenAPI 3.1 schema validation in CI)  
> **E2E Automation**: [Playwright](https://playwright.dev/) (Mobile-viewport emulation & browser automation)  
> **Integration Testing**: Fastify `server.inject()` + PostgreSQL test transactions  
> **CI Pipeline**: Janus Self-Hosted GitHub Actions Runner (`.github/workflows/test.yml` / `deploy.yml`)  

Quality assurance is built into every layer of **Nook** following **Project Janus Guide 22**. Tests run locally in sub-seconds and automatically on every `git push` via your self-hosted GitHub Actions runner.

---

## 1. The 4-Tier Testing Pyramid

```
                      ▲
                     / \
                    /   \     🎭 Playwright Mobile E2E
                   / E2E \    (Real browser: iPhone 14 / Pixel 7 emulation)
                  /-------\   (Tests: First-run setup, Barcode scan, Cart unpack)
                 /  Bruno  \  
                /   Smoke   \ 🐶 Bruno CLI (`bru run`) + Spectral Linting
               /-------------\ (Git-native .bru files, OpenAPI validation in CI)
              /  Fastify Inj  \
             /   Integration   \ ⚡ Fastify server.inject() + PostgreSQL
            /-------------------\ (Tests full HTTP routes, Auth cookies, Drizzle SQL)
           /   Unit Tests (Vit)  \
          /                       \ 🧪 Vitest + React Testing Library
         --------------------------- (Zod schemas, calculation helpers, UI components)
```

| Test Type | Framework | Target Scope | Execution Speed |
| :--- | :--- | :--- | :--- |
| **Backend Unit Tests** | Vitest | Zod schemas, barcode parsers, S3 key generators, pricing logic | < 10ms / test |
| **Frontend Unit Tests** | Vitest + RTL | UI components, status badges, optimistic mutations, currency pad | < 30ms / test |
| **Backend Integration** | Vitest + Fastify `server.inject()` | Full API routes, cookie auth guard, Drizzle database transactions | < 50ms / test |
| **API Smoke & Contracts**| Bruno (`bru run`) + Spectral | Git-committed `.bru` tests against live API, OpenAPI spec linting | < 2s for full suite |
| **End-to-End (E2E)** | Playwright (Chromium Mobile) | Complete user journeys (Onboarding, Barcode Scan, Cart Unpack) | 1–3s / scenario |

---

## 2. Git-Native API Testing with Bruno (`bruno/`)

Per **Janus Guide 22**, we do not store API collections in proprietary cloud silos (Postman/Insomnia). All API requests and automated assertions live directly in your Git repository under `bruno/`.

### Directory Layout:
```text
bruno/
├── bruno.json                # Collection metadata
├── environments/
│   ├── Local.bru             # baseUrl: http://localhost:8000
│   └── Janus-Prod.bru        # baseUrl: https://home.janus-lab.duckdns.org
├── 01-Health/
│   ├── Liveness-Healthz.bru
│   ├── Readiness-Readyz.bru
│   └── Version.bru
├── 02-Auth/
│   ├── Setup-Admin.bru
│   ├── Login.bru
│   └── Invite-Member.bru
└── 03-Grocery/
    ├── Scan-Barcode.bru
    ├── Create-Product.bru
    ├── Add-To-Cart.bru
    └── Unpack-To-Stock.bru
```

### Example: `bruno/01-Health/Readiness-Readyz.bru`
```text
meta {
  name: Readiness Check
  type: http
  seq: 1
}

get {
  url: {{baseUrl}}/readyz
  body: none
  auth: none
}

assert {
  res.status: eq 200
  res.body.status: eq ok
  res.body.dependencies.database: eq connected
  res.body.dependencies.redis: eq connected
  res.body.dependencies.storage: eq connected
}
```

### Running Bruno CLI locally:
```bash
bru run bruno --env Local
```

---

## 3. OpenAPI Contract Linting with Spectral

A `.spectral.yaml` file at the repository root guarantees that your Fastify OpenAPI specification never drifts or contains missing descriptions, invalid status codes, or unversioned routes:

```yaml
# .spectral.yaml
extends: "spectral:oas"
rules:
  operation-description: error
  operation-tags: error
  info-contact: off
```

In CI, Spectral runs before Bruno:
```bash
curl -sf http://localhost:8000/openapi.json -o openapi.json
spectral lint openapi.json
```

---

## 2. Backend Unit & Integration Tests (Fastify + Vitest)

Fastify includes an in-process HTTP injection engine (`server.inject()`). This allows you to test full HTTP requests, headers, cookies, and database queries **without binding to a live network port**, running 50+ route tests in under 2 seconds.

### Example: Testing the Barcode Lookup Route

```typescript
// apps/api/src/modules/catalog/__tests__/catalog.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildServer } from "../../../server";
import { FastifyInstance } from "fastify";

describe("Catalog Module - Barcode Lookup", () => {
  let app: FastifyInstance;
  let authCookie: string;

  beforeAll(async () => {
    app = await buildServer({ testing: true });
    await app.ready();

    // Authenticate test user and get session cookie
    const loginRes = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { email: "admin@janus.test", password: "TestPassword123!" },
    });
    authCookie = loginRes.cookies[0].value;
  });

  afterAll(async () => {
    await app.close();
  });

  it("should return existing product from local database in <5ms", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/catalog/scan/5601009941123",
      cookies: { session: authCookie },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.source).toBe("local");
    expect(body.product.title).toBe("Terra Nostra Whole Milk 1L");
  });

  it("should reject invalid barcode lengths with HTTP 400", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/catalog/scan/12", // Too short
      cookies: { session: authCookie },
    });

    expect(response.statusCode).toBe(400);
  });
});
```

---

## 3. Frontend Unit & Component Tests (Vitest + React Testing Library)

Tests UI rendering, currency formatting, category filtering, and optimistic state updates.

### Example: Testing the Grocery Item Card Checkbox

```typescript
// apps/web/src/components/groceries/__tests__/ShoppingItemCard.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ShoppingItemCard } from "../ShoppingItemCard";

describe("ShoppingItemCard", () => {
  it("renders item title, price and triggers onToggle callback", () => {
    const onToggle = vi.fn();
    render(
      <ShoppingItemCard
        title="Bananas 1 bunch"
        price="1.49"
        isChecked={false}
        category="Produce"
        onToggle={onToggle}
      />
    );

    expect(screen.getByText("Bananas 1 bunch")).toBeDefined();
    expect(screen.getByText("€1.49")).toBeDefined();

    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);

    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
```

---

## 4. Playwright End-to-End (E2E) Testing (Mobile Viewport Emulation)

Playwright tests the complete real browser experience on an emulated mobile screen (iPhone 14 / Pixel 7), testing touch events, bottom sheets, camera mocks, and multi-step workflows.

### Playwright Configuration: Emulating Smartphone PWA

```typescript
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: 1,
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "Mobile Chrome (Pixel 7)",
      use: { ...devices["Pixel 7"] },
    },
    {
      name: "Mobile Safari (iPhone 14)",
      use: { ...devices["iPhone 14"] },
    },
  ],
});
```

---

## 5. Critical Playwright E2E Test Scenarios

### Scenario 1: First-Run Admin Setup Flow
1. Open web app when database has 0 users.
2. Verify browser is redirected to `/setup`.
3. Fill Admin Name, Email, Password, Household Name.
4. Submit form.
5. Verify redirected to dashboard with Admin badge.
6. Attempt to visit `/setup` again; verify redirected to dashboard (setup blocked).

### Scenario 2: Admin Member Invitation & First-Time Login
1. Log in as Admin.
2. Navigate to Household Members settings.
3. Invite member "Sarah" (`sarah@test.com`).
4. Copy generated invitation link.
5. In a new incognito context, open the invite link.
6. Verify "Set Your Password" prompt appears.
7. Enter new password and submit.
8. Verify Sarah is logged in with member privileges.

### Scenario 3: The Complete Grocery Shopping & Unpack Journey
1. Open **Shopping Cart** submodule in preparation mode.
2. Add "Oat Milk" and "Eggs 12pk" to cart.
3. Switch to store mode.
4. Mock camera barcode scan of "Oat Milk" (EAN `5601234567890`).
5. Verify "Oat Milk" is checked off and moved to "Collected in Cart".
6. Click **"Arrived Home? Unpack to Stock"**.
7. Bottom sheet drawer glides up with collected items.
8. Click **"Put All into Stock"**.
9. Switch to **My Stock** tab.
10. Verify "Oat Milk" and "Eggs" now appear in Stock with `status: in_stock`.

---

## 6. Automated CI/CD Pipeline (GitHub Actions on Janus Host)

Every test runs automatically on your Janus bare-metal runner:

```yaml
# .github/workflows/test.yml
name: Test Suite (Unit, Integration & E2E)

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: self-hosted # Project Janus runner
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js 22
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: "npm"

      - name: Install Dependencies
        run: npm ci

      - name: Run Backend & Frontend Unit/Integration Tests
        run: npm run test:coverage

      - name: Install Playwright Browsers
        run: npx playwright install --with-deps chromium

      - name: Run Playwright E2E Tests
        run: npm run test:e2e
```
