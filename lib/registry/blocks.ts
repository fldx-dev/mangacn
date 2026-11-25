import path from "node:path";
import {
  type LoadedRegistry,
  type LoadedRegistryItem,
  mangacnItemName,
  type RegistryFile,
} from "./index";
import { importSpecifier, installTarget } from "./install-target";
import { type BlockParityShape, loadBlockParitySnapshot, PARITY_BLOCKS } from "./parity";

// Blocks are pages in miniature (SPEC-components-3 §3, §7): `registry:block` items in
// registry/blocks/registry.json, one folder each, every file installed under
// `components/blocks/<name>/` through a `@components/blocks/<name>/<file>` target, and every item
// they render declared by its mangacn URL.
//
// A page block (batch 5, stock's `login-01`) is a whole route instead: its first file is
// `page.tsx`, a `registry:page` installed as an example route under one route group
// (`app/(mangacn-examples)/examples/login-01/page.tsx`, served at `/examples/login-01`; stock's
// target is `app/login/page.tsx`), and its other files live in `components/` as
// `registry:component`, installed where stock installs them:
// `registry/blocks/login-01/components/login-form.tsx` → `components/login-form.tsx`. shadcn 4.23
// writes an untargeted `registry:component` to the user's components folder at the path after
// the first `components` segment of the file's registry path (or at its basename when the folder
// has another name); the catalog states that place as `@components/<file>`, so it does not hang
// on the folder's name. The page lands in `app/(mangacn-examples)/examples/<name>/`, away from
// its components, so once installed it imports them by install path (`@/components/login-form`),
// as stock's page does; component files import each other relatively, since they land together.
//
// Variants of one stock family (SPEC-components-6 §5.1) install the same component paths: every
// login-0N writes `components/login-form.tsx` (each its own example route). So a page imports its own
// components relatively (`./components/login-form`), which resolves in this repo without a
// per-path alias, and `pnpm registry:build` rewrites those imports to the install path
// (`@/components/login-form`) in the emitted JSON (`installPageSource`,
// scripts/registry-rewrite-pages.ts). Two stock-derived blocks may share a target when stock's
// own files share it; any other collision is refused.

/** Repo-relative path of the block catalog, included from the root registry.json. */
export const BLOCKS_CATALOG = "registry/blocks/registry.json";

export const BLOCK_TYPE = "registry:block";

export const BLOCK_CATEGORY = "block";

/** A page block's route file (its first file) and the type of its other files. */
export const PAGE_TYPE = "registry:page";
export const PAGE_COMPONENT_TYPE = "registry:component";
export const PAGE_FILE = "page.tsx";
export const PAGE_COMPONENTS_DIR = "components";

/**
 * The route group every page block's route installs under. A route group adds no URL segment, so
 * the routes sit one level down, under `examples/`, to keep clear of an app's own `/login` or
 * `/dashboard`; the block's name keeps two blocks apart. Deleting the group's folder removes
 * every example route and nothing else.
 */
export const EXAMPLES_GROUP = "(mangacn-examples)";

/** A page block's route: `login-01` → `app/(mangacn-examples)/examples/login-01/page.tsx`. */
export function examplePageTarget(name: string): string {
  return `app/${EXAMPLES_GROUP}/examples/${name}/${PAGE_FILE}`;
}

/** The URL a page block's route serves: `login-01` → `/examples/login-01`. */
export function examplePageUrl(name: string): string {
  return `/examples/${name}`;
}

/**
 * The groups of the Blocks index and the docs sidebar, in order (SPEC-components-6 §6,
 * SPEC-components-8 §6), each with the families it holds. A block named `<family>-<n>`
 * (`login-01`, `settings-01`) joins the group that holds its family, by number; a `<family>-<n>`
 * name no group holds throws. Any other block is manga-native and joins Manga, in catalog order.
 * A new block lands in its group by its name alone, so neither the index nor `gen:docs` needs an
 * edit.
 */
export const BLOCK_GROUPS = [
  { id: "manga", label: "Manga", families: [] },
  {
    id: "app",
    label: "App",
    families: ["settings", "profile", "onboarding", "file-manager", "activity", "upload"],
  },
  { id: "login", label: "Login", families: ["login"] },
  { id: "signup", label: "Signup", families: ["signup"] },
  { id: "sidebar", label: "Sidebar", families: ["sidebar"] },
] as const satisfies readonly { id: string; label: string; families: readonly string[] }[];

export type BlockGroupId = (typeof BLOCK_GROUPS)[number]["id"];

export interface BlockGroup<T> {
  id: BlockGroupId;
  label: string;
  items: T[];
}

/** A numbered block's name: its family, then its number (`login-01`, `file-manager-01`). */
const FAMILY_BLOCK_NAME = /^([a-z]+(?:-[a-z]+)*)-(\d+)$/;

function blockFamily(name: string): { group: BlockGroupId; number: number } | null {
  const match = FAMILY_BLOCK_NAME.exec(name);
  if (!match) return null;
  const group = BLOCK_GROUPS.find((group) =>
    (group.families as readonly string[]).includes(match[1]),
  );
  if (!group) {
    throw new Error(
      `Block "${name}" is named like a block of the "${match[1]}" family, which has no group; add the family to a group in BLOCK_GROUPS (lib/registry/blocks.ts).`,
    );
  }
  return { group: group.id, number: Number(match[2]) };
}

/** The group a block joins, from its name; throws for a `<family>-<n>` no group holds. */
export function blockGroup(name: string): BlockGroupId {
  return blockFamily(name)?.group ?? "manga";
}

/**
 * `items` in their groups, in `BLOCK_GROUPS` order: Manga in the order given (the catalog's),
 * each family's blocks by number. Empty groups are left out.
 */
export function groupBlocks<T extends { name: string }>(items: readonly T[]): BlockGroup<T>[] {
  const number = (item: T) => blockFamily(item.name)?.number ?? 0;
  return BLOCK_GROUPS.map(({ id, label }) => ({
    id,
    label,
    items: items
      .filter((item) => blockGroup(item.name) === id)
      .sort((a, b) => number(a) - number(b)),
  })).filter((group) => group.items.length > 0);
}

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
  } else if (first.target !== examplePageTarget(item.name)) {
    at(
      `${first.path} has target ${JSON.stringify(first.target)}; expected "${examplePageTarget(item.name)}"`,
    );
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
 * `page.tsx` first (`registry:page`, target `examplePageTarget(name)`) and its other files in
 * `components/` (`registry:component`, target `@components/<file>`). No block file installs
 * where another item's file does, unless both are stock-derived blocks whose stock files share
 * that target (`sharesStockTarget`): variants of one family are alternatives. Items of other
 * types in the block catalog, and blocks outside it, are problems too.
 */
export function findBlockProblems(
  registry: LoadedRegistry,
  family: StockFamily = stockParityFamily(),
): string[] {
  const problems: string[] = [];
  // Every item that installs a path, in registry order. A block is checked against every other
  // owner (a third block sharing a path must be allowed with both of the others); a clash between
  // two blocks is reported once, on the later one.
  const catalog = new Set(
    registry.items.filter((item) => item.source === BLOCKS_CATALOG).map((item) => item.name),
  );
  const owners = new Map<string, string[]>();
  for (const item of registry.items) {
    for (const file of item.files) {
      const target = installTarget(file);
      const names = owners.get(target) ?? [];
      if (!names.includes(item.name)) names.push(item.name);
      owners.set(target, names);
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
      const target = installTarget(file);
      const names = owners.get(target) ?? [];
      const self = names.indexOf(item.name);
      for (const [index, owner] of names.entries()) {
        if (index === self || (index > self && catalog.has(owner))) continue;
        if (!sharesStockTarget(family, owner, item.name, target)) {
          at(`${file.path} installs to ${target}, as a file of ${owner} does`);
        }
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

/**
 * The stock-derived blocks and stock's files for each (the block parity snapshot), which decide
 * the install paths two blocks may share.
 */
export interface StockFamily {
  blocks: readonly string[];
  stock: Readonly<Record<string, Pick<BlockParityShape, "files">>>;
}

/** `PARITY_BLOCKS` and the committed snapshot (empty before `pnpm gen:parity` has run). */
export function stockParityFamily(rootDir = process.cwd()): StockFamily {
  return { blocks: PARITY_BLOCKS, stock: loadBlockParitySnapshot(rootDir)?.items ?? {} };
}

/** Where stock's files install: a page at its target, others at their path (`components/x.tsx`). */
function stockTargets(family: StockFamily, name: string): Set<string> {
  return new Set((family.stock[name]?.files ?? []).map((file) => file.target ?? file.path));
}

/**
 * Whether blocks `a` and `b` may both install `target`: both are in `PARITY_BLOCKS` and stock's
 * own files of both install there (`login-01` and `login-02` both write
 * `components/login-form.tsx`). Every other collision is refused.
 */
export function sharesStockTarget(
  family: StockFamily,
  a: string,
  b: string,
  target: string,
): boolean {
  return (
    family.blocks.includes(a) &&
    family.blocks.includes(b) &&
    stockTargets(family, a).has(target) &&
    stockTargets(family, b).has(target)
  );
}

/** `./components/login-form`, a page's import of one of its own components. */
const OWN_COMPONENT_IMPORT = /^\.\/components\/[^/]+$/;

/**
 * Whether `specifier` in `from` is a page's relative import of its own component `to`
 * (`./components/login-form` in `page.tsx`): the one relative form that does not hold after
 * install and is still allowed, because `pnpm registry:build` rewrites it (`installPageSource`).
 */
export function isOwnComponentImport(
  specifier: string,
  from: Pick<RegistryFile, "type">,
  to: Pick<RegistryFile, "type">,
): boolean {
  return (
    from.type === PAGE_TYPE &&
    to.type === PAGE_COMPONENT_TYPE &&
    OWN_COMPONENT_IMPORT.test(specifier)
  );
}

/**
 * A page block's route file as `shadcn add` should write it: each relative import of one of its
 * own components (`./components/login-form`) becomes that component's install path
 * (`@/components/login-form`), since the route lands in `app/(mangacn-examples)/examples/<name>/`, away from them. Every
 * other import, and every other byte, is left as it is.
 */
export function installPageSource(
  source: string,
  item: Pick<LoadedRegistryItem, "name" | "type" | "files">,
  imports: readonly { specifier: string; start: number }[],
): string {
  const page = pageFile(item);
  if (!page) return source;
  let out = "";
  let from = 0;
  for (const { specifier, start } of imports) {
    if (!OWN_COMPONENT_IMPORT.test(specifier)) continue;
    const resolved = path.posix.join(path.posix.dirname(page.path), specifier);
    const own = item.files.find(
      (file) =>
        file.type === PAGE_COMPONENT_TYPE && file.path.replace(/\.[jt]sx?$/, "") === resolved,
    );
    if (!own) continue;
    out += source.slice(from, start) + importSpecifier(installTarget(own));
    from = start + specifier.length;
  }
  return out + source.slice(from);
}
