import { test, expect } from "@playwright/test";

/**
 * Installer is an org member (not dev): RLS only exposes assigned projects.
 */
test.describe("Installer member", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("sees assigned job only, not admin-only assignment", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("E-post").fill("installer@seed.kartapp.test");
    await page.getByLabel("Lösenord", { exact: true }).fill("LocalDev_Seed_2026!");
    await page.getByRole("button", { name: "Logga in" }).click();
    await page.waitForURL("**/map", { timeout: 45_000 });

    await page.goto("/projects");
    await expect(page.getByText("Solpanel tak — Storgatan")).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByText("Laddbox — parkering Norr")).not.toBeVisible();
  });
});
