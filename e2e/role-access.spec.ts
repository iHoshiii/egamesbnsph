import { expect, test } from "@playwright/test";

const DEFAULT_PASSWORD = process.env.E2E_PASSWORD ?? "password123";

async function signIn(page: import("@playwright/test").Page, email: string) {
  await page.goto("/login");
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(DEFAULT_PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 15_000 });
}

test.describe("Role-based access control", () => {
  test("buyer can view dashboard but cannot access admin panel", async ({ page }) => {
    await signIn(page, "buyer@egamesbnsph.com");
    await expect(page).toHaveURL(/\/dashboard/);

    await page.goto("/admin");
    await expect(page).not.toHaveURL(/\/admin$/);
  });

  test("admin can access admin moderation dashboard", async ({ page }) => {
    await signIn(page, "admin@egamesbnsph.com");
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.getByRole("heading", { name: /admin/i })).toBeVisible();
  });
});
