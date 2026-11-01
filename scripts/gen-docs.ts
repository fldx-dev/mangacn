/**
 * Scaffolds content/docs/components/<item>.mdx for every component-catalog item with demos
 * that has no page yet (never overwrites one), and rewrites content/docs/components/meta.json
 * so the sidebar lists the pages under category separators. See SPEC-docs-site §6.
 *
 * Usage: pnpm gen:docs          (write missing pages and the meta)
 *        pnpm gen:docs --check  (write nothing; exit 1 naming every missing page or a stale meta)
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  COMPONENT_PAGES_DIR,
  docItems,
  renderComponentsMeta,
  renderItemPage,
} from "../lib/docs/catalog";
import { collectDemos } from "../lib/registry/demo-map";
import { loadRegistry } from "../lib/registry/index";

const check = process.argv.includes("--check");

// pnpm runs package scripts from the repo root.
const dir = path.resolve(COMPONENT_PAGES_DIR);
const metaPath = `${COMPONENT_PAGES_DIR}/meta.json`;

let items: ReturnType<typeof docItems>;
try {
  const registry = loadRegistry();
  items = docItems(registry, collectDemos(registry));
} catch (error) {
  console.error(`✗ ${(error as Error).message}`);
  process.exit(1);
}

const missing = items.filter((item) => !existsSync(path.join(dir, `${item.name}.mdx`)));
const meta = renderComponentsMeta(items);
const metaCurrent =
  existsSync(path.resolve(metaPath)) && readFileSync(path.resolve(metaPath), "utf8") === meta;

if (check) {
  for (const item of missing) {
    console.error(`✗ ${item.name}: no page at ${COMPONENT_PAGES_DIR}/${item.name}.mdx`);
  }
  if (!metaCurrent) console.error(`✗ ${metaPath} is out of date`);
  if (missing.length > 0 || !metaCurrent) {
    console.error("  run `pnpm gen:docs` to scaffold the pages and rewrite the meta");
    process.exit(1);
  }
  console.log(`✓ ${items.length} item pages and ${metaPath} are up to date`);
  process.exit(0);
}

mkdirSync(dir, { recursive: true });
for (const item of missing) {
  writeFileSync(path.join(dir, `${item.name}.mdx`), renderItemPage(item));
  console.log(`✓ wrote ${COMPONENT_PAGES_DIR}/${item.name}.mdx`);
}
if (!metaCurrent) {
  writeFileSync(path.resolve(metaPath), meta);
  console.log(`✓ wrote ${metaPath}`);
}
console.log(
  missing.length > 0
    ? `${missing.length} page(s) scaffolded: replace the prose placeholder in each.`
    : `✓ all ${items.length} item pages exist`,
);
