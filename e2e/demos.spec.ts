import { expect, test } from "@playwright/test";
import { demoEntries } from "../lib/registry/demos.generated";

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
      await page.evaluate(() => document.fonts.ready);
      // InkFrame shows a CSS fallback until rough.js has drawn; never snapshot that frame.
      await expect(
        page.locator('[data-slot="ink-frame"]:not([data-inked="true"])').filter({ visible: true }),
      ).toHaveCount(0);
      // A web font swap after the first drawing resizes the box; wait until every drawing was
      // measured against the box it now covers, so no frame is captured mid-redraw.
      await page.waitForFunction(() =>
        [...document.querySelectorAll<HTMLElement>('[data-slot="ink-frame"][data-inked="true"]')]
          .filter((host) => host.getClientRects().length > 0)
          .every((host) => {
            const [width, height] = (host.dataset.inkSize ?? "").split("x").map(Number);
            const box = host.getBoundingClientRect();
            return Math.abs(width - box.width) < 1 && Math.abs(height - box.height) < 1;
          }),
      );

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
