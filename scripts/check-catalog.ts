/**
 * `pnpm check:catalog`: the checks `pnpm check:changed` does not reach (SPEC-components-4 §8.1),
 * run once before the dispatch. Vitest's `--changed` follows imports, so a catalog edit that a
 * suite reads from disk (a description pinned in lib/mcp/tools.test.ts) runs no test; and the
 * component index's own checks (a default demo taller than its 20rem stage, axe's
 * `heading-order` under the index's sections) run only in its Playwright pass.
 *
 * Steps, stopping at the first failure, exit code that step's:
 *   1. the catalog suites: `vitest run lib/mcp lib/docs lib/registry components`
 *   2. `pnpm build`
 *   3. the index pass: `playwright test -c e2e/playwright.config.ts -g docs/components` with
 *      `E2E_ITEMS=site` (pixels compare only on Linux; every other assertion runs everywhere)
 *
 * Usage: pnpm check:catalog [<extra playwright args>]
 */
import { spawnSync } from "node:child_process";

interface Step {
  name: string;
  args: string[];
  env?: Record<string, string>;
}

const steps: Step[] = [
  {
    name: "catalog suites",
    args: [
      "exec",
      "vitest",
      "run",
      "lib/mcp",
      "lib/docs",
      "lib/registry",
      "components",
      "--coverage.enabled=false",
    ],
  },
  { name: "build", args: ["build"] },
  {
    name: "component index (Playwright)",
    args: [
      "exec",
      "playwright",
      "test",
      "-c",
      "e2e/playwright.config.ts",
      "-g",
      "docs/components",
      ...process.argv.slice(2),
    ],
    env: { E2E_ITEMS: "site" },
  },
];

const started = Date.now();
const seconds = (since: number) => `${Math.round((Date.now() - since) / 1000)}s`;

for (const step of steps) {
  const at = Date.now();
  console.log(`→ check:catalog: ${step.name}: pnpm ${step.args.join(" ")}`);
  const result = spawnSync("pnpm", step.args, {
    stdio: "inherit",
    env: { ...process.env, ...step.env },
    // pnpm is a .cmd on Windows; the args hold no shell metacharacters.
    shell: process.platform === "win32",
  });
  const status = result.status ?? 1;
  if (status !== 0) {
    console.error(`✗ check:catalog: ${step.name} failed (exit ${status}) after ${seconds(at)}`);
    process.exit(status);
  }
  console.log(`✓ check:catalog: ${step.name} (${seconds(at)})`);
}
console.log(`✓ check:catalog: all ${steps.length} steps passed in ${seconds(started)}`);
