import { resolve } from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { BLOCKS_CATALOG, docItems } from "../lib/docs/catalog";
import { parseE2eItems, selectedDemoItems } from "../lib/e2e-filter";
import { demoEntries, pageEntries } from "../lib/registry/demos.generated";
import { loadRegistry } from "../lib/registry/index";
import { AXE_DISABLED_RULES } from "../lib/test/axe-rules";
import { paintInkFillsAsCss } from "./ink-fills";
import { waitForInk } from "./ready";

// Page blocks on their own (`/view/<block>`, app/view/[block]) at each project's width, light
// and dark, with the waits and axe pass of the demo stages (e2e/demos.spec.ts); then the Blocks
// index and a page block's framed preview. Baselines are Linux-only (CI); elsewhere the pages
// are loaded and checked without pixels.
const comparePixels = process.platform === "linux";

type AxeResults = Awaited<ReturnType<AxeBuilder["analyze"]>>;

function axeFindings(violations: AxeResults["violations"]) {
  return violations.map(({ id, nodes }) => ({ id, nodes: nodes.map((node) => node.target) }));
}

// `E2E_ITEMS` (playwright.config.ts) keeps the named page blocks' view shots, and the index
// checks under `site`; unset, everything runs.
const filter = parseE2eItems(process.env.E2E_ITEMS);
const only = selectedDemoItems(filter);
const views = only ? pageEntries.filter((entry) => only.includes(entry.block)) : pageEntries;
const checkIndex = !filter || filter.has("site");

/** What the Blocks index must show: one card per block with demos, in catalog order. */
const blockItems = docItems(
  loadRegistry(resolve(__dirname, "../registry.json")),
  demoEntries,
  BLOCKS_CATALOG,
);

/** No error in the console or the page, collected while a test runs. */
function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

async function expectNoOverflow(page: Page) {
  const width = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(width, "no horizontal overflow").toBeLessThanOrEqual(page.viewportSize()?.width ?? 0);
}

for (const { block } of views) {
  for (const mode of ["light", "dark"] as const) {
    test(`${block} view (${mode})`, async ({ page }) => {
      const errors = collectErrors(page);
      const response = await page.goto(`/view/${block}${mode === "dark" ? "?mode=dark" : ""}`);
      expect(response?.status()).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("data-demo-ready", "true");
      if (mode === "dark") await expect(page.locator("html")).toHaveClass(/\bdark\b/);
      await waitForInk(page);

      if (comparePixels) {
        await expect(page).toHaveScreenshot(`${block}-view-${mode}.png`, { fullPage: true });
      }
      await expectNoOverflow(page);

      if (mode === "light") {
        // A whole page: one main, one h1 opening the heading order, every form named.
        await expect(page.getByRole("main")).toHaveCount(1);
        await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
        for (const form of await page.locator("form").all()) {
          await expect(form, "a form with an accessible name").toHaveAccessibleName(/\S/);
        }
        // The page rules too (`region`, `page-has-heading-one`): this is a page, not a fragment.
        const pageRules = AXE_DISABLED_RULES.filter(
          (rule) => rule !== "region" && rule !== "page-has-heading-one",
        );
        const { violations } = await new AxeBuilder({ page })
          .disableRules(pageRules)
          .exclude("[data-base-ui-focus-guard]")
          .analyze();
        expect(axeFindings(violations), "axe violations").toEqual([]);
      }

      // Contrast in both modes, last: the pen's fills become CSS so axe can measure over them.
      await paintInkFillsAsCss(page);
      const { violations } = await new AxeBuilder({ page })
        .withRules(["color-contrast"])
        .exclude("[data-base-ui-focus-guard]")
        .analyze();
      expect(axeFindings(violations), "color-contrast below WCAG AA").toEqual([]);
      expect(errors).toEqual([]);
    });
  }
}

const LAZY = '[data-slot="block-index"] [data-slot="lazy-demo"]';

/** Each preview box's height and whether it has mounted, in document order. */
function previewBoxes(page: Page) {
  return page.locator(LAZY).evaluateAll((nodes) =>
    nodes.map((node) => ({
      height: node.getBoundingClientRect().height,
      mounted: node.getAttribute("data-mounted") === "true",
    })),
  );
}

if (checkIndex) {
  test("the Blocks index: one inert, fixed-height preview card per block", async ({ page }) => {
    const errors = collectErrors(page);
    const response = await page.goto("/docs/blocks");
    expect(response?.status()).toBe(200);

    const cards = await page.locator('[data-slot="block-index"] [data-item]').evaluateAll((nodes) =>
      nodes.map((node) => ({
        name: (node as HTMLElement).dataset.item ?? "",
        href:
          node
            .querySelector<HTMLAnchorElement>('[data-slot="card-title"] a')
            ?.getAttribute("href") ?? "",
      })),
    );
    expect(cards).toEqual(
      blockItems.map((item) => ({ name: item.name, href: `/docs/blocks/${item.name}` })),
    );

    // The boxes keep their height from placeholder to preview, so mounting moves nothing.
    const before = await previewBoxes(page);
    const documentHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect
      .poll(async () => (await previewBoxes(page)).every((box) => box.mounted))
      .toBe(true);
    const after = await previewBoxes(page);
    expect(after.map((box) => box.height)).toEqual(before.map((box) => box.height));
    expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(documentHeight);

    // Inert previews: a page block's frame and every inline demo sit under `inert`, so Tab and
    // the pointer pass them by.
    const live = await page
      .locator(`${LAZY} > *`)
      .evaluateAll((nodes) => nodes.filter((node) => !node.closest("[inert]")).length);
    expect(live, "previews outside an inert subtree").toBe(0);
    await expectNoOverflow(page);

    // The index itself, its previews aside (each has its own stage or view check).
    const { violations } = await new AxeBuilder({ page })
      .disableRules(AXE_DISABLED_RULES)
      .exclude(LAZY)
      .analyze();
    expect(axeFindings(violations), "axe violations").toEqual([]);
    expect(errors).toEqual([]);
  });

  for (const { block } of pageEntries) {
    test(`${block}'s docs page frames the page at three widths`, async ({ page }) => {
      const errors = collectErrors(page);
      const response = await page.goto(`/docs/blocks/${block}`);
      expect(response?.status()).toBe(200);
      const preview = page.locator('[data-slot="block-preview"]');
      const frame = preview.locator("iframe");
      await expect(frame).toHaveAttribute("src", `/view/${block}`);
      const content = await (await frame.elementHandle())?.contentFrame();
      if (!content) throw new Error(`No frame for /view/${block}`);
      await expect(content.locator("html")).toHaveAttribute("data-demo-ready", "true");

      const box = preview.locator('[data-slot="block-preview-box"]');
      const boxHeight = (await box.boundingBox())?.height;
      for (const [label, width] of [
        ["Phone", 375],
        ["Tablet", 768],
        ["Desktop", 1280],
      ] as const) {
        const button = preview.getByRole("button", { name: label });
        await button.click();
        await expect(button).toHaveAttribute("aria-pressed", "true");
        // The page inside lays out at the chosen width, however wide the column is.
        await expect.poll(() => content.evaluate(() => window.innerWidth)).toBe(width);
        expect((await box.boundingBox())?.height, "the box keeps its height").toBe(boxHeight);
      }
      await expectNoOverflow(page);
      expect(errors).toEqual([]);
    });
  }
}
