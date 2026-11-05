/**
 * Writes skills/mangacn/references/catalog.md, the Agent Skill's list of every registry item
 * (SPEC-agent-tooling §5), from the catalog, so the skill never drifts from the registry.
 *
 * Usage: pnpm gen:skill          (rewrite the file when it changed)
 *        pnpm gen:skill --check  (write nothing; exit 1 when the file is missing or stale)
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { renderSkillCatalog, SKILL_CATALOG_PATH } from "../lib/docs/skill";
import { collectDemos } from "../lib/registry/demo-map";
import { loadRegistry } from "../lib/registry/index";

const check = process.argv.includes("--check");

// pnpm runs package scripts from the repo root.
const file = path.resolve(SKILL_CATALOG_PATH);

let catalog: string;
try {
  const registry = loadRegistry();
  catalog = renderSkillCatalog(registry, collectDemos(registry));
} catch (error) {
  console.error(`✗ ${(error as Error).message}`);
  process.exit(1);
}

const current = existsSync(file) && readFileSync(file, "utf8") === catalog;

if (check) {
  if (!current) {
    console.error(`✗ ${SKILL_CATALOG_PATH} is out of date`);
    console.error("  run `pnpm gen:skill` to rewrite it");
    process.exit(1);
  }
  console.log(`✓ ${SKILL_CATALOG_PATH} is up to date`);
  process.exit(0);
}

if (current) {
  console.log(`✓ ${SKILL_CATALOG_PATH} is up to date`);
} else {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, catalog);
  console.log(`✓ wrote ${SKILL_CATALOG_PATH}`);
}
