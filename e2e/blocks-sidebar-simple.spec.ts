import { expect, type Page, test } from "@playwright/test";
import { parseE2eItems, selectedVariantItems } from "../lib/e2e-filter";
import { hydrateAfterReveal, waitForInk } from "./ready";

// Lane B's own checks (SPEC-components-6 §8, Task 119): the simple sidebars sidebar-01 to -06 and
// -14. The catalog-driven ones (axe in both modes, one main, no overflow at 360, the docs preview
// at desktop width, the shots) are e2e/blocks.spec.ts's. Here: each collapses with Ctrl+B and
// with its trigger, becomes a sheet at 360, and names its navigation landmarks uniquely.

const BLOCKS = [
  { name: "sidebar-01", nav: "Handbook", collapsible: "offcanvas" },
  { name: "sidebar-02", nav: "Handbook", collapsible: "offcanvas" },
  { name: "sidebar-03", nav: "Handbook", collapsible: "offcanvas" },
  { name: "sidebar-04", nav: "Handbook", collapsible: "offcanvas", variant: "floating" },
  { name: "sidebar-05", nav: "Handbook", collapsible: "offcanvas" },
  { name: "sidebar-06", nav: "Handbook", collapsible: "offcanvas" },
  { name: "sidebar-14", nav: "Table of contents", collapsible: "offcanvas", side: "right" },
] as const;

const only = selectedVariantItems(parseE2eItems(process.env.E2E_ITEMS));

async function openView(page: Page, name: string) {
  await hydrateAfterReveal(page);
  const response = await page.goto(`/view/${name}`);
  expect(response?.status()).toBe(200);
  await expect(page.locator("html")).toHaveAttribute("data-variant-ready", "true");
  await waitForInk(page);
}

const isPhone = (page: Page) => (page.viewportSize()?.width ?? 0) < 768;

for (const block of BLOCKS) {
  test.describe(block.name, () => {
    test.skip(
      only !== undefined && !only.includes(block.name),
      `E2E_ITEMS leaves ${block.name} out`,
    );

    test("names its landmarks uniquely: one main, the sidebar and the breadcrumb", async ({
      page,
    }) => {
      await openView(page, block.name);
      await expect(page.getByRole("main")).toHaveCount(1);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      await expect(page.getByRole("navigation", { name: "breadcrumb" })).toHaveCount(1);
      if (!isPhone(page)) {
        await expect(page.getByRole("navigation", { name: block.nav })).toHaveCount(1);
      }
    });

    test("collapses with Ctrl+B and with the trigger, and opens again", async ({ page }) => {
      test.skip(isPhone(page), "a phone gets the sheet instead");
      await openView(page, block.name);
      const sidebar = page.locator('[data-slot="sidebar"][data-state]');
      const trigger = page.locator('[data-slot="sidebar-trigger"]');
      await expect(sidebar).toHaveAttribute("data-state", "expanded");
      await expect(sidebar).toHaveAttribute("data-side", "side" in block ? block.side : "left");
      if ("variant" in block) await expect(sidebar).toHaveAttribute("data-variant", block.variant);
      await page.keyboard.press("Control+b");
      await expect(sidebar).toHaveAttribute("data-state", "collapsed");
      await expect(sidebar).toHaveAttribute("data-collapsible", block.collapsible);
      await trigger.click();
      await expect(sidebar).toHaveAttribute("data-state", "expanded");
      await trigger.click();
      await expect(sidebar).toHaveAttribute("data-state", "collapsed");
    });

    test("is a sheet at 360, closed until the trigger opens it", async ({ page }) => {
      test.skip((page.viewportSize()?.width ?? 0) !== 360, "the sheet is the phone's");
      await openView(page, block.name);
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await page.locator('[data-slot="sidebar-trigger"]').click();
      const sheet = page.getByRole("dialog", { name: "Sidebar" });
      await expect(sheet).toBeVisible();
      await expect(sheet.locator('[data-slot="sidebar-menu"]').first()).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(sheet).toBeHidden();
    });
  });
}

test("the docs Files line says sidebar-01 replaces the other sidebars' files", async ({ page }) => {
  test.skip(only !== undefined && !only.includes("sidebar-01"), "E2E_ITEMS leaves sidebar-01 out");
  test.skip((page.viewportSize()?.width ?? 0) !== 1280, "one width is enough for prose");
  const response = await page.goto("/docs/blocks/sidebar-01");
  expect(response?.status()).toBe(200);
  const line = page.locator('[data-slot="item-files"]');
  await expect(line).toContainText("app/dashboard/page.tsx");
  await expect(line).toContainText("sidebar-07");
});
