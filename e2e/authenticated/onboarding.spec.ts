import { test, expect } from "@playwright/test";

/**
 * Self-serve create-org is only for founders (signup_source self_serve).
 * Installers from seed have unknown + an org — they must not stay on create-org.
 */
test.describe("Onboarding routing", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("installer with org is not left on create-org", async ({ page }) => {
    await page.goto("/?mode=signin");
    await page.getByLabel("E-post").fill("installer@seed.kartapp.test");
    await page.getByLabel("Lösenord", { exact: true }).fill("LocalDev_Seed_2026!");
    await page.getByRole("button", { name: "Logga in" }).click();
    await page.waitForURL("**/map", { timeout: 45_000 });

    await page.goto("/onboarding/create-org");
    await page.waitForURL("**/map", { timeout: 20_000 });
    await expect(page.getByRole("link", { name: "Karta" })).toBeVisible({ timeout: 15_000 });
  });

  test("installer does not see self-serve create company CTA in settings", async ({ page }) => {
    await page.goto("/?mode=signin");
    await page.getByLabel("E-post").fill("installer@seed.kartapp.test");
    await page.getByLabel("Lösenord", { exact: true }).fill("LocalDev_Seed_2026!");
    await page.getByRole("button", { name: "Logga in" }).click();
    await page.waitForURL("**/map", { timeout: 45_000 });

    await page.goto("/settings");
    await expect(page.getByRole("button", { name: "Skapa företag" })).toHaveCount(0);
  });
});
