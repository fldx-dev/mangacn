/**
 * Scans registry/**\/<item>/demos/*.tsx and writes lib/registry/demos.generated.ts, the map the
 * docs and the Playwright suite read; lib/registry/demo-list.generated.ts, the same list as data
 * only; and one static route file per page block, item gallery and demo stage under app/view and
 * app/demo (MANGA-21), removing the ones that no longer have a demo. Exits non-zero naming any
 * item without demos/default.tsx. See SPEC-components §6.
 *
 * Usage: pnpm gen:demos (also runs in predev/prebuild)
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  collectDemos,
  collectPages,
  DEMO_LIST_PATH,
  DEMO_MAP_PATH,
  ROUTE_ROOTS,
  renderDemoList,
  renderDemoMap,
  renderDemoRoutes,
} from "../lib/registry/demo-map";
import { loadRegistry } from "../lib/registry/index";

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
try {
  const registry = loadRegistry();
  const demos = collectDemos(registry);
  const pages = collectPages(registry);
  modules = [
    { file: DEMO_MAP_PATH, source: renderDemoMap(demos, pages) },
    { file: DEMO_LIST_PATH, source: renderDemoList(demos, pages) },
  ];
  routes = renderDemoRoutes(demos, pages);
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
    // A demo folder inside an item folder that no longer has that demo.
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
