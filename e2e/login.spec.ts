import { test, expect } from "@playwright/test";

test.describe("Login page", () => {
  test("shows sign-in form with email and password", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByRole("heading", { level: 1, name: "Logga in" })).toBeVisible();
    await expect(page.getByLabel("E-post")).toBeVisible();
    await expect(page.getByLabel("Lösenord", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Logga in" })).toBeVisible();
  });

  test("can switch to create account mode", async ({ page }) => {
    await page.goto("/login");

    await page.getByRole("button", { name: "Registrera dig" }).click();

    await expect(
      page.getByRole("heading", { level: 1, name: "Skapa konto" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Skapa konto" })).toBeVisible();
    await expect(page.getByText(/kom igång med kartapp/i)).toBeVisible();
  });
});
