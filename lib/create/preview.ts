/**
 * The CSS variables the Create page sets on its preview wrapper, so everything inside renders in
 * the chosen look with the real components' own styles. Every value is built from numbers and
 * names `decode` checked, never from URL text. No Node imports.
 *
 * Custom properties resolve where they are declared: `:root { --background: var(--paper) }`
 * hands its children the root's paper, not theirs. So the wrapper declares the theme's derived
 * tokens again (`--background: var(--paper)`, …) beside the eight base colours, and they follow
 * the wrapper's own values.
 */

import type { Mode } from "@/lib/registry/contrast";
import themeCatalog from "@/registry/theme/registry.json";
import { baseValues } from "./colours";
import {
  type CreateConfig,
  type DialogueFont,
  type DisplayFont,
  PEN_RANGES,
  PEN_TOKENS,
  SCREENTONE_RANGES,
  SCREENTONE_TOKENS,
} from "./config";

type CatalogItem = { name: string; cssVars?: { light?: Record<string, string> } };

const themeVars =
  (themeCatalog.items as CatalogItem[]).find((item) => item.name === "theme")?.cssVars?.light ?? {};

/** The theme's tokens that point at others (`background: var(--paper)`, …), in catalog order. */
export const DERIVED_TOKENS: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(themeVars).filter(([, value]) => value.startsWith("var(")),
);

/**
 * The CSS variable each extra face is loaded under on the Create page
 * (`components/create/create-fonts.ts`). The site's own faces (Dela Gothic One, Shantell Sans)
 * need none: the wrapper leaves the site's variable in place.
 */
export const FONT_FACE_VARIABLES = {
  "reggae-one": "--font-create-reggae-one",
  "patrick-hand-sc": "--font-create-patrick-hand-sc",
} as const satisfies Partial<Record<DisplayFont | DialogueFont, string>>;

const DISPLAY_DEFAULT: DisplayFont = "dela-gothic-one";
const DIALOGUE_DEFAULT: DialogueFont = "shantell-sans";

/** Display names of the faces, as the rail lists them. */
export const FONT_LABELS: Record<DisplayFont | DialogueFont, string> = {
  "dela-gothic-one": "Dela Gothic One",
  "reggae-one": "Reggae One",
  "shantell-sans": "Shantell Sans",
  "patrick-hand-sc": "Patrick Hand SC",
};

function fontVariable(font: DisplayFont | DialogueFont): string {
  return `var(${FONT_FACE_VARIABLES[font as keyof typeof FONT_FACE_VARIABLES]})`;
}

/** A number as CSS writes it, with its range's unit (`1.5px`, `1.2`). */
function cssNumber(value: number, unit: string): string {
  return `${Number(value.toFixed(2))}${unit}`;
}

/**
 * Every variable the preview wrapper sets for a configuration in one mode: the eight base
 * colours, the derived tokens, the six pen values, the three screentone values, the fonts that
 * differ from the site's and the seed offset of the drawings (`--ink-seed`).
 */
export function previewVariables(
  config: CreateConfig,
  mode: Mode,
  seed = 0,
): Record<`--${string}`, string> {
  const vars: Record<`--${string}`, string> = {};
  for (const [token, value] of Object.entries(baseValues(config.look)[mode])) {
    vars[`--${token}`] = value;
  }
  for (const [token, value] of Object.entries(DERIVED_TOKENS)) vars[`--${token}`] = value;
  for (const token of PEN_TOKENS) {
    vars[`--${token}`] = cssNumber(config.pen[token], PEN_RANGES[token].unit);
  }
  for (const token of SCREENTONE_TOKENS) {
    vars[`--${token}`] = cssNumber(config.screentone[token], SCREENTONE_RANGES[token].unit);
  }
  if (config.fonts.display !== DISPLAY_DEFAULT) {
    vars["--font-display"] = fontVariable(config.fonts.display);
  }
  if (config.fonts.dialogue !== DIALOGUE_DEFAULT) {
    vars["--font-dialogue-latin"] = fontVariable(config.fonts.dialogue);
  }
  vars["--ink-seed"] = String(Math.trunc(seed));
  return vars;
}
