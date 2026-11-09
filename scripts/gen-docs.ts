/**
 * Scaffolds a page for every component-catalog and block-catalog item with demos that has none
 * yet (content/docs/components/<item>.mdx, content/docs/blocks/<block>.mdx; never overwrites
 * one), and rewrites each section's meta.json so the sidebar lists the pages: the components
 * under category separators, the blocks in catalog order. See SPEC-docs-site §6 and
 * SPEC-components-3 §5.
 *
 * Usage: pnpm gen:docs          (write missing pages and the metas)
 *        pnpm gen:docs --check  (write nothing; exit 1 naming every missing page or a stale meta)
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  DOCS_SECTIONS,
  type DocItem,
  type DocsSection,
  docItems,
  renderItemPage,
  renderSectionMeta,
} from "../lib/docs/catalog";
import { collectDemos } from "../lib/registry/demo-map";
import { loadRegistry } from "../lib/registry/index";

const check = process.argv.includes("--check");

interface SectionState {
  section: DocsSection;
  items: DocItem[];
  missing: DocItem[];
  metaPath: string;
  meta: string;
  metaCurrent: boolean;
}

let sections: SectionState[];
try {
  const registry = loadRegistry();
  const demos = collectDemos(registry);
  // pnpm runs package scripts from the repo root.
  sections = DOCS_SECTIONS.map((section) => {
    const items = docItems(registry, demos, section.catalog);
    const metaPath = `${section.dir}/meta.json`;
    const meta = renderSectionMeta(section, items);
    return {
      section,
      items,
      missing: items.filter((item) => !existsSync(path.resolve(section.dir, `${item.name}.mdx`))),
      metaPath,
      meta,
      metaCurrent:
        existsSync(path.resolve(metaPath)) && readFileSync(path.resolve(metaPath), "utf8") === meta,
    };
  });
} catch (error) {
  console.error(`✗ ${(error as Error).message}`);
  process.exit(1);
}

const total = sections.reduce((sum, state) => sum + state.items.length, 0);
const missingCount = sections.reduce((sum, state) => sum + state.missing.length, 0);

if (check) {
  let stale = false;
  for (const { section, missing, metaPath, metaCurrent } of sections) {
    for (const item of missing) {
      console.error(`✗ ${item.name}: no page at ${section.dir}/${item.name}.mdx`);
    }
    if (!metaCurrent) console.error(`✗ ${metaPath} is out of date`);
    stale ||= missing.length > 0 || !metaCurrent;
  }
  if (stale) {
    console.error("  run `pnpm gen:docs` to scaffold the pages and rewrite the metas");
    process.exit(1);
  }
  const metas = sections.map((state) => state.metaPath).join(", ");
  console.log(`✓ ${total} item pages and ${metas} are up to date`);
  process.exit(0);
}

for (const { section, missing, metaPath, meta, metaCurrent } of sections) {
  mkdirSync(path.resolve(section.dir), { recursive: true });
  for (const item of missing) {
    writeFileSync(path.resolve(section.dir, `${item.name}.mdx`), renderItemPage(item));
    console.log(`✓ wrote ${section.dir}/${item.name}.mdx`);
  }
  if (!metaCurrent) {
    writeFileSync(path.resolve(metaPath), meta);
    console.log(`✓ wrote ${metaPath}`);
  }
}
console.log(
  missingCount > 0
    ? `${missingCount} page(s) scaffolded: replace the prose placeholder in each.`
    : `✓ all ${total} item pages exist`,
);
