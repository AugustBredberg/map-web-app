import { test, expect } from "@playwright/test";

test.describe("Projects (authenticated dev)", () => {
  test("lists seeded jobs", async ({ page }) => {
    await page.goto("/projects");
    await expect(page.getByText("Solpanel tak — Storgatan")).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByText("Laddbox — parkering Norr")).toBeVisible();
  });
});
