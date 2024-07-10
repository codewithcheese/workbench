import { expect, test } from "@playwright/test";
import { route } from "../src/lib/route";

test("test route", async ({ page }) => {
  await page.goto(route("/test"));

  const greeting = page.getByText(/hello Tom/iu);

  await expect(greeting).toBeVisible();
});
