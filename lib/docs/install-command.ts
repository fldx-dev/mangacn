import { readFileSync } from "node:fs";
import path from "node:path";
import { type LoadedRegistryItem, loadRegistry } from "@/lib/registry";
import { clientNote, isClientItem } from "@/lib/registry/client";
import { extractImports } from "@/lib/registry/imports";

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

let catalog: Map<string, LoadedRegistryItem> | undefined;

/** The catalog entry for `name`, read once from disk (server only). */
function catalogItem(name: string): LoadedRegistryItem {
  catalog ??= new Map(loadRegistry().items.map((item) => [item.name, item]));
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
 * The items one `add` names for `name`: the theme brings the font items, and an item whose
 * shipped files import `@/components/ink-frame` brings ink-frame first. Once the catalog
 * declares ink-frame as a URL registryDependency the prefix is redundant but harmless.
 */
export function itemsToAdd(name: string): string[] {
  const item = catalogItem(name);
  if (item.type === "registry:theme") {
    const fonts = [...(catalog?.values() ?? [])].filter((entry) => entry.type === "registry:font");
    return [name, ...fonts.map((font) => font.name)];
  }
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
  return items.includes(THEME_ITEM) ? ["--yes", "--overwrite"] : ["--overwrite"];
}

/** Why the flags are there, in one sentence an agent can act on. */
export function flagsNote(items: readonly string[]): string {
  const overwrite =
    "--overwrite answers the CLI's question when a file is already there (a stock or edited components/ui/button.tsx)";
  return items.includes(THEME_ITEM)
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

/** Every item one add names for the set `names`, each once, in install order. */
export function setToAdd(names: readonly string[]): string[] {
  return [...new Set(names.flatMap(itemsToAdd))].sort((a, b) => addRank(a) - addRank(b));
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

/** The docs page for an item; the theme is documented on the theming guide. */
export function docsUrl(name: string): string {
  const item = catalogItem(name);
  return item.type === "registry:theme"
    ? `${SITE_URL}/docs/theming`
    : `${SITE_URL}/docs/components/${name}`;
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
