import { expect, type Locator, type Page, test } from "@playwright/test";
import { parseE2eItems, selectedVariantItems } from "../lib/e2e-filter";
import { hydrateAfterReveal, waitForInk } from "./ready";

// Lane D's own checks (SPEC-components-6 §3, §8): sidebar-12, sidebar-15 and sidebar-16 on their
// /view pages. The catalog-driven ones (axe with contrast in both modes, one main, no overflow at
// 360, the shots, the docs preview's desktop frame) are e2e/blocks.spec.ts's. Here: each sidebar
// collapses with Ctrl+B and with its trigger and is a sheet at 360; the landmarks are named and
// unique; sidebar-15's right sidebar goes with the left and is hidden under lg; sidebar-16's
// header is one banner that stays above the sidebar.

const BLOCKS = {
  "sidebar-12": { navigation: ["Schedule", "breadcrumb"] },
  "sidebar-15": { navigation: ["Notebook", "breadcrumb", "Schedule"] },
  "sidebar-16": { navigation: ["breadcrumb", "Studio"] },
} as const;
type Block = keyof typeof BLOCKS;

const only = selectedVariantItems(parseE2eItems(process.env.E2E_ITEMS));
const blocks = (Object.keys(BLOCKS) as Block[]).filter((block) => !only || only.includes(block));

async function openView(page: Page, block: Block) {
  await hydrateAfterReveal(page);
  const response = await page.goto(`/view/${block}`);
  expect(response?.status()).toBe(200);
  await expect(page.locator("html")).toHaveAttribute("data-variant-ready", "true");
  await waitForInk(page);
}

const widthOf = (page: Page) => page.viewportSize()?.width ?? 0;

/** The sidebar that collapses: the only one, or sidebar-15's left. */
const sidebarOf = (page: Page) => page.locator('[data-slot="sidebar"][data-side="left"]');

/** The control that toggles it: sidebar-16's header button, else the inset's trigger. */
function triggerOf(page: Page, block: Block): Locator {
  return block === "sidebar-16"
    ? page.getByRole("banner").getByRole("button", { name: "Toggle Sidebar" })
    : page.locator('[data-slot="sidebar-trigger"]');
}

for (const block of blocks) {
  test(`${block}: named, unique landmarks around one main`, async ({ page }) => {
    test.skip(widthOf(page) < 1024, "every sidebar shows from lg up");
    await openView(page, block);
    // The calendar's month navigation is the library's own; the page's landmarks are these.
    const names = await page
      .getByRole("navigation")
      .evaluateAll((navs) => navs.map((nav) => nav.getAttribute("aria-label")));
    const own = names.filter((name) => name !== "Navigation bar");
    expect(own).toEqual([...BLOCKS[block].navigation]);
    expect(new Set(own).size).toBe(own.length);
    await expect(page.getByRole("main")).toHaveCount(1);
  });

  test(`${block}: collapses with Ctrl+B and with the trigger`, async ({ page }) => {
    test.skip(widthOf(page) < 768, "a sheet below 768 px");
    await openView(page, block);
    const sidebar = sidebarOf(page);
    await expect(sidebar).toHaveAttribute("data-state", "expanded");
    await page.keyboard.press("Control+b");
    await expect(sidebar).toHaveAttribute("data-state", "collapsed");
    await triggerOf(page, block).click();
    await expect(sidebar).toHaveAttribute("data-state", "expanded");
    await page.keyboard.press("Control+b");
    await expect(sidebar).toHaveAttribute("data-state", "collapsed");
    await page.keyboard.press("Control+b");
    await expect(sidebar).toHaveAttribute("data-state", "expanded");
  });

  test(`${block}: a sheet at 360, opened by the trigger`, async ({ page }) => {
    test.skip(widthOf(page) !== 360, "the phone width");
    await openView(page, block);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await triggerOf(page, block).click();
    const sheet = page.getByRole("dialog", { name: "Sidebar" });
    await expect(sheet).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(1);
    await page.keyboard.press("Escape");
    await expect(sheet).toBeHidden();
  });
}

if (blocks.includes("sidebar-15")) {
  test("sidebar-15: the right sidebar shows from lg up and goes away with the left", async ({
    page,
  }) => {
    await openView(page, "sidebar-15");
    const right = page.locator('[data-slot="sidebar"][aria-label="Schedule"]');
    if (widthOf(page) < 1024) {
      await expect(right, "hidden under lg, as in stock").toBeHidden();
      return;
    }
    await expect(right).toBeVisible();
    await expect(right.getByRole("grid")).toBeVisible();
    await page.keyboard.press("Control+b");
    await expect(right).toBeHidden();
    await triggerOf(page, "sidebar-15").click();
    await expect(right).toBeVisible();
  });
}

if (blocks.includes("sidebar-16")) {
  test("sidebar-16: one banner, sticky above the sidebar", async ({ page }) => {
    await openView(page, "sidebar-16");
    const banner = page.getByRole("banner");
    await expect(banner).toHaveCount(1);
    const height = (await banner.boundingBox())?.height ?? 0;
    expect(height).toBeGreaterThan(0);

    if (widthOf(page) >= 768) {
      // The sidebar starts under the header and fills the rest of the window.
      const container = page.locator('[data-slot="sidebar-container"]');
      const box = await container.boundingBox();
      expect(Math.round(box?.y ?? -1)).toBe(Math.round(height));
      // The header paints above it.
      const top = await page.evaluate(
        ([x, y]) => document.elementFromPoint(x, y)?.closest("header") !== null,
        [10, Math.floor(height / 2)],
      );
      expect(top, "the header is on top at its own height").toBe(true);
    }

    // Scrolled, the header stays at the top of the window (the page is a screen tall under md).
    const scrolls = await page.evaluate(
      () => document.documentElement.scrollHeight > window.innerHeight,
    );
    test.skip(!scrolls, "the page fits the window at this width");
    await page.evaluate(() => window.scrollTo(0, 400));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
    expect(Math.round((await banner.boundingBox())?.y ?? -1)).toBe(0);
  });
}
