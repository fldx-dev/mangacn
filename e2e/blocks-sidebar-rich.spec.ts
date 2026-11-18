import { expect, type Page, test } from "@playwright/test";
import { parseE2eItems, selectedDemoItems } from "../lib/e2e-filter";
import { hydrateAfterReveal, waitForInk } from "./ready";

// Lane C's own checks (SPEC-components-6 §3, §8): the richer sidebars. The catalog-driven ones
// (axe in both modes, one main, no overflow at 360, the docs preview's desktop frame, the shots)
// are e2e/blocks.spec.ts's. Here: each sidebar collapses with Ctrl/⌘+B and with the trigger,
// becomes a sheet at 360, and names every navigation landmark, each name once.

const LANE = ["sidebar-08"] as const;

const only = selectedDemoItems(parseE2eItems(process.env.E2E_ITEMS));

async function openView(page: Page, block: string) {
  await hydrateAfterReveal(page);
  const response = await page.goto(`/view/${block}`);
  expect(response?.status()).toBe(200);
  await expect(page.locator("html")).toHaveAttribute("data-demo-ready", "true");
  await waitForInk(page);
}

const width = (page: Page) => page.viewportSize()?.width ?? 0;

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
      test.skip(width(page) !== 360, "the sheet is a phone's");
      await openView(page, block);
      await expect(page.getByRole("dialog", { name: "Sidebar" })).toHaveCount(0);
      await page.locator('main [data-slot="sidebar-trigger"]').first().click();
      await expect(page.getByRole("dialog", { name: "Sidebar" })).toBeVisible();
    });
  });
}
