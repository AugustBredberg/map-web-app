import { test, expect } from "@playwright/test";

test.describe("Customers overview (authenticated dev)", () => {
  test("shows seeded customers and jobs", async ({ page }) => {
    await page.goto("/customers");
    await expect(page.getByRole("heading", { level: 1, name: "Kunder" })).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByRole("button", { name: /Solenergi AB/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /E-Mobility Partner/i })).toBeVisible();
    await page.getByRole("button", { name: /Solenergi AB/i }).click();
    await expect(page.getByText("Solpanel tak — Storgatan")).toBeVisible();
  });
});
