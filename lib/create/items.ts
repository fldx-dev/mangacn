/**
 * The two registry items a Create configuration installs (Task C3, measured in Task C1 with
 * shadcn 4.23):
 *
 * - the **theme** (`/r/create/<code>/theme.json`): a full `registry:theme`, a copy of the default
 *   `theme` item with the configuration's base colours, pen and screentone, plus what the CLI
 *   needs when the theme arrives through a `registry:base` item (`init -p <url>` writes no
 *   `--color-*` mappings of its own, so `border-border` would be unknown): `color-<token>` for
 *   every shadcn token, `font-sans`, `font-heading` and `html { @apply font-sans }`. It depends on
 *   the font items itself and never on `theme.json`: two font items with one variable in one
 *   install break `app/layout.tsx`.
 * - the **bundle** (`/r/create/<code>.json`): a `registry:base` with base-nova's `config`, which
 *   `shadcn init -p <url>` takes as the project's preset, depending on the theme and the kit.
 *
 * Every string here is built from the configuration's numbers and names (which `decode`
 * validated) and from this repo's catalog; nothing is copied from a URL. The code in the names
 * and URLs is `encode(config)`, so it is base-62 digits only. No Node imports.
 */

import { presetCssVars } from "@/lib/registry/theme-presets";
import themeCatalog from "@/registry/theme/registry.json";
import { encode } from "./code";
import { baseValues } from "./colours";
import {
  type CreateConfig,
  type DialogueFont,
  type DisplayFont,
  PEN_RANGES,
  PEN_TOKENS,
  type Range,
  SCREENTONE_RANGES,
  SCREENTONE_TOKENS,
} from "./config";
import { kitItems } from "./kits";
import { CREATE_PAGE_URL, registryUrl, SITE_ORIGIN, themeUrl } from "./urls";

type Vars = Record<string, string>;
/** A registry item's `css`: rules and at-rules nested as objects, declarations as strings. */
export type CssTree = { [key: string]: string | CssTree };

/** The schema URL every built item carries. */
export const ITEM_SCHEMA = "https://ui.shadcn.com/schema/registry-item.json";

interface DefaultThemeItem {
  name: string;
  description: string;
  categories: string[];
  cssVars: { theme: Vars; light: Vars; dark: Vars };
  css: CssTree;
}

const DEFAULT_THEME = themeCatalog.items.find(
  (item) => item.name === "theme",
) as unknown as DefaultThemeItem;

/**
 * The shadcn tokens nova's own theme maps to Tailwind colours (`--color-background:
 * var(--background)` …). The generated theme brings the mappings itself (Task C1).
 */
export const SEMANTIC_TOKENS = [
  "background",
  "foreground",
  "card",
  "card-foreground",
  "popover",
  "popover-foreground",
  "primary",
  "primary-foreground",
  "secondary",
  "secondary-foreground",
  "muted",
  "muted-foreground",
  "accent",
  "accent-foreground",
  "destructive",
  "border",
  "input",
  "ring",
  "chart-1",
  "chart-2",
  "chart-3",
  "chart-4",
  "chart-5",
  "sidebar",
  "sidebar-foreground",
  "sidebar-primary",
  "sidebar-primary-foreground",
  "sidebar-accent",
  "sidebar-accent-foreground",
  "sidebar-border",
  "sidebar-ring",
] as const;

/** The `cssVars.theme` entries added for the `registry:base` path, beyond the colour mappings. */
export const FONT_MAPPINGS: Vars = {
  "font-sans": "var(--font-sans)",
  "font-heading": "var(--font-sans)",
};

/**
 * What a `registry:base` item's `config` must say for `shadcn init -t <template> -b base -p <url>`
 * to make the same project as `-p nova` (measured, shadcn 4.23).
 */
export const BASE_CONFIG = {
  style: "base-nova",
  iconLibrary: "lucide",
  rtl: false,
  menuColor: "default",
  menuAccent: "subtle",
  tailwind: { baseColor: "neutral", cssVariables: true },
} as const;

// ── Fonts ───────────────────────────────────────────────────────────────────────────────────

/** The font items of the default faces (`registry/theme/registry.json`). */
const DEFAULT_DISPLAY_ITEM = "font-display";
const DEFAULT_DIALOGUE_ITEM = "font-dialogue";
/** The Japanese dialogue face: not a choice, every theme brings it. */
const JAPANESE_DIALOGUE_ITEM = "font-dialogue-ja";

/**
 * The font item each face installs. A face with no item yet (a reserved alternative another task
 * adds) installs its role's default face, so a code naming it still installs a working theme.
 */
const DISPLAY_FONT_ITEMS: Partial<Record<DisplayFont, string>> = {
  "dela-gothic-one": DEFAULT_DISPLAY_ITEM,
};
const DIALOGUE_FONT_ITEMS: Partial<Record<DialogueFont, string>> = {
  "shantell-sans": DEFAULT_DIALOGUE_ITEM,
};

/** The font items a configuration's theme depends on: display, dialogue, Japanese dialogue. */
export function fontItemNames(fonts: CreateConfig["fonts"]): string[] {
  return [
    DISPLAY_FONT_ITEMS[fonts.display] ?? DEFAULT_DISPLAY_ITEM,
    DIALOGUE_FONT_ITEMS[fonts.dialogue] ?? DEFAULT_DIALOGUE_ITEM,
    JAPANESE_DIALOGUE_ITEM,
  ];
}

// ── Items ───────────────────────────────────────────────────────────────────────────────────

/** A number of a range as a CSS value: `1.5px`, `0.8`. */
function cssValue(value: number, range: Range): string {
  return `${value}${range.unit}`;
}

export interface CreateThemeItem {
  $schema: string;
  name: string;
  type: "registry:theme";
  title: string;
  description: string;
  categories: string[];
  docs: string;
  registryDependencies: string[];
  files: [];
  cssVars: { theme: Vars; light: Vars; dark: Vars };
  css: CssTree;
}

export interface CreateBundleItem {
  $schema: string;
  name: string;
  type: "registry:base";
  title: string;
  description: string;
  docs: string;
  config: {
    style: string;
    iconLibrary: string;
    rtl: boolean;
    menuColor: string;
    menuAccent: string;
    tailwind: { baseColor: string; cssVariables: boolean };
  };
  registryDependencies: string[];
  files: [];
}

/** The theme a configuration installs, its dependencies at `origin`. */
export function themeItem(config: CreateConfig, origin: string = SITE_ORIGIN): CreateThemeItem {
  const code = encode(config);
  const theme = structuredClone(DEFAULT_THEME);
  const tokens: Vars = { ...theme.cssVars.theme };
  for (const token of PEN_TOKENS) tokens[token] = cssValue(config.pen[token], PEN_RANGES[token]);
  for (const token of SCREENTONE_TOKENS) {
    tokens[token] = cssValue(config.screentone[token], SCREENTONE_RANGES[token]);
  }
  for (const token of SEMANTIC_TOKENS) tokens[`color-${token}`] = `var(--${token})`;
  Object.assign(tokens, FONT_MAPPINGS);
  const base = theme.css["@layer base"] as CssTree;
  return {
    $schema: ITEM_SCHEMA,
    name: `create-${code}-theme`,
    type: "registry:theme",
    title: "mangacn theme (Create)",
    description: theme.description,
    categories: theme.categories,
    docs: `The mangacn theme of Create code ${code}: its look, pen and screentone, with its fonts. Change it at ${CREATE_PAGE_URL}.`,
    registryDependencies: fontItemNames(config.fonts).map((name) => registryUrl(name, origin)),
    files: [],
    cssVars: { theme: tokens, ...presetCssVars(theme.cssVars, baseValues(config.look)) },
    css: { ...theme.css, "@layer base": { ...base, html: { "@apply font-sans": {} } } },
  };
}

/** The bundle a configuration installs: base-nova's preset, the theme and the kit, at `origin`. */
export function bundleItem(config: CreateConfig, origin: string = SITE_ORIGIN): CreateBundleItem {
  const code = encode(config);
  const kit = kitItems(config.kit);
  const kitLabel =
    "preset" in config.kit
      ? `the ${config.kit.preset} kit`
      : `a kit of ${kit.length} hand-picked item${kit.length === 1 ? "" : "s"}`;
  return {
    $schema: ITEM_SCHEMA,
    name: `create-${code}`,
    type: "registry:base",
    title: "mangacn project (Create)",
    description:
      "A mangacn project from the Create page: a theme with its fonts and a starter kit.",
    docs: `mangacn Create code ${code}: its theme and fonts, and ${kitLabel}. Change it at ${CREATE_PAGE_URL}.`,
    config: { ...BASE_CONFIG, tailwind: { ...BASE_CONFIG.tailwind } },
    registryDependencies: [themeUrl(code, origin), ...kit.map((name) => registryUrl(name, origin))],
    files: [],
  };
}
