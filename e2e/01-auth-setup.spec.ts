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
