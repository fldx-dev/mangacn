/**
 * Theme presets (Task 99): other paper, ink and spot for the same theme. A preset is a values
 * file, `registry/theme/presets/<name>.json` (the eight base colours in light and dark), plus its
 * name in `THEME_PRESETS`. `pnpm gen:theme` turns each into the `registry:theme` item
 * `theme-<name>` in the theme catalog and into the docs site's scoped stylesheet
 * (`lib/registry/theme-preset-items.ts`).
 *
 * To add a preset:
 *   1. write registry/theme/presets/<name>.json (copy sepia.json, change the values)
 *   2. add "<name>" to THEME_PRESETS below
 *   3. run `pnpm gen:theme` and commit the catalog it rewrites
 *
 * This module holds no Node imports: the stage's mode component and the Theming page's switch
 * read it in the browser.
 */

/** Every preset, in the order the Theming page's switch lists them after the default. */
export const THEME_PRESETS = ["sepia", "weekly", "blueline"] as const;

export type ThemePreset = (typeof THEME_PRESETS)[number];

/** The default look plus every preset: what a switch offers. */
export const THEME_LOOKS = ["default", ...THEME_PRESETS] as const;

export type ThemeLook = (typeof THEME_LOOKS)[number];

/**
 * The attribute that selects a preset on the docs site (`<html data-theme-preset="sepia">`, or
 * any element, for one region). The default look is the attribute's absence.
 */
export const PRESET_ATTRIBUTE = "data-theme-preset";

/** Where the Theming page's switch keeps the reader's choice (a per-viewer preference). */
export const PRESET_STORAGE_KEY = "mangacn-theme-preset";

/**
 * The colours a preset gives. Everything else in the theme (the shadcn tokens, which point at
 * these through `var()`, the radius, fonts, pen and utilities) stays the default theme's.
 */
export const PRESET_BASE_TOKENS = [
  "ink",
  "paper",
  "spot",
  "spot-foreground",
  "tone-1",
  "tone-2",
  "tone-3",
  "tone-4",
] as const;

type Vars = Record<string, string>;

/**
 * A look's light and dark cssVars: the default theme's for each mode with the look's base
 * colours in place. Every other token (the shadcn ones are `var()`s of a base colour, the radius)
 * keeps the default's value, so the tokens follow the base colours through those references. The
 * preset items (`./theme-preset-items.ts`) and the Create page's theme (`lib/create/items.ts`)
 * both derive their values here.
 */
export function presetCssVars(
  defaults: { light: Vars; dark: Vars },
  base: { light: Vars; dark: Vars },
): { light: Vars; dark: Vars } {
  const withBase = (mode: Vars, values: Vars) =>
    Object.fromEntries(
      Object.entries(mode).map(([key, value]) => [
        key,
        Object.hasOwn(values, key) ? values[key] : value,
      ]),
    );
  return { light: withBase(defaults.light, base.light), dark: withBase(defaults.dark, base.dark) };
}

export function isThemePreset(value: unknown): value is ThemePreset {
  return (THEME_PRESETS as readonly unknown[]).includes(value);
}

/** The registry item a look installs: `theme` for the default, `theme-<name>` for a preset. */
export function presetItemName(look: ThemeLook): string {
  return look === "default" ? "theme" : `theme-${look}`;
}

/**
 * The inline script that applies a stored preset before the first paint. It reads storage
 * defensively (a private window or blocked storage throws) and accepts only a known name.
 */
export const PRESET_SCRIPT = `try{var p=localStorage.getItem(${JSON.stringify(PRESET_STORAGE_KEY)});if(${JSON.stringify(THEME_PRESETS)}.indexOf(p)>-1)document.documentElement.setAttribute(${JSON.stringify(PRESET_ATTRIBUTE)},p)}catch(e){}`;

/** The stored preset, or null for the default look, an unknown value or unreadable storage. */
export function readStoredPreset(): ThemePreset | null {
  try {
    const value = window.localStorage.getItem(PRESET_STORAGE_KEY);
    return isThemePreset(value) ? value : null;
  } catch {
    return null;
  }
}

/** Stores the reader's choice; the default look clears it. Storage errors are ignored. */
export function storePreset(look: ThemeLook): void {
  try {
    if (look === "default") window.localStorage.removeItem(PRESET_STORAGE_KEY);
    else window.localStorage.setItem(PRESET_STORAGE_KEY, look);
  } catch {
    // The choice still applies to this page; it just is not remembered.
  }
}

/** Sets or clears the preset attribute on the root element. */
export function applyPreset(look: ThemeLook | null): void {
  const root = document.documentElement;
  if (look && look !== "default") root.setAttribute(PRESET_ATTRIBUTE, look);
  else root.removeAttribute(PRESET_ATTRIBUTE);
}
