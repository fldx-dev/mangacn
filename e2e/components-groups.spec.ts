import { resolve } from "node:path";
import { expect, type Page, test } from "@playwright/test";
import { CATEGORY_LABELS, docItems, groupByCategory } from "../lib/docs/catalog";
import { parseE2eItems } from "../lib/e2e-filter";
import { loadRegistry } from "../lib/registry/index";
import { variantEntries } from "../lib/registry/variants.generated";

// The Components index and the docs sidebar in their category groups (SPEC-components-7 §6):
// Primitives, Inputs, Display, Layout, Text, Background, Decoration, Feedback, Animation, Data,
// a heading (or separator) each with its items under it, and none for an empty group. Runs with
// the `site` suite.

const filter = parseE2eItems(process.env.E2E_ITEMS);
test.skip(Boolean(filter) && !filter?.has("site"), "the index checks run with `site`");

/** What the index and the sidebar must show: the documented items in their filled groups. */
const groups = groupByCategory(
  docItems(loadRegistry(resolve(__dirname, "../registry.json")), variantEntries),
).map(([category, items]) => ({
  category,
  label: CATEGORY_LABELS[category],
  names: items.map((item) => item.name),
}));

/** Every heading of the index with the cards under it, in document order. */
function indexGroups(page: Page) {
  return page.locator('[data-slot="component-index"] > section').evaluateAll((sections) =>
    sections.map((section) => ({
      id: section.getAttribute("aria-labelledby") ?? "",
      heading: section.querySelector("h2")?.firstChild?.textContent?.trim() ?? "",
      names: [...section.querySelectorAll<HTMLElement>("[data-item]")].map(
        (card) => card.dataset.item ?? "",
      ),
    })),
  );
}

test("the Components index shows a heading per filled group, in spec order", async ({ page }) => {
  const response = await page.goto("/docs/components");
  expect(response?.status()).toBe(200);
  expect(await indexGroups(page)).toEqual(
    groups.map(({ category, label, names }) => ({
      id: `category-${category}`,
      heading: label,
      names,
    })),
  );
});

test("the Components index does not shift as its previews mount", async ({ page }) => {
  await page.goto("/docs/components");
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => {
    const target = window as unknown as { __shift: number };
    target.__shift = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as unknown as { value: number }[]) {
        target.__shift += entry.value;
      }
    }).observe({ type: "layout-shift" });
  });
  const lazy = page.locator('[data-slot="component-index"] [data-slot="lazy-variant"]');
  for (const box of await lazy.all()) {
    await box.scrollIntoViewIfNeeded();
    await expect(box).toHaveAttribute("data-mounted", "true");
  }
  const shift = await page.evaluate(() => (window as unknown as { __shift: number }).__shift);
  expect(shift, "layout shift while the previews mount").toBeLessThan(0.01);
});

test("the docs sidebar lists the items under a separator per filled group", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "w1280", "the sidebar is a closed drawer below 768 px");
  await page.goto("/docs/components");
  // Every component label, filled or not, so a separator for an empty group would show up.
  const labels = Object.entries(CATEGORY_LABELS)
    .filter(([category]) => category !== "block" && category !== "hook")
    .map(([, label]) => label);
  const entries = await page.locator("#nd-sidebar").evaluate((sidebar, separators) => {
    const out: string[] = [];
    for (const node of sidebar.querySelectorAll<HTMLElement>("p, a[href^='/docs/components/']")) {
      if (node instanceof HTMLAnchorElement) {
        out.push(node.getAttribute("href")?.replace("/docs/components/", "") ?? "");
      } else if (separators.includes(node.textContent?.trim() ?? "")) {
        out.push(`---${node.textContent?.trim()}---`);
      }
    }
    return out;
  }, labels);
  expect(entries).toEqual(groups.flatMap(({ label, names }) => [`---${label}---`, ...names]));
});
