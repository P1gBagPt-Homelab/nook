import { test, expect } from "@playwright/test";

test("Full Grocery Lifecycle: Add ➔ Collect ➔ Unpack to Stock", async ({ page }) => {
  await page.goto("/");

  // Wait for auth check to settle on Setup, Sign In, or Dashboard
  await expect(
    page
      .locator("h1:has-text('Welcome to Nook')")
      .or(page.locator("h1:has-text('Sign in to Nook')"))
      .or(page.locator("button:has-text('Shopping Cart')"))
  ).toBeVisible();

  if (page.url().includes("/setup")) {
    await page.fill('input[placeholder="Household Name *"]', "Test Household");
    await page.fill('input[placeholder="Your Name *"]', "Daniel");
    await page.fill('input[placeholder="Email Address *"]', "daniel@test.com");
    await page.fill('input[placeholder="Admin Password *"]', "AdminPass1234!");
    await page.click("button:has-text('Create Nook')");
  } else if (await page.locator("h1:has-text('Sign in to Nook')").isVisible()) {
    await page.fill('input[placeholder="Email Address *"]', "daniel@test.com");
    await page.fill('input[placeholder="Password *"]', "AdminPass1234!");
    await page.click("button:has-text('Sign In')");
  }

  await expect(page.locator("button:has-text('Shopping Cart')")).toBeVisible();

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
