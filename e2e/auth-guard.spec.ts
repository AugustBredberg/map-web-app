import { test, expect } from "@playwright/test";

/**
 * Admin/manager surfaces are protected: unauthenticated users must not see
 * map, projects list, financial, settings, or tools & materials — they are sent to the landing sign-in panel.
 */
test.describe("Protected routes", () => {
  for (const path of ["/map", "/projects", "/customers", "/financial", "/settings", "/tools-materials"] as const) {
    test(`redirects ${path} to landing sign-in when logged out`, async ({ page }) => {
      await page.goto(path);
      await page.waitForURL(/\?mode=signin/, { timeout: 15_000 });
      await expect(page).toHaveURL(/\/\?mode=signin$/);
      await expect(page.getByRole("heading", { name: "Logga in" })).toBeVisible();
    });
  }
});
