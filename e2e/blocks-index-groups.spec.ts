import { resolve } from "node:path";
import { expect, type Page, test } from "@playwright/test";
import { BLOCKS_CATALOG, docItems } from "../lib/docs/catalog";
import { parseE2eItems } from "../lib/e2e-filter";
import { groupBlocks } from "../lib/registry/blocks";
import { demoEntries } from "../lib/registry/demos.generated";
import { loadRegistry } from "../lib/registry/index";

// The Blocks index and the docs sidebar in their groups (SPEC-components-6 §6): Manga, Login,
// Signup, Sidebar, a heading (or separator) each with the blocks under it, from the catalog and
// the blocks' names. Runs with the `site` suite.

const filter = parseE2eItems(process.env.E2E_ITEMS);
test.skip(Boolean(filter) && !filter?.has("site"), "the index checks run with `site`");

/** What the index and the sidebar must show: the documented blocks in their groups. */
const groups = groupBlocks(
  docItems(loadRegistry(resolve(__dirname, "../registry.json")), demoEntries, BLOCKS_CATALOG),
).map((group) => ({
  id: group.id,
  label: group.label,
  names: group.items.map((item) => item.name),
}));

/** Every heading of the index with the cards under it, in document order. */
function indexGroups(page: Page) {
  return page.locator('[data-slot="block-index"] > section').evaluateAll((sections) =>
    sections.map((section) => ({
      id: (section as HTMLElement).dataset.group ?? "",
      heading: section.querySelector("h2")?.firstChild?.textContent?.trim() ?? "",
      names: [...section.querySelectorAll<HTMLElement>("[data-item]")].map(
        (card) => card.dataset.item ?? "",
      ),
    })),
  );
}

test("the Blocks index shows a heading per group with its blocks under it", async ({ page }) => {
  const response = await page.goto("/docs/blocks");
  expect(response?.status()).toBe(200);
  expect(await indexGroups(page)).toEqual(
    groups.map(({ id, label, names }) => ({ id, heading: label, names })),
  );
  // Each heading names its section for assistive tech.
  for (const { id, label } of groups) {
    await expect(page.getByRole("region", { name: new RegExp(`^${label}`) })).toHaveAttribute(
      "data-group",
      id,
    );
  }
});

test("the Blocks index does not shift as its previews mount", async ({ page }) => {
  await page.goto("/docs/blocks");
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
  const lazy = page.locator('[data-slot="block-index"] [data-slot="lazy-demo"]');
  for (const box of await lazy.all()) {
    await box.scrollIntoViewIfNeeded();
    await expect(box).toHaveAttribute("data-mounted", "true");
  }
  const shift = await page.evaluate(() => (window as unknown as { __shift: number }).__shift);
  expect(shift, "layout shift while the previews mount").toBeLessThan(0.01);
});

test("the docs sidebar lists the blocks under a separator per group", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "w1280", "the sidebar is a closed drawer below 768 px");
  await page.goto("/docs/blocks");
  const labels = groups.map((group) => group.label);
  const entries = await page.locator("#nd-sidebar").evaluate((sidebar, separators) => {
    const out: string[] = [];
    for (const node of sidebar.querySelectorAll<HTMLElement>("p, a[href^='/docs/blocks/']")) {
      if (node instanceof HTMLAnchorElement) {
        out.push(node.getAttribute("href")?.replace("/docs/blocks/", "") ?? "");
      } else if (separators.includes(node.textContent?.trim() ?? "")) {
        out.push(`---${node.textContent?.trim()}---`);
      }
    }
    return out;
  }, labels);
  expect(entries).toEqual(groups.flatMap(({ label, names }) => [`---${label}---`, ...names]));
});
