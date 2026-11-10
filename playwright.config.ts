import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: 1,
  workers: 1,
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
      timeout: 120 * 1000,
    },
    {
      command: "npm run dev:web",
      port: 3000,
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
  ],
});
