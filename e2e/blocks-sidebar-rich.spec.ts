import { expect, type Page, test } from "@playwright/test";
import { parseE2eItems, selectedVariantItems } from "../lib/e2e-filter";
import { hydrateAfterReveal, waitForInk } from "./ready";

// Lane C's own checks (SPEC-components-6 §3, §8): the richer sidebars. The catalog-driven ones
// (axe in both modes, one main, no overflow at 360, the docs preview's desktop frame, the shots)
// are e2e/blocks.spec.ts's. Here: each app shell collapses with Ctrl/⌘+B and with the trigger
// and becomes a sheet at 360; every block names each navigation landmark, each name once; and
// sidebar-13's settings dialog opens from the page, holds focus and shows its named sidebar from
// md up (stock's sidebar there does not collapse: it is hidden under md).

const SHELLS = ["sidebar-08", "sidebar-09", "sidebar-10", "sidebar-11"] as const;
const LANE = [...SHELLS, "sidebar-13"] as const;

const only = selectedVariantItems(parseE2eItems(process.env.E2E_ITEMS));

async function openView(page: Page, block: string) {
  await hydrateAfterReveal(page);
  const response = await page.goto(`/view/${block}`);
  expect(response?.status()).toBe(200);
  await expect(page.locator("html")).toHaveAttribute("data-variant-ready", "true");
  await waitForInk(page);
}

const width = (page: Page) => page.viewportSize()?.width ?? 0;
const isShell = (block: string) => (SHELLS as readonly string[]).includes(block);

for (const block of LANE) {
  test.describe(block, () => {
    test.skip(only !== undefined && !only.includes(block), `E2E_ITEMS leaves ${block} out`);

    test("names every navigation landmark, each name once", async ({ page }) => {
      await openView(page, block);
      await expect(page.getByRole("main")).toHaveCount(1);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      const names = await page
        .getByRole("navigation")
        .evaluateAll((navs) => navs.map((nav) => nav.getAttribute("aria-label") ?? ""));
      for (const name of names) expect(name, "a navigation landmark without a name").not.toBe("");
      expect(new Set(names).size, `navigation names: ${names.join(", ")}`).toBe(names.length);
    });

    test("collapses with Ctrl+B and with the trigger, and opens again", async ({ page }) => {
      test.skip(!isShell(block), "sidebar-13's sidebar does not collapse, as stock's");
      test.skip(width(page) < 768, "a phone has the sheet instead");
      await openView(page, block);
      const sidebar = page.locator('[data-slot="sidebar"][data-state]').first();
      await expect(sidebar).toHaveAttribute("data-state", "expanded");
      await page.keyboard.press("ControlOrMeta+b");
      await expect(sidebar).toHaveAttribute("data-state", "collapsed");
      await page.locator('main [data-slot="sidebar-trigger"]').first().click();
      await expect(sidebar).toHaveAttribute("data-state", "expanded");
    });

    test("is a sheet at 360, closed until the trigger opens it", async ({ page }) => {
      test.skip(!isShell(block), "sidebar-13's sidebar does not collapse, as stock's");
      test.skip(width(page) !== 360, "the sheet is a phone's");
      await openView(page, block);
      await expect(page.getByRole("dialog", { name: "Sidebar" })).toHaveCount(0);
      await page.locator('main [data-slot="sidebar-trigger"]').first().click();
      await expect(page.getByRole("dialog", { name: "Sidebar" })).toBeVisible();
    });
  });
}

test.describe("sidebar-13's settings dialog", () => {
  test.skip(only !== undefined && !only.includes("sidebar-13"), "E2E_ITEMS leaves sidebar-13 out");

  test("opens from the page, holds focus, and gives it back on Escape", async ({ page }) => {
    await openView(page, "sidebar-13");
    const button = page.getByRole("button", { name: "Open Dialog" });
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await button.click();
    const dialog = page.getByRole("dialog", { name: "Settings" });
    await expect(dialog).toBeVisible();
    // The modal hides the page from the tree; in the DOM it is still one main, the dialog none.
    await expect(page.locator("main")).toHaveCount(1);
    await expect(dialog.locator("main")).toHaveCount(0);
    // Base UI's focus guards hand focus back into the popup a moment after a Tab leaves it.
    for (let i = 0; i < 16; i += 1) {
      await page.keyboard.press("Tab");
      await expect
        .poll(() => dialog.evaluate((node) => node.contains(document.activeElement)), {
          message: `focus left the dialog after ${i + 1} Tab presses`,
        })
        .toBe(true);
    }
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(button).toBeFocused();
  });

  test("shows the named sections from md up, as stock's sidebar does", async ({ page }) => {
    await openView(page, "sidebar-13");
    await page.getByRole("button", { name: "Open Dialog" }).click();
    const dialog = page.getByRole("dialog", { name: "Settings" });
    const nav = dialog.locator('[data-slot="sidebar"][aria-label="Settings sections"]');
    await expect(nav).toHaveCount(1);
    if (width(page) < 768) {
      await expect(nav).toBeHidden();
    } else {
      await expect(nav).toBeVisible();
      await expect(dialog.getByRole("navigation", { name: "Settings sections" })).toBeVisible();
      await expect(nav.getByRole("link")).toHaveCount(12);
    }
  });
});
