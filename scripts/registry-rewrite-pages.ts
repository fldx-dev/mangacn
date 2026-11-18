/**
 * The step after `shadcn build` (SPEC-components-6 §5.1): a page block's `page.tsx` imports its
 * own components relatively (`./components/login-form`), so variants of one family resolve in
 * this repo without a per-path alias; the installed page lands in `app/<route>/`, away from
 * them, so its emitted JSON must import them by install path (`@/components/login-form`).
 * `shadcn build` has no rewrite hook, so this script rewrites those imports, and only those, in
 * `public/r/<name>.json`. Every other import and every other byte of the file stays as built.
 *
 * Usage: chained in `pnpm registry:build` (so predev, prebuild, ci:checks and ci:smoke get it).
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { installPageSource, isPageBlock, pageFile } from "../lib/registry/blocks";
import { extractImportOffsets } from "../lib/registry/imports";
import { type LoadedRegistryItem, loadRegistry } from "../lib/registry/index";

const OUTPUT_DIR = "public/r";

interface BuiltItem {
  files?: { path: string; content?: string }[];
}

/**
 * A built item's JSON text with its page's own-component imports at their install paths, or
 * `null` when there is nothing to rewrite. Written as `shadcn build` writes it (two-space JSON,
 * no final newline), so an item with nothing to rewrite is never touched.
 */
export function rewriteBuiltPage(
  json: string,
  item: Pick<LoadedRegistryItem, "name" | "type" | "files">,
): string | null {
  const page = pageFile(item);
  if (!page) return null;
  const built = JSON.parse(json) as BuiltItem;
  const file = built.files?.find((entry) => entry.path === page.path);
  if (typeof file?.content !== "string") return null;
  const content = installPageSource(file.content, item, extractImportOffsets(file.content));
  if (content === file.content) return null;
  file.content = content;
  return JSON.stringify(built, null, 2);
}

function main(): void {
  const registry = loadRegistry();
  let rewritten = 0;
  for (const item of registry.items.filter(isPageBlock)) {
    const file = path.resolve(OUTPUT_DIR, `${item.name}.json`);
    if (!existsSync(file)) {
      throw new Error(`${OUTPUT_DIR}/${item.name}.json not found; run shadcn build first`);
    }
    const next = rewriteBuiltPage(readFileSync(file, "utf8"), item);
    if (next === null) continue;
    writeFileSync(file, next);
    rewritten += 1;
  }
  console.log(`✓ page imports at install paths in ${rewritten} built page block(s)`);
}

const invoked = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename);
if (invoked) {
  try {
    main();
  } catch (error) {
    console.error(`✗ ${(error as Error).message}`);
    process.exit(1);
  }
}
