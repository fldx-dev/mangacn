import { resolve } from "node:path";
import { expect, test } from "@playwright/test";
import { BLOCKS_CATALOG, docItems } from "../lib/docs/catalog";
import { parseE2eItems } from "../lib/e2e-filter";
import { BLOCK_GROUPS, groupBlocks } from "../lib/registry/blocks";
import { demoEntries } from "../lib/registry/demos.generated";
import { loadRegistry } from "../lib/registry/index";

// The App group (SPEC-components-8 §6): it sits after Manga and before the stock families, and
// shows a heading and a sidebar separator only once it holds a block. Runs with the `site` suite.

const filter = parseE2eItems(process.env.E2E_ITEMS);
test.skip(Boolean(filter) && !filter?.has("site"), "the index checks run with `site`");

const order = BLOCK_GROUPS.map((group) => group.id);
const app = groupBlocks(
  docItems(loadRegistry(resolve(__dirname, "../registry.json")), demoEntries, BLOCKS_CATALOG),
).find((group) => group.id === "app");

test("the Blocks index shows App after Manga only when it holds a block", async ({ page }) => {
  expect(order.slice(0, 3)).toEqual(["manga", "app", "login"]);
  await page.goto("/docs/blocks");
  const ids = await page
    .locator('[data-slot="block-index"] > section')
    .evaluateAll((sections) => sections.map((section) => (section as HTMLElement).dataset.group));
  // Headings follow BLOCK_GROUPS' order, and none is empty.
  expect(ids).toEqual(order.filter((id) => ids.includes(id)));
  const section = page.locator('[data-slot="block-index"] > section[data-group="app"]');
  if (app) {
    await expect(section.locator("[data-item]")).toHaveCount(app.items.length);
  } else {
    await expect(section).toHaveCount(0);
    await expect(page.getByRole("heading", { name: /^App/, level: 2 })).toHaveCount(0);
  }
});

test("the docs sidebar has an App separator only when App holds a block", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "w1280", "the sidebar is a closed drawer below 768 px");
  await page.goto("/docs/blocks");
  const separators = await page
    .locator("#nd-sidebar p")
    .evaluateAll((nodes) => nodes.map((node) => node.textContent?.trim() ?? ""));
  expect(separators.includes("App")).toBe(Boolean(app));
});
