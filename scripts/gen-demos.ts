/**
 * Scans registry/**\/<item>/demos/*.tsx and writes lib/registry/demos.generated.ts, the map the
 * demo stage and the Playwright suite read. Exits non-zero naming any item without
 * demos/default.tsx. See SPEC-components §6.
 *
 * Usage: pnpm gen:demos (also runs in predev/prebuild)
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { collectDemos, DEMO_MAP_PATH, renderDemoMap } from "../lib/registry/demo-map";
import { loadRegistry } from "../lib/registry/index";

// pnpm runs package scripts from the repo root.
const target = path.resolve(DEMO_MAP_PATH);

let source: string;
try {
  source = renderDemoMap(collectDemos(loadRegistry()));
} catch (error) {
  console.error(`✗ ${(error as Error).message}`);
  process.exit(1);
}

if (existsSync(target) && readFileSync(target, "utf8") === source) {
  console.log(`✓ ${DEMO_MAP_PATH} is up to date`);
} else {
  writeFileSync(target, source);
  console.log(`✓ wrote ${DEMO_MAP_PATH}`);
}
