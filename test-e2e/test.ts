import { expect, test } from "@playwright/test";

test("test route", async ({ page }) => {
  await page.goto("/test");

  const greeting = page.getByText(/hello Tom/iu);

  await expect(greeting).toBeVisible();
});
