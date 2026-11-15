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
  PEN_RANGES,
  PEN_TOKENS,
  type Range,
  SCREENTONE_RANGES,
  SCREENTONE_TOKENS,
} from "./config";
import {
  type FontFace,
  type FontId,
  type FontRole,
  familyStack,
  fontFace,
  ROLE_VARIABLES,
} from "./fonts";
import { kitItems } from "./kits";
import { CREATE_PAGE_URL, fontUrl, registryUrl, SITE_ORIGIN, themeUrl } from "./urls";

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

/** The Japanese dialogue face: not a choice, every theme brings it. */
const JAPANESE_DIALOGUE_ITEM = "font-dialogue-ja";

/**
 * The URL of the font item that installs one role's face: the static item for a default face
 * (so the default faces install exactly what `theme.json` installs), the generated
 * `/r/create/font/<role>/<id>.json` for an alternative.
 */
function roleFontUrl(role: FontRole, id: FontId, origin: string): string {
  const face = fontFace(role, id) as FontFace;
  return face.staticItem ? registryUrl(face.staticItem, origin) : fontUrl(role, id, origin);
}

/**
 * The font items a configuration's theme depends on, at `origin`: display, dialogue, Japanese
 * dialogue. One item per variable, so no install loads two faces into one variable.
 */
export function fontItemUrls(fonts: CreateConfig["fonts"], origin: string = SITE_ORIGIN): string[] {
  return [
    roleFontUrl("display", fonts.display, origin),
    roleFontUrl("dialogue", fonts.dialogue, origin),
    registryUrl(JAPANESE_DIALOGUE_ITEM, origin),
  ];
}

/** The font stacks of the theme: each role's chosen face first, worded as the static theme. */
export function fontStacks(fonts: CreateConfig["fonts"]): Vars {
  const display = familyStack("display", fonts.display).join(", ");
  const [dialogue, ...otherDialogue] = familyStack("dialogue", fonts.dialogue);
  return {
    "font-display": `var(${ROLE_VARIABLES.display}, ${display}, Impact, "Arial Black", sans-serif)`,
    "font-dialogue": `var(${ROLE_VARIABLES.dialogue}, ${dialogue}), var(--font-dialogue-ja, "Yusei Magic"), ${[...otherDialogue, '"Comic Neue"', "cursive", "sans-serif"].join(", ")}`,
  };
}

export interface CreateFontItem {
  $schema: string;
  name: string;
  type: "registry:font";
  title: string;
  description: string;
  categories: string[];
  docs: string;
  files: [];
  font: {
    family: string;
    provider: "google";
    import: string;
    variable: string;
    weight?: string[];
    subsets: string[];
    dependency: string;
  };
}

/**
 * The `registry:font` item of a curated face, or undefined for a role or id the list does not
 * have. A default face's item carries the same `font` as its static item.
 */
export function fontItem(role: string, id: string): CreateFontItem | undefined {
  const face = fontFace(role, id);
  if (!face) return undefined;
  const fontRole = role as FontRole;
  return {
    $schema: ITEM_SCHEMA,
    name: `font-${fontRole}-${id}`,
    type: "registry:font",
    title: face.family,
    description: face.description,
    categories: ["text"],
    docs: `A ${fontRole} face of the mangacn theme, chosen at ${CREATE_PAGE_URL}. A Create code's theme depends on one face per role; install the theme rather than this item beside another ${fontRole} face.`,
    files: [],
    font: {
      family: face.family,
      provider: "google",
      import: face.import,
      variable: ROLE_VARIABLES[fontRole],
      ...(face.weight ? { weight: [...face.weight] } : {}),
      subsets: [...face.subsets],
      dependency: face.dependency,
    },
  };
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
  Object.assign(tokens, fontStacks(config.fonts));
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
    registryDependencies: fontItemUrls(config.fonts, origin),
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

/**
 * The body font a new Vite project gets: Tailwind's own sans stack. A Next.js template loads its
 * body face into `--font-sans` in `app/layout.tsx`, which the theme's `font-sans` mapping reads;
 * a Vite project made from a `registry:base` has no such variable (nova would have brought one),
 * so its `font-sans` would resolve to nothing. No face is downloaded for it.
 */
export const VITE_FONT_SANS =
  'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"';

/**
 * The bundle a new Vite project starts from: the same preset, theme and kit as `bundleItem`, and
 * a `font-sans` the project can resolve. Its own variables are written after its dependencies',
 * so they win over the theme's mapping; the Next.js bundle and the theme are unchanged.
 */
export function viteBundleItem(
  config: CreateConfig,
  origin: string = SITE_ORIGIN,
): CreateBundleItem & { cssVars: { theme: Vars } } {
  const item = bundleItem(config, origin);
  return {
    ...item,
    name: `${item.name}-vite`,
    title: "mangacn Vite project (Create)",
    docs: `${item.docs} For a new Vite project: its body font is the system sans stack.`,
    cssVars: { theme: { "font-sans": VITE_FONT_SANS } },
  };
}
