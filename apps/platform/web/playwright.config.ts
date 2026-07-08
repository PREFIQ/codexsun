import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  expect: {
    timeout: 10_000
  },
  testDir: "./e2e",
  timeout: 60_000,
  use: {
    baseURL: process.env.PLATFORM_WEB_ORIGIN ?? "http://127.0.0.1:5520",
    trace: "on-first-retry"
  },
  webServer: {
    command: "npm run dev:platform",
    cwd: "../../..",
    reuseExistingServer: true,
    timeout: 120_000,
    url: "http://127.0.0.1:5520/sa"
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ]
});
