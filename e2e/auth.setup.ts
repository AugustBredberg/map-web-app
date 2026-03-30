import fs from "node:fs";
import path from "node:path";
import { test as setup, expect } from "@playwright/test";

const authFile = path.join(__dirname, "..", "playwright", ".auth", "dev.json");

const email = process.env.E2E_DEV_EMAIL ?? "dev@seed.kartapp.test";
const password = process.env.E2E_DEV_PASSWORD ?? "LocalDev_Seed_2026!";

setup("authenticate dev user", async ({ page }) => {
  fs.mkdirSync(path.dirname(authFile), { recursive: true });

  await page.goto("/?mode=signin");
  await page.getByLabel("E-post").fill(email);
  await page.getByLabel("Lösenord", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Logga in" }).click();
  await page.waitForURL("**/map", { timeout: 45_000 });
  await expect(page.getByRole("link", { name: "Karta" })).toBeVisible({
    timeout: 20_000,
  });

  await page.context().storageState({ path: authFile });
});
