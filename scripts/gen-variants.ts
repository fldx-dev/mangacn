/**
 * Scans registry/**\/<item>/variants/*.tsx and writes lib/registry/variants.generated.ts, the map the
 * docs and the Playwright suite read; lib/registry/variant-list.generated.ts, the same list as data
 * only; and one static route file per page block, item gallery and variant stage under app/view and
 * app/gallery (MANGA-21), removing the ones that no longer have a variant. Exits non-zero naming any
 * item without variants/default.tsx. See SPEC-components §6.
 * Then writes every component variant as an installable item, public/r/c-<component>-<n>.json,
 * numbered by registry/ui/<component>/variants.json, and their labels and titles as data in
 * lib/registry/variant-meta.generated.ts for the docs (SPEC-components-10 §4).
 *
 * Usage: pnpm gen:variants (also runs in predev/prebuild)
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { loadRegistry } from "../lib/registry/index";
import {
  buildVariantItems,
  listComponentVariants,
  VARIANT_INDEX_FILE,
  VARIANT_META_HEADER,
  VARIANT_META_PATH,
} from "../lib/registry/variant-items";
import {
  collectPages,
  collectVariants,
  ROUTE_ROOTS,
  renderVariantList,
  renderVariantMap,
  renderVariantRoutes,
  VARIANT_LIST_PATH,
  VARIANT_MAP_PATH,
} from "../lib/registry/variant-map";

/** Writes `file` (repo-relative) when its content differs; true when it wrote. */
function write(file: string, source: string): boolean {
  const target = path.resolve(file);
  if (existsSync(target) && readFileSync(target, "utf8") === source) return false;
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, source);
  return true;
}

let modules: { file: string; source: string }[];
let routes: { path: string; source: string }[];
let built: ReturnType<typeof buildVariantItems>;
let numbered: ReturnType<typeof listComponentVariants>;
let componentTitles: Map<string, string>;
try {
  const registry = loadRegistry();
  const variants = collectVariants(registry);
  const pages = collectPages(registry);
  numbered = listComponentVariants(registry);
  componentTitles = new Map(registry.items.map((item) => [item.name, item.title ?? item.name]));
  built = buildVariantItems(numbered, registry);
  modules = [
    { file: VARIANT_MAP_PATH, source: renderVariantMap(variants, pages) },
    { file: VARIANT_LIST_PATH, source: renderVariantList(variants, pages) },
  ];
  routes = renderVariantRoutes(variants, pages);
} catch (error) {
  console.error(`✗ ${(error as Error).message}`);
  process.exit(1);
}

for (const { file, source } of modules) {
  console.log(write(file, source) ? `✓ wrote ${file}` : `✓ ${file} is up to date`);
}

// Every folder under the route roots is generated (git ignores them): drop the stale ones.
const wanted = new Set(routes.map((route) => route.path.split("/").slice(0, 3).join("/")));
let removed = 0;
for (const root of ROUTE_ROOTS) {
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const dir = `${root}/${entry.name}`;
    if (entry.isDirectory() && !wanted.has(dir)) {
      rmSync(dir, { recursive: true, force: true });
      removed += 1;
    }
  }
}
for (const root of ROUTE_ROOTS) {
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    // A variant folder inside an item folder that no longer has that variant.
    const item = `${root}/${entry.name}`;
    for (const inner of readdirSync(item, { withFileTypes: true })) {
      const dir = `${item}/${inner.name}`;
      if (inner.isDirectory() && !routes.some((route) => route.path.startsWith(`${dir}/`))) {
        rmSync(dir, { recursive: true, force: true });
        removed += 1;
      }
    }
  }
}
const written = routes.filter((route) => write(route.path, route.source)).length;
console.log(
  `✓ ${routes.length} routes under ${ROUTE_ROOTS.join(", ")} (${written} written, ${removed} stale removed)`,
);

// The installable variants, `public/r/c-<component>-<n>.json`, beside the items `shadcn build`
// writes there (it leaves other files alone), plus `public/r/variants.json`, their index for the
// smoke. They stay out of registry.json, so nothing that lists components lists them.
const outputDir = path.resolve("public/r");
mkdirSync(outputDir, { recursive: true });
const names = new Set(built.items.map((item) => `${item.name}.json`));
for (const file of readdirSync(outputDir)) {
  if (/^c-.+\.json$/.test(file) && !names.has(file)) rmSync(path.join(outputDir, file));
}
for (const item of built.items) {
  writeFileSync(path.join(outputDir, `${item.name}.json`), `${JSON.stringify(item, null, 2)}\n`);
}
const index = built.items.map(({ $schema: _schema, files, ...item }) => ({
  ...item,
  files: files.map(({ content: _content, ...file }) => file),
}));
writeFileSync(
  path.join(outputDir, VARIANT_INDEX_FILE),
  `${JSON.stringify({ items: index }, null, 2)}\n`,
);
console.log(`✓ wrote ${built.items.length} variant items to public/r`);

// The docs read the numbers, labels and titles from this module, not from disk: a docs route that
// reads files traces the whole project into its server bundle (SPEC-components-10 §4.2).
const installable = new Set(built.items.map((item) => item.name));
const meta = numbered.map(({ component, n, file, label, title, name }) => ({
  component,
  componentTitle: componentTitles.get(component) ?? component,
  n,
  file,
  label,
  title,
  name,
  installable: installable.has(name),
}));
const metaSource = [
  VARIANT_META_HEADER,
  'import type { DocVariant } from "@/lib/docs/variant-meta";',
  "",
  `export const variantMeta: readonly DocVariant[] = ${JSON.stringify(meta, null, 2)};`,
  "",
].join("\n");
console.log(
  write(VARIANT_META_PATH, metaSource)
    ? `✓ wrote ${VARIANT_META_PATH}`
    : `✓ ${VARIANT_META_PATH} is up to date`,
);
for (const { name, reason } of built.skipped) console.log(`  → ${name} not installable: ${reason}`);
