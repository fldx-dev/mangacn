import { expect, test } from "@playwright/test";
import { demoEntries } from "../lib/registry/demos.generated";
import { waitForInk } from "./ready";

// Every demo in the generated map, light and dark, at each project's width. Baselines are
// Linux-only (CI); elsewhere the page is loaded and checked for errors, without pixels.
const comparePixels = process.platform === "linux";

for (const { item, demo } of demoEntries) {
  for (const mode of ["light", "dark"] as const) {
    test(`${item}/${demo} (${mode})`, async ({ page }) => {
      const errors: string[] = [];
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      page.on("pageerror", (error) => errors.push(error.message));

      const query = mode === "dark" ? "?mode=dark" : "";
      const response = await page.goto(`/demo/${item}/${demo}${query}`);
      expect(response?.status()).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("data-demo-ready", "true");
      if (mode === "dark") await expect(page.locator("html")).toHaveClass(/\bdark\b/);
      await waitForInk(page);

      if (comparePixels) {
        await expect(page).toHaveScreenshot(`${item}-${demo}-${mode}.png`, { fullPage: true });
      }

      const width = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(width, "no horizontal overflow").toBeLessThanOrEqual(page.viewportSize()?.width ?? 0);
      // A table scrolls only as far as the table itself: drawings past its edges (row rules
      // reach 8 px out) must not give a table that fits a scrollbar.
      const tables = await page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>('[data-slot="table-container"]')].map(
          (container) => ({
            scroll: container.scrollWidth,
            fits: Math.max(
              container.clientWidth,
              container.querySelector("table")?.offsetWidth ?? 0,
            ),
          }),
        ),
      );
      for (const { scroll, fits } of tables) {
        expect(scroll, "table container overflow").toBeLessThanOrEqual(fits);
      }
      expect(errors).toEqual([]);
    });
  }
}
