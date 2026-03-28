import { test, expect } from "@playwright/test";

test.describe("Map (authenticated dev)", () => {
  test("sidebar shows seeded organization", async ({ page }) => {
    await page.goto("/map");
    await expect(page.getByText("Demo Installation AB")).toBeVisible({
      timeout: 20_000,
    });
  });
});
