import { readFileSync } from "node:fs";
import path from "node:path";
import {
  type LoadedRegistry,
  type LoadedRegistryItem,
  loadRegistry,
  registryItemUrl,
} from "@/lib/registry";
import { clientNote, isClientItem } from "@/lib/registry/client";
import { extractImports } from "@/lib/registry/imports";
import { dependencyFiles, installTarget } from "@/lib/registry/install-target";
import { itemPagePath } from "./catalog";

export type PackageManager = "pnpm" | "npm" | "yarn" | "bun";

export const PACKAGE_MANAGERS: PackageManager[] = ["pnpm", "npm", "yarn", "bun"];

export const SITE_URL = "https://www.mangacn.com";

/** The read-only docs MCP (streamable HTTP, no account). */
export const MCP_URL = `${SITE_URL}/api/mcp`;

/** The skills CLI line that installs the mangacn Agent Skill. */
export const SKILL_INSTALL_COMMAND = "npx skills add fldx-dev/mangacn";

const RUNNERS: Record<PackageManager, string> = {
  pnpm: "pnpm dlx",
  npm: "npx",
  yarn: "yarn dlx",
  bun: "bunx --bun",
};

const INK_FRAME = "ink-frame";
const INK_FRAME_IMPORT = "@/components/ink-frame";

let registry: LoadedRegistry | undefined;
let catalog: Map<string, LoadedRegistryItem> | undefined;

/** The catalog entry for `name`, read once from disk (server only). */
function catalogItem(name: string): LoadedRegistryItem {
  registry ??= loadRegistry();
  catalog ??= new Map(registry.items.map((item) => [item.name, item]));
  const item = catalog.get(name);
  if (!item) throw new Error(`Unknown registry item "${name}"`);
  return item;
}

/** Whether a file the item ships imports InkFrame from its install path. */
function importsInkFrame(item: LoadedRegistryItem): boolean {
  return item.files.some((file) =>
    extractImports(readFileSync(path.resolve(file.path), "utf8")).some(
      ({ specifier }) => specifier === INK_FRAME_IMPORT,
    ),
  );
}

/**
 * The items one `add` names for `name`: an item whose shipped files import
 * `@/components/ink-frame` brings ink-frame first (redundant since the catalog declares it as
 * a URL registryDependency, but harmless). The theme is named alone: it brings its three font
 * items by URL, and naming them too in the same add gives the CLI a second source for each,
 * which writes every font's `.variable` into layout.tsx twice (shadcn 4.23).
 */
export function itemsToAdd(name: string): string[] {
  const item = catalogItem(name);
  if (item.type === "registry:theme") return [name];
  return importsInkFrame(item) ? [INK_FRAME, name] : [name];
}

/** The theme item: its add asks a question of its own, which only `--yes` answers. */
export const THEME_ITEM = "theme";

/**
 * The flags every printed `add` carries, so the line runs unattended (shadcn CLI 4.23, stdin
 * closed). `--overwrite` answers "already exists. Would you like to overwrite?" for a file the
 * project has (a stock or edited `components/ui/button.tsx`); `--yes` answers the theme's "You
 * are about to install a new theme… Continue? (y/N)", which `--overwrite` does not. Unanswered,
 * either question ends the run with exit 0 and nothing written.
 */
export function addFlags(items: readonly string[]): string[] {
  return items.some(isThemeItem) ? ["--yes", "--overwrite"] : ["--overwrite"];
}

/** Whether an add of `name` asks the theme's question: the theme and every preset (`theme-sepia`). */
function isThemeItem(name: string): boolean {
  return name === THEME_ITEM || catalogItem(name).type === "registry:theme";
}

/** Why the flags are there, in one sentence an agent can act on. */
export function flagsNote(items: readonly string[]): string {
  const overwrite =
    "--overwrite answers the CLI's question when a file is already there (a stock or edited components/ui/button.tsx)";
  return items.some(isThemeItem)
    ? `Keep both flags: --yes answers the theme's "You are about to install a new theme… Continue?", and ${overwrite}. Without them an unattended add stops at the question, exits 0 and writes nothing.`
    : `Keep the flag: ${overwrite}. Without it an unattended add stops at the question, exits 0 and writes nothing.`;
}

/**
 * One `shadcn add` for `items` (bare names, added as `@mangacn/<name>`) through `manager`,
 * with `addFlags(items)`.
 */
export function addCommand(items: readonly string[], manager: PackageManager): string {
  const names = items.map((item) => `@mangacn/${item}`);
  return `${RUNNERS[manager]} shadcn@latest add ${[...names, ...addFlags(items)].join(" ")}`;
}

/** `pnpm dlx shadcn@latest add @mangacn/ink-frame @mangacn/button --overwrite` and its npm/yarn/bun forms. */
export function installCommand(name: string, manager: PackageManager): string {
  return addCommand(itemsToAdd(name), manager);
}

/** Install order within one add: the theme, its fonts, ink-frame, then the rest as named. */
function addRank(name: string): number {
  const { type } = catalogItem(name);
  if (type === "registry:theme") return 0;
  if (type === "registry:font") return 1;
  return name === INK_FRAME ? 2 : 3;
}

/**
 * Every item one add names for the set `names`, each once, in install order. With the theme in
 * the set its font items are left out: the theme brings them, and naming them twice doubles
 * their layout.tsx edits (see `itemsToAdd`).
 */
export function setToAdd(names: readonly string[]): string[] {
  const items = [...new Set(names.flatMap(itemsToAdd))];
  const withTheme = items.some((name) => catalogItem(name).type === "registry:theme");
  return items
    .filter((name) => !(withTheme && catalogItem(name).type === "registry:font"))
    .sort((a, b) => addRank(a) - addRank(b));
}

/** One `shadcn add` for a set of items, as `get_install_command` and the Installation page print it. */
export function setCommand(names: readonly string[], manager: PackageManager): string {
  return addCommand(setToAdd(names), manager);
}

/**
 * The first install the Installation page prints: the theme (with its fonts), the ink frame and
 * one item. `scripts/registry-smoke.ts` runs this exact line without a TTY.
 */
export const SETUP_ITEMS = [THEME_ITEM, INK_FRAME, "speech-bubble"] as const;

/** What an `<InstallCommand>` prints: one item's page (`item`) or the Installation page's first install (`setup`). */
export type InstallCommandProps = { item: string; setup?: never } | { setup: true; item?: never };

/** The line an `<InstallCommand>` prints for `manager`. */
export function commandFor(props: InstallCommandProps, manager: PackageManager): string {
  return props.setup ? setCommand(SETUP_ITEMS, manager) : installCommand(props.item, manager);
}

/**
 * What one add of `name` writes, at the default `components.json` aliases: the item's own files
 * (`components/blocks/chapter-list/chapter-list.tsx`, …), then what its mangacn registry
 * dependencies add, transitively. A block's page prints it under the install block.
 */
export function itemFiles(name: string): { files: string[]; dependencyFiles: string[] } {
  const item = catalogItem(name);
  return {
    files: item.files.map(installTarget),
    dependencyFiles: registry ? dependencyFiles(name, registry) : [],
  };
}

/** The client-component line under an item's install block; null for the setup block and the theme. */
export function itemClientNote(props: InstallCommandProps): string | null {
  if (props.setup) return null;
  const client = isClientItem(catalogItem(props.item));
  return client === null ? null : clientNote(client);
}

/** The exact command `shadcn init` takes for the base-nova style (CLI 4.23: `-p base-nova` is "Invalid preset"). */
export function initCommand(manager: PackageManager): string {
  return `${RUNNERS[manager]} shadcn@latest init -b base -p nova`;
}

/**
 * The docs page for an item: a component's or a block's own page (`/docs/blocks/<name>`); the
 * theme is documented on the theming guide, a preset (`theme-sepia`) under its Presets heading; a hook, which has no page, links its registry JSON.
 */
export function docsUrl(name: string): string {
  const item = catalogItem(name);
  if (item.type === "registry:theme") {
    return `${SITE_URL}/docs/theming${name === THEME_ITEM ? "" : "#presets"}`;
  }
  if (item.type === "registry:hook") return registryItemUrl(name);
  return `${SITE_URL}${itemPagePath(item) ?? `/docs/components/${name}`}`;
}

/** A short prompt an agent can act on: what the item is, how to install it, where its docs are. */
export function promptFor(name: string): string {
  const item = catalogItem(name);
  const url = docsUrl(name);
  return [
    `Add the mangacn item "${name}" (${item.title ?? name}) to this project.`,
    item.description,
    "",
    `Install it with: ${installCommand(name, "npm")}`,
    flagsNote(itemsToAdd(name)),
    `The @mangacn registry setup is at ${SITE_URL}/docs/installation.`,
    `Docs: ${url}`,
    `Markdown for agents (props and examples): ${url}.md`,
    `Or read it through the mangacn docs MCP at ${MCP_URL}, and install the rules with: ${SKILL_INSTALL_COMMAND}`,
  ]
    .filter((line) => line !== undefined)
    .join("\n");
}
