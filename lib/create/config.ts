/**
 * The Create page's configuration (`/create`): a look, a pen, screentone, fonts and a starter
 * kit. Every field is a number on a fixed step or a name from a fixed list, so a configuration
 * always describes a valid mangacn theme and survives the short code in the URL
 * (`./code.ts`) unchanged. No Node imports: the page runs this in the browser.
 *
 * The ranges below are part of code version 1 (`./code.ts`): changing a minimum, a maximum, a
 * step or the order of a list changes what a published code means. Add a new code version
 * instead.
 */

import { KIT_NAMES, type KitName } from "./kits";

/** A slider's range: values are `min + i * step` for whole `i`, up to `max`. */
export interface Range {
  min: number;
  max: number;
  step: number;
  /** CSS unit appended when the value is written as a variable (`px`, or none). */
  unit: "" | "px";
}

/** The number of values a range holds. */
export function rangeSize(range: Range): number {
  return Math.round((range.max - range.min) / range.step) + 1;
}

/** The value at index `i` of a range, rounded to the step's decimals (no 0.30000000000000004). */
export function rangeValue(range: Range, i: number): number {
  const decimals = (String(range.step).split(".")[1] ?? "").length;
  return Number((range.min + i * range.step).toFixed(decimals));
}

/** The index of a value in a range, or -1 when it is outside it or between two steps. */
export function rangeIndex(range: Range, value: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return -1;
  const i = Math.round((value - range.min) / range.step);
  if (i < 0 || i >= rangeSize(range)) return -1;
  return rangeValue(range, i) === value ? i : -1;
}

// ── Look ────────────────────────────────────────────────────────────────────────────────────

/** The shipped looks, in code order: the default theme and the presets (`THEME_LOOKS`). */
export const LOOK_PRESETS = ["default", "sepia", "weekly", "blueline"] as const;
export type LookPreset = (typeof LOOK_PRESETS)[number];

/** A hue in degrees, whole. */
export const HUE_RANGE: Range = { min: 0, max: 359, step: 1, unit: "" };
/** Paper or ink strength: 0 is white paper or neutral black, 10 the most tint a look allows. */
export const STRENGTH_RANGE: Range = { min: 0, max: 10, step: 1, unit: "" };
/** Spot vividness: 0 is a muted spot, 10 as vivid as the gamut allows at its lightness. */
export const VIVIDNESS_RANGE: Range = { min: 0, max: 10, step: 1, unit: "" };

export interface CustomLook {
  paper: { hue: number; strength: number };
  ink: { hue: number; strength: number };
  spot: { hue: number; vividness: number };
}

export type Look = { preset: LookPreset } | { custom: CustomLook };

// ── Pen ─────────────────────────────────────────────────────────────────────────────────────

/** The pen's theme variables, in code order. */
export const PEN_TOKENS = [
  "outline-width",
  "outline-width-heavy",
  "ink-roughness",
  "ink-bowing",
  "ink-offset",
  "ink-hachure-gap",
] as const;
export type PenToken = (typeof PEN_TOKENS)[number];
export type Pen = Record<PenToken, number>;

/** The ranges and steps of the Theming page's playground (`components/docs/theme-playground.tsx`). */
export const PEN_RANGES: Record<PenToken, Range> = {
  "outline-width": { min: 0.5, max: 4, step: 0.1, unit: "px" },
  "outline-width-heavy": { min: 0.5, max: 6, step: 0.1, unit: "px" },
  "ink-roughness": { min: 0, max: 3, step: 0.1, unit: "" },
  "ink-bowing": { min: 0, max: 3, step: 0.1, unit: "" },
  "ink-offset": { min: 0, max: 4, step: 0.1, unit: "" },
  "ink-hachure-gap": { min: 2, max: 10, step: 0.5, unit: "px" },
};

/** Named pens, in code order. Each sets all six values together. */
export const PEN_NAMES = ["fine", "default", "brush"] as const;
export type PenName = (typeof PEN_NAMES)[number];

export const PENS: Record<PenName, Pen> = {
  // Thinner and steadier: a technical pen. Still reads at small sizes (a checkbox, a badge).
  fine: {
    "outline-width": 1.2,
    "outline-width-heavy": 1.7,
    "ink-roughness": 0.6,
    "ink-bowing": 0.4,
    "ink-offset": 0.8,
    "ink-hachure-gap": 3.5,
  },
  // The theme's own values (`registry/theme/registry.json`).
  default: {
    "outline-width": 1.5,
    "outline-width-heavy": 2.1,
    "ink-roughness": 1.2,
    "ink-bowing": 0.8,
    "ink-offset": 1.5,
    "ink-hachure-gap": 4,
  },
  // Heavier and looser: a brush pen. Wobbles more but keeps the line closed.
  brush: {
    "outline-width": 2,
    "outline-width-heavy": 2.8,
    "ink-roughness": 1.8,
    "ink-bowing": 1.4,
    "ink-offset": 2.2,
    "ink-hachure-gap": 5,
  },
};

/** The named pen whose six values equal `pen`, or null. */
export function penName(pen: Pen): PenName | null {
  return PEN_NAMES.find((name) => PEN_TOKENS.every((t) => PENS[name][t] === pen[t])) ?? null;
}

// ── Screentone ──────────────────────────────────────────────────────────────────────────────

export const SCREENTONE_TOKENS = ["halftone-size", "halftone-dot", "speed-line-width"] as const;
export type ScreentoneToken = (typeof SCREENTONE_TOKENS)[number];
export type Screentone = Record<ScreentoneToken, number>;

/**
 * Around the theme's 4px pitch, 1.2px dot and 2px speed line. The dot is a radius with a 0.5px
 * soft edge (`radial-gradient(circle, … var(--halftone-dot), transparent calc(… + 0.5px))`),
 * so a dot stays a dot, apart from its neighbours, while `dot + 0.5 ≤ size / 2`
 * (`screentoneProblem`).
 */
export const SCREENTONE_RANGES: Record<ScreentoneToken, Range> = {
  "halftone-size": { min: 3, max: 8, step: 0.5, unit: "px" },
  "halftone-dot": { min: 0.5, max: 3.5, step: 0.1, unit: "px" },
  "speed-line-width": { min: 1, max: 4, step: 0.5, unit: "px" },
};

/** Why a dot and pitch do not make a screentone, or null when they do. */
export function screentoneProblem(tone: Screentone): string | null {
  const dot = tone["halftone-dot"];
  const size = tone["halftone-size"];
  // Compared in tenths, so 1.5 + 0.5 = 2 is exact.
  return Math.round((dot + 0.5) * 10) <= Math.round((size / 2) * 10)
    ? null
    : `halftone-dot ${dot}px is too large for a ${size}px pitch (at most ${size / 2 - 0.5}px)`;
}

// ── Fonts ───────────────────────────────────────────────────────────────────────────────────

/** A code carries up to eight fonts per role: slots 0–7, an index into these lists. */
export const FONT_SLOTS = 8;

/**
 * The display faces, by slot. Slots 2 and 3 are reserved for two faces another task chooses
 * from Google Fonts (Latin and Japanese coverage); slots 4–7 are free. A null slot is not yet a
 * font: a code naming it is rejected. Filling a slot never changes what an older code means,
 * since no code could name it before.
 */
export const DISPLAY_FONT_SLOTS = [
  "dela-gothic-one",
  "reggae-one",
  null, // reserved: display face 3
  null, // reserved: display face 4
  null,
  null,
  null,
  null,
] as const;

/** The dialogue faces, by slot. Slots 2 and 3 are reserved (Latin coverage); 4–7 are free. */
export const DIALOGUE_FONT_SLOTS = [
  "shantell-sans",
  "patrick-hand-sc",
  null, // reserved: dialogue face 3
  null, // reserved: dialogue face 4
  null,
  null,
  null,
  null,
] as const;

export type DisplayFont = NonNullable<(typeof DISPLAY_FONT_SLOTS)[number]>;
export type DialogueFont = NonNullable<(typeof DIALOGUE_FONT_SLOTS)[number]>;

/** The fonts a visitor can pick today, in slot order. */
export const DISPLAY_FONTS = DISPLAY_FONT_SLOTS.filter((id): id is DisplayFont => id !== null);
export const DIALOGUE_FONTS = DIALOGUE_FONT_SLOTS.filter((id): id is DialogueFont => id !== null);

export interface Fonts {
  display: DisplayFont;
  dialogue: DialogueFont;
}

// ── Kit ─────────────────────────────────────────────────────────────────────────────────────

/** A named starter kit (`./kits.ts`), or a custom list of registry item names. */
export type Kit = { preset: KitName } | { custom: readonly string[] };

export { KIT_NAMES, type KitName };

// ── The configuration ───────────────────────────────────────────────────────────────────────

export interface CreateConfig {
  look: Look;
  pen: Pen;
  screentone: Screentone;
  fonts: Fonts;
  kit: Kit;
}

/** What the default theme and the Installation page install today (plus a button). */
export const DEFAULT_CONFIG: CreateConfig = {
  look: { preset: "default" },
  pen: { ...PENS.default },
  screentone: { "halftone-size": 4, "halftone-dot": 1.2, "speed-line-width": 2 },
  fonts: { display: "dela-gothic-one", dialogue: "shantell-sans" },
  kit: { preset: "basics" },
};
