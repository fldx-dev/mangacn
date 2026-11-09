import path from "node:path";
import { type LoadedRegistry, type LoadedRegistryItem, mangacnItemName } from "./index";

// Blocks are pages in miniature (SPEC-components-3 §3, §7): `registry:block` items in
// registry/blocks/registry.json, one folder each, every file installed under
// `components/blocks/<name>/` through a `@components/blocks/<name>/<file>` target, and every item
// they render declared by its mangacn URL.

/** Repo-relative path of the block catalog, included from the root registry.json. */
export const BLOCKS_CATALOG = "registry/blocks/registry.json";

export const BLOCK_TYPE = "registry:block";

export const BLOCK_CATEGORY = "block";

/** Whether an item is a block (by its type). */
export function isBlock(item: Pick<LoadedRegistryItem, "type">): boolean {
  return item.type === BLOCK_TYPE;
}

/**
 * The target a block file needs: `registry/blocks/chapter-list/chapter-list.tsx` →
 * `@components/blocks/chapter-list/chapter-list.tsx`. Without it `shadcn add` (4.23) drops the
 * folder and writes the file straight into `components/`; the `@components/` prefix resolves
 * against the user's own `components` alias, as the ui items' `@ui/` does.
 */
export function blockTarget(name: string, file: string): string {
  const folder = `${path.posix.dirname(BLOCKS_CATALOG)}/${name}/`;
  const relative = file.startsWith(folder) ? file.slice(folder.length) : path.posix.basename(file);
  return `@components/blocks/${name}/${relative}`;
}

/**
 * What is wrong with the block catalog, one `name: problem` line each: a block is a
 * `registry:block` in category `block`, lives in its own folder with `<name>.tsx` as its entry
 * (first) file, gives every file type `registry:block` and its `@components/blocks/<name>/…`
 * target, and declares every registry dependency by mangacn URL. Items of other types in the
 * block catalog, and blocks outside it, are problems too.
 */
export function findBlockProblems(registry: LoadedRegistry): string[] {
  const problems: string[] = [];
  for (const item of registry.items) {
    const inCatalog = item.source === BLOCKS_CATALOG;
    if (!inCatalog) {
      if (isBlock(item)) problems.push(`${item.name}: blocks belong in ${BLOCKS_CATALOG}`);
      continue;
    }
    const at = (problem: string) => problems.push(`${item.name}: ${problem}`);
    if (!isBlock(item)) at(`type is "${item.type}"; expected "${BLOCK_TYPE}"`);
    if (item.categories?.[0] !== BLOCK_CATEGORY) {
      at(`first category is "${item.categories?.[0]}"; expected "${BLOCK_CATEGORY}"`);
    }
    const folder = `registry/blocks/${item.name}/`;
    if (item.files.length === 0) at("ships no files");
    else if (item.files[0].path !== `${folder}${item.name}.tsx`) {
      at(`the first file is ${item.files[0].path}; expected the entry ${folder}${item.name}.tsx`);
    }
    for (const file of item.files) {
      if (!file.path.startsWith(folder)) at(`${file.path} is outside ${folder}`);
      if (file.type !== BLOCK_TYPE) at(`${file.path} has type "${file.type}"`);
      const target = blockTarget(item.name, file.path);
      if (file.target !== target) {
        at(`${file.path} has target ${JSON.stringify(file.target)}; expected "${target}"`);
      }
    }
    for (const dependency of item.registryDependencies ?? []) {
      if (mangacnItemName(dependency) === null) {
        at(`"${dependency}" is not a mangacn URL (blocks declare every item by URL)`);
      }
    }
  }
  return problems;
}
