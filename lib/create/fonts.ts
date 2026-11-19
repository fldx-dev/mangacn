/**
 * The Create page's curated faces (Task C7): two per role, from the typography research
 * (SPEC.md §13). The display role draws titles and sound effects under `--font-display`; the
 * dialogue role draws speech under `--font-dialogue-latin`, which the theme's dialogue stack
 * chains to the Japanese face (`--font-dialogue-ja`, Yusei Magic, every theme brings it).
 *
 * A face is plain data: what a `registry:font` item needs (the `next/font/google` import, the
 * weights and subsets it accepts, the Fontsource package Vite installs) and the family name the
 * theme's stacks fall back to. Adding a face is one entry here and one slot in `./config.ts`
 * (a reserved slot, so no published code changes meaning). Adding a face is the owner's
 * decision (SPEC-create §9, "ask first"). No Node imports: the page reads the labels.
 */

import type { DialogueFont, DisplayFont } from "./config";

/** The two roles a code chooses a face for. */
export const FONT_ROLES = ["display", "dialogue"] as const;
export type FontRole = (typeof FONT_ROLES)[number];

/** A face of either role. */
export type FontId = DisplayFont | DialogueFont;

/** The CSS variable each role's font item sets (one item per variable in any install). */
export const ROLE_VARIABLES: Record<FontRole, `--${string}`> = {
  display: "--font-display",
  dialogue: "--font-dialogue-latin",
};

export interface FontFace {
  /** The family as Google Fonts and Fontsource name it, and as the stacks quote it. */
  family: string;
  /** The `next/font/google` export. */
  import: string;
  /** Weights to load; none for a variable face. */
  weight?: string[];
  /** The `next/font` subsets (only those it lists for the family). */
  subsets: string[];
  /** The Fontsource package Vite installs instead of `next/font`. */
  dependency: string;
  /** A sentence for the item's description: what the face is for. */
  description: string;
  /**
   * The static item that installs a default face (`registry/theme/registry.json`). The theme
   * keeps depending on it, so a code with the default faces installs exactly what `theme.json`
   * installs.
   */
  staticItem?: string;
}

/** The display faces, in slot order (`DISPLAY_FONT_SLOTS`). */
export const DISPLAY_FACES: Record<DisplayFont, FontFace> = {
  "dela-gothic-one": {
    family: "Dela Gothic One",
    import: "Dela_Gothic_One",
    weight: ["400"],
    subsets: ["latin", "latin-ext"],
    dependency: "@fontsource/dela-gothic-one",
    description: "Ultra-bold gothic display face for SFX and headings, exposed as --font-display.",
    staticItem: "font-display",
  },
  "reggae-one": {
    family: "Reggae One",
    import: "Reggae_One",
    weight: ["400"],
    subsets: ["latin", "latin-ext"],
    dependency: "@fontsource/reggae-one",
    description:
      "Brush-energy display face from Japanese boys' magazines for SFX and headings, exposed as --font-display.",
  },
};

/** The dialogue faces, in slot order (`DIALOGUE_FONT_SLOTS`). */
export const DIALOGUE_FACES: Record<DialogueFont, FontFace> = {
  "shantell-sans": {
    family: "Shantell Sans",
    import: "Shantell_Sans",
    subsets: ["latin", "latin-ext"],
    dependency: "@fontsource/shantell-sans",
    description:
      "Hand-drawn variable sans for speech bubbles and dialogue, exposed as --font-dialogue-latin.",
    staticItem: "font-dialogue",
  },
  "patrick-hand-sc": {
    family: "Patrick Hand SC",
    import: "Patrick_Hand_SC",
    weight: ["400"],
    subsets: ["latin", "latin-ext"],
    dependency: "@fontsource/patrick-hand-sc",
    description:
      "Small-caps hand lettering, close to all-caps manga lettering, for speech bubbles and dialogue, exposed as --font-dialogue-latin.",
  },
};

/** Each role's faces, in slot order. */
export const FACES: {
  display: Record<DisplayFont, FontFace>;
  dialogue: Record<DialogueFont, FontFace>;
} = { display: DISPLAY_FACES, dialogue: DIALOGUE_FACES };

/** The face `id` of `role`, or undefined when the role has no such face. */
export function fontFace(role: string, id: string): FontFace | undefined {
  if (!(FONT_ROLES as readonly string[]).includes(role)) return undefined;
  const faces = FACES[role as FontRole] as Record<string, FontFace>;
  return Object.hasOwn(faces, id) ? faces[id] : undefined;
}

/** A face's family name, as the rail lists it. */
export const FONT_LABELS: Record<FontId, string> = Object.fromEntries(
  [...Object.entries(DISPLAY_FACES), ...Object.entries(DIALOGUE_FACES)].map(([id, face]) => [
    id,
    face.family,
  ]),
) as Record<FontId, string>;

/** The role's families as a stack: the chosen face first, then the others in slot order. */
export function familyStack(role: FontRole, chosen: FontId): string[] {
  const faces = FACES[role] as Record<string, FontFace>;
  const ids = [chosen, ...Object.keys(faces).filter((id) => id !== chosen)];
  return ids.map((id) => `"${faces[id].family}"`);
}
