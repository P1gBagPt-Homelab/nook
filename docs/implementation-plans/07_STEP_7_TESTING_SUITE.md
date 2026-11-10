# 07. Step 7: Testing Suite (Vitest, Bruno, Spectral & Playwright)

> **Goal**: Set up the full 4-tier testing pyramid: Unit tests (Vitest), Fastify in-process integration tests, Git-native Bruno smoke tests, Spectral OpenAPI linting, and Playwright mobile E2E tests.  
> **Prerequisites**: Steps 1–6 completed.  

---

## 📋 Task 7.1: Fastify In-Process Integration Tests (Vitest)

In `apps/api/vitest.config.ts`:
```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    testTimeout: 10000,
  },
});
```

Create `apps/api/src/modules/cart/__tests__/cart-lifecycle.test.ts`:
```typescript
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { FastifyInstance } from "fastify";
import { buildServer } from "../../../server";

describe("Shopping Cart ➔ Stock Unpack Flow", () => {
  let app: FastifyInstance;
  let authCookie: string;

  beforeAll(async () => {
    app = await buildServer({ testing: true });
    await app.ready();

    // Log in to get session cookie
    const loginRes = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { email: "daniel@test.com", password: "AdminStrongPassword123!" },
    });
    authCookie = loginRes.cookies[0].value;
  });

  afterAll(async () => {
    await app.close();
  });

  it("should fetch active cart in <5ms", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/cart/active",
      cookies: { session: authCookie },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.cart.status).toBe("preparing");
  });
});
```

---

## 📋 Task 7.2: Playwright Configuration (Mobile Viewport Emulation)

At root, install Playwright:
```bash
npm install -D @playwright/test
npx playwright install --with-deps chromium
```

Create root `playwright.config.ts`:
```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: 1,
  workers: 2,
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "Pixel 7 (Android PWA)",
      use: { ...devices["Pixel 7"] },
    },
    {
      name: "iPhone 14 (iOS PWA)",
      use: { ...devices["iPhone 14"] },
    },
  ],
  webServer: [
    {
      command: "npm run dev:api",
      port: 8000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "npm run dev:web",
      port: 3000,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
```

---

## 📋 Task 7.3: Playwright E2E Scenarios (`e2e/`)

### 1. `e2e/01-auth-setup.spec.ts` (Admin First-Run Bootstrap)
```typescript
import { test, expect } from "@playwright/test";

test("First-run onboarding creates Admin and locks /setup", async ({ page }) => {
  await page.goto("/");

  // If uninitialized, app redirects to /setup
  if (page.url().includes("/setup")) {
    await page.fill('input[placeholder="Household Name *"]', "Test Household");
    await page.fill('input[placeholder="Your Name *"]', "Daniel");
    await page.fill('input[placeholder="Email Address *"]', "daniel@test.com");
    await page.fill('input[placeholder="Admin Password *"]', "AdminPass1234!");
    await page.click("button:has-text('Create Nook')");

    // Expect redirect to main dashboard
    await expect(page).toHaveURL("/");
    await expect(page.locator("text=Shopping Cart")).toBeVisible();

    // Visiting /setup again must be forbidden / redirected
    await page.goto("/setup");
    await expect(page).toHaveURL("/");
  }
});
```

### 2. `e2e/02-grocery-lifecycle.spec.ts` (Cart ➔ In-Store Collect ➔ Unpack)
```typescript
import { test, expect } from "@playwright/test";

test("Full Grocery Lifecycle: Add ➔ Collect ➔ Unpack to Stock", async ({ page }) => {
  await page.goto("/groceries");

  // 1. Add item to Shopping Cart
  await page.click("button:has-text('+ Add Item')");
  await page.fill('input[placeholder="Item name..."]', "Organic Oat Milk 1L");
  await page.click("button:has-text('Add to Cart')");
  await expect(page.locator("text=Organic Oat Milk 1L")).toBeVisible();

  // 2. Mark item collected in store
  await page.click('button[aria-label="Collect item"]');
  await expect(page.locator("text=Collected in Cart (1)")).toBeVisible();

  // 3. Unpack Cart
  await page.click("button:has-text('Arrived Home? Unpack to Stock')");
  await page.click("button:has-text('Put All into Stock')");

  // 4. Verify in My Stock tab
  await page.click("button:has-text('My Stock')");
  await expect(page.locator("text=Organic Oat Milk 1L")).toBeVisible();
  await expect(page.locator("text=In Stock")).toBeVisible();
});
```

---

## 📋 Task 7.4: Bruno Test Runner Command

Run all Git-native Bruno smoke tests against the running API:
```bash
bru run bruno --env Local --bail
```

---

## 📋 Task 7.5: Spectral OpenAPI Linter Command

Validate your live API spec against OpenAPI standards:
```bash
curl -sf http://localhost:8000/openapi.json -o openapi.json
spectral lint openapi.json
```

---

## ✅ Acceptance Criteria & Verification

1. Unit & Integration: Run `npm run test` -> 100% green tests in < 3 seconds.
2. Spectral: Run `npm run lint:spectral` -> 0 errors, 0 warnings.
3. Bruno: Run `npm run test:bruno` -> All endpoint smoke tests pass with HTTP 200.
4. Playwright: Run `npm run test:e2e` -> Mobile Chrome & Mobile Safari scenarios execute and pass.
