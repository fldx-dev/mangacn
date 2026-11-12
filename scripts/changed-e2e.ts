/**
 * Picks the Playwright set for a diff: prints `E2E_ITEMS` (lib/e2e-filter.ts has the
 * rules) for the changes against a base ref, committed or not.
 *
 * Usage:
 *   pnpm exec tsx scripts/changed-e2e.ts [--base=<ref>]   the filter on stdout, why on stderr
 *   pnpm exec tsx scripts/changed-e2e.ts --paths=a,b      the filter for these paths (dry run)
 *   pnpm test:e2e:changed [<playwright args>]             the same, then `playwright test` with it
 *                                                         (needs `pnpm build` first)
 *
 * The base defaults to origin/main (main without a remote). The filter is `all`, `none`, or a
 * comma-separated list of demo items and the suites `site`, `mcp`, `annotations`.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import {
  dependencyItems,
  type E2eItem,
  formatE2eItems,
  importedItems,
  selectE2e,
} from "../lib/e2e-filter";
import { isPageBlock } from "../lib/registry/blocks";
import { loadRegistry } from "../lib/registry/index";
import { changedPaths, defaultBase, fileAt } from "./changed-paths";

function filesUnder(folder: string): string[] {
  if (!existsSync(folder)) return [];
  return readdirSync(folder).flatMap((entry) => {
    const full = path.join(folder, entry);
    return statSync(full).isDirectory() ? filesUnder(full) : [full];
  });
}

/** Every catalog item with its folder, whether it has demos, and the items it renders. */
function catalogItems(): E2eItem[] {
  const registry = loadRegistry();
  const names = new Set(registry.items.map((item) => item.name));
  return registry.items.map((item) => {
    const folder = item.files[0] && path.posix.dirname(item.files[0].path);
    const uses = new Set(dependencyItems(item.registryDependencies, names));
    for (const file of folder ? filesUnder(folder) : []) {
      if (/\.test\.tsx?$/.test(file) || !/\.(ts|tsx)$/.test(file)) continue;
      for (const name of importedItems(readFileSync(file, "utf8"), names)) uses.add(name);
    }
    uses.delete(item.name);
    return {
      name: item.name,
      folder,
      hasDemos: folder !== undefined && existsSync(path.join(folder, "demos", "default.tsx")),
      page: isPageBlock(item),
      uses: [...uses],
    };
  });
}

function main(): number {
  const args = process.argv.slice(2);
  const run = args.includes("--run");
  const baseArg = args.find((arg) => arg.startsWith("--base="));
  const pathsArg = args.find((arg) => arg.startsWith("--paths="));
  const passThrough = args.filter((arg) => arg !== "--run" && arg !== baseArg && arg !== pathsArg);
  if (!run && passThrough.length > 0) {
    console.error(
      `Unknown argument(s): ${passThrough.join(" ")} (expected --base=<ref>, --paths=a,b or --run)`,
    );
    return 2;
  }

  const diff = changedPaths(baseArg?.slice("--base=".length) ?? defaultBase());
  const { base, mergeBase } = diff;
  const paths = pathsArg
    ? pathsArg.slice("--paths=".length).split(",").filter(Boolean)
    : diff.paths;
  const { selection, reasons } = selectE2e(paths, {
    items: catalogItems(),
    before: (file) => fileAt(mergeBase, file),
    after: (file) => (existsSync(file) ? readFileSync(file, "utf8") : undefined),
  });
  const filter = formatE2eItems(selection);

  console.error(
    `changed-e2e: ${paths.length} path(s) differ from ${base} (${mergeBase.slice(0, 7)})`,
  );
  for (const reason of reasons) console.error(`  ${reason}`);
  console.error(`changed-e2e: E2E_ITEMS=${filter}`);
  if (!run) {
    console.log(filter);
    return 0;
  }
  if (filter === "none") {
    console.error("✓ nothing the visual suite covers changed; no Playwright run");
    return 0;
  }
  const result = spawnSync(
    "pnpm",
    ["exec", "playwright", "test", "-c", "e2e/playwright.config.ts", ...passThrough],
    {
      stdio: "inherit",
      env: { ...process.env, E2E_ITEMS: filter },
      shell: process.platform === "win32",
    },
  );
  return result.status ?? 1;
}

process.exit(main());
