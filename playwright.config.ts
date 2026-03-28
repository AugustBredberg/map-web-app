import path from "node:path";
import { config as loadEnv } from "dotenv";
import { defineConfig, devices } from "@playwright/test";

loadEnv({ path: path.resolve(__dirname, ".env.local"), quiet: true });
loadEnv({ path: path.resolve(__dirname, ".env.e2e"), override: true, quiet: true });

const authFile = path.join(__dirname, "playwright", ".auth", "dev.json");

/** When set, runs auth setup + tests in `e2e/authenticated/` against local Supabase + seed. */
const runAuthE2E = process.env.E2E_LOCAL_SUPABASE === "1";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  projects: [
    ...(runAuthE2E
      ? [
          { name: "setup", testMatch: /auth\.setup\.ts/ },
          {
            name: "chromium-authenticated",
            dependencies: ["setup"],
            testMatch: /authenticated\/.*\.spec\.ts/,
            use: {
              ...devices["Desktop Chrome"],
              storageState: authFile,
            },
          },
        ]
      : []),
    {
      name: "chromium",
      testMatch: /.*\.spec\.ts/,
      testIgnore: [/auth\.setup\.ts/, /authenticated\/.*\.spec\.ts/],
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: { ...process.env },
  },
});
