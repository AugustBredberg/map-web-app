import { test, expect } from "@playwright/test";

/**
 * Public entry — minimal landing with account creation and sign-in.
 * Default locale is Swedish (sv).
 */
test.describe("Landing (public)", () => {
  test("shows brand, value prop, and account actions", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("Kartapp").first()).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1, name: /på kartan/i }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Logga in" }).first()).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Skapa konto" }),
    ).toBeVisible();
  });

  test("protected /map redirects to landing with sign-in", async ({ page }) => {
    await page.goto("/map");
    await page.waitForURL(/\?mode=signin/, { timeout: 15_000 });
    await expect(page).toHaveURL(/\/\?mode=signin$/);
    await expect(
      page.getByRole("heading", { name: "Logga in" }),
    ).toBeVisible();
  });
});
