import { readFileSync } from "node:fs";
import path from "node:path";
import { installPageSource, pageFile } from "./blocks";
import { extractImportOffsets } from "./imports";
import { type LoadedRegistry, loadRegistry } from "./index";

/**
 * A page block's `page.tsx` as `shadcn add` writes it: the repo source with its own-component
 * imports at their install paths, the same rewrite `pnpm registry:build` applies to the emitted
 * JSON (scripts/registry-rewrite-pages.ts). Throws for a name that is not a page block.
 */
export function installedPageSource(
  name: string,
  registry: LoadedRegistry = loadRegistry(),
  rootDir = process.cwd(),
): string {
  const item = registry.items.find((entry) => entry.name === name);
  const page = item && pageFile(item);
  if (!item || !page) throw new Error(`"${name}" is not a page block`);
  const source = readFileSync(path.resolve(rootDir, page.path), "utf8");
  return installPageSource(source, item, extractImportOffsets(source));
}
