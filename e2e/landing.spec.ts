import { test, expect } from "@playwright/test";

/**
 * Public marketing / entry — map-first product surfaces the map as primary CTA.
 * Default locale is Swedish (sv).
 */
test.describe("Landing (public)", () => {
  test("shows app name and primary path to the map", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Kartapp");
    await expect(page.getByRole("link", { name: "Öppna karta" })).toBeVisible();
    await expect(page.getByText(/interaktiv kartplattform/i)).toBeVisible();
  });

  test('"Öppna karta" goes to /map (then login when unauthenticated)', async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Öppna karta" }).click();
    await page.waitForURL("**/login");
    await expect(page).toHaveURL(/\/login$/);
  });
});
