import { expect, type Page, test } from "@playwright/test";
import { parseE2eItems, selectedVariantItems } from "../lib/e2e-filter";
import { waitForInk } from "./ready";

// Lane E's browser-only checks (SPEC-components-7 §5): tree-view's keyboard in a real browser,
// banner's dismissal keeping focus on the page, and the stat-card grid's columns per width. The
// catalog-driven checks (axe in both modes, no overflow at 360, the shots) are
// e2e/variants.spec.ts's.

const only = selectedVariantItems(parseE2eItems(process.env.E2E_ITEMS));

async function openVariant(page: Page, item: string, variant: string) {
  const response = await page.goto(`/gallery/${item}/${variant}`);
  expect(response?.status()).toBe(200);
  await expect(page.locator("html")).toHaveAttribute("data-variant-ready", "true");
  await waitForInk(page);
}

test.describe("tree-view", () => {
  test.skip(only !== undefined && !only.includes("tree-view"), "E2E_ITEMS leaves it out");

  test("walks the tree with the APG keys from one tab stop", async ({ page }) => {
    await openVariant(page, "tree-view", "default");
    const tree = page.getByRole("tree", { name: "Project files" });
    const item = (name: string) => tree.getByRole("treeitem", { name, exact: true });

    // Tab lands on the selected item, the one tab stop.
    await page.keyboard.press("Tab");
    await expect(item("page-02.psd")).toBeFocused();

    await page.keyboard.press("ArrowUp");
    await expect(item("page-01.psd")).toBeFocused();
    await page.keyboard.press("ArrowLeft");
    await expect(item("pencils")).toBeFocused();
    await page.keyboard.press("ArrowLeft");
    await expect(item("pencils")).toHaveAttribute("aria-expanded", "false");
    await page.keyboard.press("ArrowDown");
    await expect(item("inks")).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await expect(item("inks")).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("ArrowRight");
    await expect(item("page-01.tif")).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(item("page-01.tif")).toHaveAttribute("aria-selected", "true");
    await expect(item("page-02.psd")).toHaveCount(0);

    await page.keyboard.press("Home");
    await expect(item("chapter-01")).toBeFocused();
    await page.keyboard.press("*");
    await expect(item("chapter-02")).toHaveAttribute("aria-expanded", "true");
    await expect(item("character-sheets")).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("End");
    await expect(item("series-bible-with-a-very-long-name-for-every-arc.md")).toBeFocused();
    await page.keyboard.press("h");
    await expect(item("hero.png")).toBeFocused();

    // Still one tab stop: Tab leaves the tree, Shift+Tab comes back to the focused item.
    await expect(tree.locator('[role="treeitem"][tabindex="0"]')).toHaveCount(1);
    await page.keyboard.press("Space");
    await expect(item("hero.png")).toHaveAttribute("aria-selected", "true");
  });

  test("truncates a long label inside its column without overflowing", async ({ page }) => {
    await openVariant(page, "tree-view", "default");
    const label = page
      .getByRole("treeitem", { name: "series-bible-with-a-very-long-name-for-every-arc.md" })
      .locator('[data-slot="tree-view-label"]');
    await expect(label).toHaveAttribute(
      "title",
      "series-bible-with-a-very-long-name-for-every-arc.md",
    );
    const { scroll, client } = await label.evaluate((element) => ({
      scroll: element.scrollWidth,
      client: element.clientWidth,
    }));
    expect(scroll).toBeGreaterThan(client);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      page.viewportSize()?.width ?? 0,
    );
  });
});

test.describe("banner", () => {
  test.skip(only !== undefined && !only.includes("banner"), "E2E_ITEMS leaves it out");

  test("dismissed from the keyboard, it hands focus on and never to the body", async ({ page }) => {
    await openVariant(page, "banner", "default");
    const banner = page.getByRole("region", { name: "Announcement" });
    const close = banner.getByRole("button", { name: "Dismiss announcement" });
    await close.focus();
    await page.keyboard.press("Enter");
    await expect(banner).toHaveCount(0);
    const active = await page.evaluate(() => ({
      body: document.activeElement === document.body,
      tag: document.activeElement?.tagName,
    }));
    expect(active.body).toBe(false);
    // Nothing focusable follows the banner on the stage: focus goes to main.
    expect(active.tag).toBe("MAIN");
  });

  test("at 360 the action drops under the text and close stays top-right", async ({ page }) => {
    await openVariant(page, "banner", "inverted");
    const banner = page.getByRole("region", { name: "Site news" });
    const text = await banner.locator('[data-slot="banner-content"]').boundingBox();
    const action = await banner.locator('[data-slot="banner-action"]').boundingBox();
    const close = await banner.locator('[data-slot="banner-close"]').boundingBox();
    const box = await banner.boundingBox();
    if (!text || !action || !close || !box) throw new Error("banner parts not laid out");
    const narrow = test.info().project.name === "w360";
    if (narrow) expect(action.y).toBeGreaterThanOrEqual(text.y + text.height - 1);
    else
      expect(Math.abs(action.y + action.height / 2 - (text.y + text.height / 2))).toBeLessThan(4);
    expect(close.x + close.width).toBeGreaterThan(box.x + box.width - 16);
    expect(close.y).toBeLessThan(box.y + 16);
  });
});

test.describe("stat-card", () => {
  test.skip(only !== undefined && !only.includes("stat-card"), "E2E_ITEMS leaves it out");

  test("the grid is one column at 360, two at 768 and four at 1280", async ({ page }) => {
    await openVariant(page, "stat-card", "grid");
    const cards = page.locator('[data-slot="stat-card"]');
    await expect(cards).toHaveCount(4);
    const lefts = await cards.evaluateAll((elements) =>
      elements.map((element) => Math.round(element.getBoundingClientRect().left)),
    );
    const columns = new Set(lefts).size;
    const expected = { w360: 1, w768: 2, w1280: 4 }[test.info().project.name];
    expect(columns).toBe(expected);

    // The sparkline keeps its height and stretches with the card.
    const chart = cards.first().locator('[data-slot="chart"]');
    const card = await cards.first().boundingBox();
    const box = await chart.boundingBox();
    expect(Math.round(box?.height ?? 0)).toBe(48);
    expect(box?.width ?? 0).toBeGreaterThan((card?.width ?? 0) - 40);
  });
});
