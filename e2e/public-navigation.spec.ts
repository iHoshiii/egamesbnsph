import { expect, test } from "@playwright/test";

test.describe("Public navigation and branding", () => {
  test("home page renders egamesbnsph branding and links", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /egamesbnsph/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /marketplace/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /midmen/i }).first()).toBeVisible();
  });

  test("marketplace and midmen pages load", async ({ page }) => {
    await page.goto("/marketplace");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    await page.goto("/midmen");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("login and register pages render forms", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();

    await page.goto("/register");
    await expect(page.locator('input[name="username"]')).toBeVisible();
  });
});
