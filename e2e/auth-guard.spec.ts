import { test, expect } from "@playwright/test";

/**
 * Admin/manager surfaces are protected: unauthenticated users must not see
 * map, projects list, financial, settings, or tools & materials — they are sent to login.
 */
test.describe("Protected routes", () => {
  for (const path of ["/map", "/projects", "/customers", "/financial", "/settings", "/tools-materials"] as const) {
    test(`redirects ${path} to /login when logged out`, async ({ page }) => {
      await page.goto(path);
      await page.waitForURL("**/login", { timeout: 15_000 });
      await expect(page).toHaveURL(/\/login$/);
      await expect(page.getByRole("heading", { level: 1, name: "Logga in" })).toBeVisible();
    });
  }
});
