import { expect, test } from "@playwright/test";
import { parseE2eItems, selectedDemoItems } from "../lib/e2e-filter";
import { demoEntries } from "../lib/registry/demos.generated";
import { waitForInk } from "./ready";

// Every demo in the generated map, light and dark, at each project's width. Baselines are
// Linux-only (CI); elsewhere the page is loaded and checked for errors, without pixels.
const comparePixels = process.platform === "linux";

// Toasts fired on mount by the sonner demos; the snapshot waits until all of them are shown.
const TOASTS_ON_MOUNT: Record<string, number> = {
  "sonner/default": 1,
  "sonner/kinds": 4,
  "sonner/with-action": 1,
};

// `E2E_ITEMS` (playwright.config.ts) keeps only the named items' demos; a name with no demos is
// an error, so a typo never passes by running nothing.
const only = selectedDemoItems(parseE2eItems(process.env.E2E_ITEMS));
const unknown = only?.filter((name) => !demoEntries.some((entry) => entry.item === name)) ?? [];
if (unknown.length > 0)
  throw new Error(`E2E_ITEMS names items without demos: ${unknown.join(", ")}`);
const entries = only ? demoEntries.filter((entry) => only.includes(entry.item)) : demoEntries;

// A panel does not clip, and focus lines start past their box: the layer clips them itself. The
// dogfood run found a page 36 px too wide at 375 px. With the stage's padding gone the panel
// meets both edges of a phone; its own ink frame reaches a few px past them, so the check is
// that the layer adds nothing: the page is as wide with it as without it, and the layer stays
// inside the panel.
if (entries.some((entry) => entry.item === "focus-lines" && entry.demo === "in-a-panel")) {
  test("focus-lines in a panel adds no horizontal overflow at 360 px", async ({ page }) => {
    test.skip(test.info().project.name !== "w360", "one phone width is enough");
    await page.goto("/demo/focus-lines/in-a-panel");
    await expect(page.locator("html")).toHaveAttribute("data-demo-ready", "true");
    await waitForInk(page);
    await page.locator('[data-slot="demo-stage"]').evaluate((stage) => {
      (stage as HTMLElement).style.padding = "0";
    });
    const panel = page.locator('[data-slot="panel"]');
    const layer = panel.locator(':scope > [data-slot="focus-lines"]');
    await expect(layer).toHaveCSS("overflow", "hidden");
    const [panelBox, layerBox] = await Promise.all([panel.boundingBox(), layer.boundingBox()]);
    expect(panelBox?.width, "the panel spans the phone").toBe(360);
    expect(layerBox && panelBox && layerBox.x >= panelBox.x).toBe(true);
    expect(layerBox && panelBox && layerBox.x + layerBox.width <= panelBox.x + panelBox.width).toBe(
      true,
    );
    const scrollWidth = () => page.evaluate(() => document.documentElement.scrollWidth);
    const withLines = await scrollWidth();
    await layer.evaluate((node) => {
      (node as HTMLElement).style.display = "none";
    });
    expect(withLines, "the focus lines widen the page").toBe(await scrollWidth());
  });
}

for (const { item, demo } of entries) {
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
      const toasts = TOASTS_ON_MOUNT[`${item}/${demo}`];
      if (toasts) {
        await expect(page.locator('[data-sonner-toast][data-mounted="true"]')).toHaveCount(toasts);
      }
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
