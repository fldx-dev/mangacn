import { readFileSync } from "node:fs";
import path from "node:path";
import { type LoadedRegistryItem, loadRegistry } from "@/lib/registry";
import { extractImports } from "@/lib/registry/imports";

export type PackageManager = "pnpm" | "npm" | "yarn" | "bun";

export const PACKAGE_MANAGERS: PackageManager[] = ["pnpm", "npm", "yarn", "bun"];

export const SITE_URL = "https://www.mangacn.com";

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
function itemsToAdd(name: string): string[] {
  const item = catalogItem(name);
  if (item.type === "registry:theme") {
    const fonts = [...(catalog?.values() ?? [])].filter((entry) => entry.type === "registry:font");
    return [name, ...fonts.map((font) => font.name)];
  }
  return importsInkFrame(item) ? [INK_FRAME, name] : [name];
}

/** `pnpm dlx shadcn@latest add @mangacn/ink-frame @mangacn/button` and its npm/yarn/bun forms. */
export function installCommand(name: string, manager: PackageManager): string {
  const items = itemsToAdd(name).map((item) => `@mangacn/${item}`);
  return `${RUNNERS[manager]} shadcn@latest add ${items.join(" ")}`;
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
    `The @mangacn registry setup is at ${SITE_URL}/docs/installation.`,
    `Docs: ${url}`,
    `Markdown for agents (props and examples): ${url}.md`,
  ]
    .filter((line) => line !== undefined)
    .join("\n");
}
