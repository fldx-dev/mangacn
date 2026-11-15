/**
 * What a Create code installs, file by file (Task C6): the "What you get" tab of the Get code
 * dialog and the files section of `/create.md`. Read from the same item builders the routes
 * serve (`./items.ts`): the bundle's dependencies name the theme and the kit, the theme's name the
 * fonts, and each kit item's files and dependencies come from this repo's catalog, so the list is
 * what `shadcn add` writes.
 *
 * No Node imports, but it carries the whole catalog: the page loads it only when the dialog
 * opens (`import()`), so `/create` itself stays as light as before.
 */

import blocksCatalog from "@/registry/blocks/registry.json";
import hooksCatalog from "@/registry/hooks/registry.json";
import themeCatalog from "@/registry/theme/registry.json";
import uiCatalog from "@/registry/ui/registry.json";
import type { CreateConfig } from "./config";
import { bundleItem, themeItem } from "./items";
import { SITE_ORIGIN } from "./urls";

/** The two project templates the commands create. */
export type Framework = "next" | "vite";

interface CatalogFile {
  path: string;
  type: string;
  target?: string;
}

interface CatalogItem {
  name: string;
  type: string;
  title?: string;
  dependencies?: string[];
  registryDependencies?: string[];
  files?: CatalogFile[];
  font?: { family: string; dependency?: string };
}

const CATALOG = new Map<string, CatalogItem>(
  [themeCatalog, uiCatalog, blocksCatalog, hooksCatalog]
    .flatMap((catalog) => catalog.items as CatalogItem[])
    .map((item) => [item.name, item]),
);

const ITEM_URL = /^https:\/\/www\.mangacn\.com\/r\/([a-z0-9-]+)\.json$/;

/** `https://www.mangacn.com/r/button.json` → `button`; anything else → null. */
function itemName(url: string): string | null {
  return ITEM_URL.exec(url)?.[1] ?? null;
}

// Where `shadcn add` writes a file with the default `components.json` aliases. The same rules as
// `lib/registry/install-target.ts`, which reads files from disk; a test holds the two equal.
const ALIASES: [prefix: string, dir: string][] = [
  ["@ui/", "components/ui/"],
  ["@components/", "components/"],
  ["@lib/", "lib/"],
  ["@hooks/", "hooks/"],
];
const TYPE_DIRS: Record<string, string> = {
  "registry:ui": "components/ui",
  "registry:component": "components",
  "registry:block": "components",
  "registry:lib": "lib",
  "registry:hook": "hooks",
};

/** A catalog file's path in a Next.js project: `@ui/button.tsx` → `components/ui/button.tsx`. */
export function nextTarget(file: CatalogFile): string {
  if (file.target) {
    const alias = ALIASES.find(([prefix]) => file.target?.startsWith(prefix));
    return alias ? alias[1] + file.target.slice(alias[0].length) : file.target;
  }
  return `${TYPE_DIRS[file.type] ?? "components"}/${file.path.split("/").pop()}`;
}

export interface InstalledItem {
  name: string;
  title: string;
  /** The project files it writes. */
  files: string[];
  /** Page files a Vite project does not get (the CLI skips `registry:page` there). */
  skipped: string[];
}

export interface InstallPlan {
  framework: Framework;
  /** The stylesheet the theme writes into. */
  stylesheet: string;
  /** Where the fonts are loaded: the root layout (Next.js) or the stylesheet (Vite). */
  fontFile: string;
  /** The faces the theme installs, by family. */
  fonts: string[];
  /** The kit's own items, in kit order. */
  kit: InstalledItem[];
  /** Items the kit's items bring with them, first use first. */
  brought: InstalledItem[];
  /** npm packages added to `package.json`, sorted. */
  packages: string[];
}

/** The files, fonts and packages a configuration installs into a new `framework` project. */
export function installPlan(config: CreateConfig, framework: Framework = "next"): InstallPlan {
  const vite = framework === "vite";
  const prefix = vite ? "src/" : "";
  const packages = new Set<string>();

  const fontItems = themeItem(config, SITE_ORIGIN)
    .registryDependencies.map(itemName)
    .flatMap((name) => (name && CATALOG.get(name)?.font ? [CATALOG.get(name) as CatalogItem] : []));
  const fonts = fontItems.map((item) => item.font?.family ?? item.name);
  if (vite) {
    for (const item of fontItems) if (item.font?.dependency) packages.add(item.font.dependency);
  }

  const kitNames = bundleItem(config, SITE_ORIGIN)
    .registryDependencies.slice(1) // the first is the generated theme
    .flatMap((url) => itemName(url) ?? []);

  const installed = (name: string): InstalledItem | null => {
    const item = CATALOG.get(name);
    // The look's own theme and fonts arrive with the generated theme, not through the kit.
    if (!item || item.type === "registry:theme" || item.type === "registry:font") return null;
    for (const dependency of item.dependencies ?? []) packages.add(dependency);
    const files: string[] = [];
    const skipped: string[] = [];
    for (const file of item.files ?? []) {
      const target = nextTarget(file);
      if (vite && file.type === "registry:page") skipped.push(target);
      else files.push(prefix + target);
    }
    return { name, title: item.title ?? name, files, skipped };
  };

  const kit = kitNames.flatMap((name) => installed(name) ?? []);
  const seen = new Set(kitNames);
  const brought: InstalledItem[] = [];
  const visit = (name: string) => {
    for (const url of CATALOG.get(name)?.registryDependencies ?? []) {
      const dependency = itemName(url);
      if (!dependency || seen.has(dependency)) continue;
      seen.add(dependency);
      const described = installed(dependency);
      if (described) brought.push(described);
      visit(dependency);
    }
  };
  kitNames.forEach(visit);

  return {
    framework,
    stylesheet: vite ? "src/index.css" : "app/globals.css",
    fontFile: vite ? "src/index.css" : "app/layout.tsx",
    fonts,
    kit,
    brought,
    packages: [...packages].sort(),
  };
}
