/**
 * Biome on the files that differ from origin/main (committed, staged, unstaged or untracked),
 * the first step of `pnpm check:changed`. `biome check --changed` would miss uncommitted work.
 * Falls back to the whole tree when biome.json itself changed.
 *
 * Usage: pnpm exec tsx scripts/lint-changed.ts [--base=<ref>]
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { changedPaths, defaultBase } from "./changed-paths";

const baseArg = process.argv.slice(2).find((arg) => arg.startsWith("--base="));
const { base, paths } = changedPaths(baseArg?.slice("--base=".length) ?? defaultBase());
const files = paths.filter((file) => existsSync(file));
const whole = paths.includes("biome.json");

if (!whole && files.length === 0) {
  console.log(`✓ lint-changed: nothing differs from ${base}`);
  process.exit(0);
}
console.log(
  whole
    ? "→ lint-changed: biome.json changed; checking the whole tree"
    : `→ lint-changed: biome check on ${files.length} file(s) changed against ${base}`,
);
const result = spawnSync(
  "pnpm",
  ["exec", "biome", "check", "--no-errors-on-unmatched", ...(whole ? ["."] : files)],
  { stdio: "inherit", shell: process.platform === "win32" },
);
process.exit(result.status ?? 1);
