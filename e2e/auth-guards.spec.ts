import { expect, test } from "@playwright/test";

const PROTECTED_ROUTES = ["/dashboard", "/messages", "/transactions", "/admin"];

test.describe("Unauthenticated route guards", () => {
  for (const route of PROTECTED_ROUTES) {
    test(`redirects ${route} to /login when signed out`, async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveURL(/\/login/);
    });
  }
});
