import { defineConfig, devices } from "@playwright/test";

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment value: ${name}`);
  return value;
}

export default defineConfig({
  expect: {
    timeout: 10_000
  },
  testDir: "./e2e",
  timeout: 60_000,
  use: {
    baseURL: requiredEnv("PLATFORM_WEB_ORIGIN"),
    trace: "on-first-retry"
  },
  webServer: {
    command: "node tools/dev-stack.mjs platform",
    cwd: "../../..",
    reuseExistingServer: true,
    timeout: 120_000,
    url: `${requiredEnv("PLATFORM_WEB_ORIGIN")}/sa`
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ]
});
