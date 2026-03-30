import { test, expect } from "@playwright/test";

test.describe("Login page", () => {
  test("shows sign-in form with email and password", async ({ page }) => {
    await page.goto("/?mode=signin");

    await expect(page.getByRole("heading", { name: "Logga in" })).toBeVisible();
    await expect(page.getByLabel("E-post")).toBeVisible();
    await expect(page.getByLabel("Lösenord", { exact: true })).toBeVisible();
    await expect(
      page.locator("form").getByRole("button", { name: "Logga in" }),
    ).toBeVisible();
  });

  test("can switch to create account mode", async ({ page }) => {
    await page.goto("/?mode=signin");

    await page.getByRole("button", { name: "Nytt konto" }).click();

    await expect(page.getByRole("heading", { name: "Skapa konto" })).toBeVisible();
    await expect(
      page.locator("form").getByRole("button", { name: "Skapa konto" }),
    ).toBeVisible();
    await expect(page.getByText(/kom igång med kartapp/i)).toBeVisible();
  });
});
