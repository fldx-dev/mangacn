import path from "node:path";
import { type LoadedRegistry, type LoadedRegistryItem, mangacnItemName } from "./index";
import { installTarget } from "./install-target";

// Blocks are pages in miniature (SPEC-components-3 §3, §7): `registry:block` items in
// registry/blocks/registry.json, one folder each, every file installed under
// `components/blocks/<name>/` through a `@components/blocks/<name>/<file>` target, and every item
// they render declared by its mangacn URL.
//
// A page block (batch 5, stock's `login-01`) is a whole route instead: its first file is
// `page.tsx`, a `registry:page` with stock's target (`app/login/page.tsx`), and its other files
// live in `components/` as `registry:component`, installed where stock installs them:
// `registry/blocks/login-01/components/login-form.tsx` → `components/login-form.tsx`. shadcn 4.23
// writes an untargeted `registry:component` to the user's components folder at the path after
// the first `components` segment of the file's registry path (or at its basename when the folder
// has another name); the catalog states that place as `@components/<file>`, so it does not hang
// on the folder's name. The page lands in `app/<route>/`, away from its components, so it
// imports them by install path (`@/components/login-form`), as stock's page does once the CLI
// has rewritten it; component files import each other relatively, since they land together.

/** Repo-relative path of the block catalog, included from the root registry.json. */
export const BLOCKS_CATALOG = "registry/blocks/registry.json";

export const BLOCK_TYPE = "registry:block";

export const BLOCK_CATEGORY = "block";

/** A page block's route file (its first file) and the type of its other files. */
export const PAGE_TYPE = "registry:page";
export const PAGE_COMPONENT_TYPE = "registry:component";
export const PAGE_FILE = "page.tsx";
export const PAGE_COMPONENTS_DIR = "components";

/** `app/<route>/page.tsx`, one or more kebab-case route segments, as stock's pages target. */
const PAGE_TARGET = /^app\/(?:[a-z0-9-]+\/)+page\.tsx$/;

/** Whether an item is a block (by its type). */
export function isBlock(item: Pick<LoadedRegistryItem, "type">): boolean {
  return item.type === BLOCK_TYPE;
}

/** Whether a block is a page block: it ships a `registry:page` file. */
export function isPageBlock(item: Pick<LoadedRegistryItem, "type" | "files">): boolean {
  return isBlock(item) && item.files.some((file) => file.type === PAGE_TYPE);
}

/** A page block's route file, or `undefined` for any other item. */
export function pageFile(
  item: Pick<LoadedRegistryItem, "type" | "files">,
): LoadedRegistryItem["files"][number] | undefined {
  return isBlock(item) ? item.files.find((file) => file.type === PAGE_TYPE) : undefined;
}

/** The repo-relative folder of a block: `registry/blocks/<name>/`. */
function blockFolder(name: string): string {
  return `${path.posix.dirname(BLOCKS_CATALOG)}/${name}/`;
}

/**
 * The target a block file needs: `registry/blocks/chapter-list/chapter-list.tsx` →
 * `@components/blocks/chapter-list/chapter-list.tsx`. Without it `shadcn add` (4.23) drops the
 * folder and writes the file straight into `components/`; the `@components/` prefix resolves
 * against the user's own `components` alias, as the ui items' `@ui/` does.
 */
export function blockTarget(name: string, file: string): string {
  const folder = blockFolder(name);
  const relative = file.startsWith(folder) ? file.slice(folder.length) : path.posix.basename(file);
  return `@components/blocks/${name}/${relative}`;
}

/**
 * The target of a page block's component file, where stock's untargeted `registry:component`
 * lands: `registry/blocks/login-01/components/login-form.tsx` → `@components/login-form.tsx`.
 */
export function pageComponentTarget(name: string, file: string): string {
  const folder = `${blockFolder(name)}${PAGE_COMPONENTS_DIR}/`;
  const relative = file.startsWith(folder) ? file.slice(folder.length) : path.posix.basename(file);
  return `@components/${relative}`;
}

/** The checks of a page block's files: the route file first, its components in `components/`. */
function pageBlockProblems(item: LoadedRegistryItem, at: (problem: string) => void): void {
  const folder = blockFolder(item.name);
  const [first, ...rest] = item.files;
  if (first.path !== `${folder}${PAGE_FILE}` || first.type !== PAGE_TYPE) {
    at(
      `the first file is ${first.path} (${first.type}); expected ${folder}${PAGE_FILE} (${PAGE_TYPE})`,
    );
  } else if (!PAGE_TARGET.test(first.target ?? "")) {
    at(`${first.path} has target ${JSON.stringify(first.target)}; expected app/<route>/page.tsx`);
  }
  const components = `${folder}${PAGE_COMPONENTS_DIR}/`;
  for (const file of rest) {
    if (!file.path.startsWith(components)) {
      at(`${file.path} is outside ${components} (a page block's other files are its components)`);
      continue;
    }
    if (file.type !== PAGE_COMPONENT_TYPE) at(`${file.path} has type "${file.type}"`);
    const target = pageComponentTarget(item.name, file.path);
    if (file.target !== target) {
      at(`${file.path} has target ${JSON.stringify(file.target)}; expected "${target}"`);
    }
  }
}

/**
 * What is wrong with the block catalog, one `name: problem` line each: a block is a
 * `registry:block` in category `block`, lives in its own folder and declares every registry
 * dependency by mangacn URL. A block has `<name>.tsx` as its entry (first) file and gives every
 * file type `registry:block` and its `@components/blocks/<name>/…` target; a page block has
 * `page.tsx` first (`registry:page`, target `app/<route>/page.tsx`) and its other files in
 * `components/` (`registry:component`, target `@components/<file>`). No block file installs
 * where another item's file does. Items of other types in the block catalog, and blocks outside
 * it, are problems too.
 */
export function findBlockProblems(registry: LoadedRegistry): string[] {
  const problems: string[] = [];
  const owners = new Map<string, string>();
  for (const item of registry.items) {
    for (const file of item.files) {
      const target = installTarget(file);
      if (!owners.has(target)) owners.set(target, item.name);
    }
  }
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
    const folder = blockFolder(item.name);
    if (item.files.length === 0) {
      at("ships no files");
    } else if (isPageBlock(item)) {
      pageBlockProblems(item, at);
    } else {
      if (item.files[0].path !== `${folder}${item.name}.tsx`) {
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
    }
    for (const file of item.files) {
      const owner = owners.get(installTarget(file));
      if (owner && owner !== item.name) {
        at(`${file.path} installs to ${installTarget(file)}, as a file of ${owner} does`);
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
