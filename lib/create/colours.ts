/**
 * The 16 base colours of a look (`ink`, `paper`, `spot`, `spot-foreground`, `tone-1..4`, light
 * and dark), in the shape of `registry/theme/presets/<name>.json`'s `light` and `dark`. A shipped
 * look returns its own values file; a custom look derives them so that the preset rule and every
 * pair of `lib/registry/contrast.ts` hold by construction:
 *
 * - paper and ink sit in fixed lightness bands (`BANDS`); `strength` only sets their chroma
 *   (never above 0.035, so only the spot carries colour), clamped into the sRGB gamut;
 * - the tones step from paper to ink at the fractions the presets' tones sit at (`TONE_STEPS`),
 *   their hue and chroma blended from paper's and ink's the same way;
 * - dark mode swaps the roles: dark paper takes the ink's hue and chroma, dark ink the paper's;
 * - the spot's lightness is solved per mode against the paper it sits on, light below it, dark
 *   above it (the lift), to `SPOT_TARGET`; its chroma comes from `vividness`, clamped into the
 *   gamut at that lightness and hue;
 * - `spot-foreground` is the paper, as in every shipped look.
 *
 * No Node imports: the Create page previews with this in the browser.
 */

import { contrast, inGamut, type Mode, type Oklch } from "@/lib/registry/contrast";
import { PRESET_BASE_TOKENS } from "@/lib/registry/theme-presets";
import blueline from "@/registry/theme/presets/blueline.json";
import sepia from "@/registry/theme/presets/sepia.json";
import weekly from "@/registry/theme/presets/weekly.json";
import themeCatalog from "@/registry/theme/registry.json";
import {
  type CustomLook,
  type Look,
  type LookPreset,
  STRENGTH_RANGE,
  VIVIDNESS_RANGE,
} from "./config";

export type BaseToken = (typeof PRESET_BASE_TOKENS)[number];
export type BaseColours = Record<BaseToken, string>;
export interface BaseValues {
  light: BaseColours;
  dark: BaseColours;
}

/** Lightness bands of a custom look. Paper darkens a little as it takes more tint. */
export const BANDS = {
  light: { paper: { white: 0.985, tinted: 0.95 }, ink: 0.16 },
  dark: { paper: 0.22, ink: { white: 0.93, tinted: 0.91 } },
} as const;

/** The most chroma paper or ink (and so a tone) may carry; the preset rule allows 0.04. */
export const MAX_TINT = 0.035;

/** The spot's chroma at vividness 0 and 10, before the gamut clamp. */
export const SPOT_CHROMA = { min: 0.06, max: 0.26 } as const;

/** Where tone-1..4 sit between paper (0) and ink (1), per mode, as in the shipped looks. */
export const TONE_STEPS: Record<Mode, readonly [number, number, number, number]> = {
  light: [0.06, 0.21, 0.56, 0.68],
  dark: [0.1, 0.26, 0.58, 0.73],
};

/**
 * The ratio the spot is solved to against its paper in each mode: a little above the 4.5:1
 * that `spot on paper (text)` and `spot-foreground on spot` need, so a browser's rounding of the
 * oklch value cannot tip it under. Dark lifts further, as the presets' dark spots do.
 */
export const SPOT_TARGET: Record<Mode, number> = { light: 4.6, dark: 5.2 };

// ── Shipped looks ──────────────────────────────────────────────────────────────────────────

type CatalogItem = {
  name: string;
  cssVars?: { light?: Record<string, string>; dark?: Record<string, string> };
};

function pick(vars: Record<string, string>): BaseColours {
  return Object.fromEntries(PRESET_BASE_TOKENS.map((t) => [t, vars[t]])) as BaseColours;
}

const defaultTheme = (themeCatalog.items as CatalogItem[]).find((item) => item.name === "theme");

const SHIPPED: Record<LookPreset, BaseValues> = {
  default: {
    light: pick(defaultTheme?.cssVars?.light ?? {}),
    dark: pick(defaultTheme?.cssVars?.dark ?? {}),
  },
  sepia: { light: sepia.light, dark: sepia.dark },
  weekly: { light: weekly.light, dark: weekly.dark },
  blueline: { light: blueline.light, dark: blueline.dark },
};

// ── Colour helpers ─────────────────────────────────────────────────────────────────────────

const round = (v: number, decimals: number) => Number(v.toFixed(decimals));
const floor = (v: number, decimals: number) =>
  Math.floor(v * 10 ** decimals + 1e-9) / 10 ** decimals;

/** The most chroma `(l, h)` holds inside the sRGB gamut, to 4 decimals, rounded down. */
export function maxChroma(l: number, h: number): number {
  let lo = 0;
  let hi = 0.4;
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2;
    if (inGamut([l, mid, h])) lo = mid;
    else hi = mid;
  }
  return floor(lo, 4);
}

/** A colour with its chroma clamped into the gamut and its numbers rounded as written. */
function settle(l: number, c: number, h: number): Oklch {
  const lightness = round(l, 3);
  const hue = c > 0 ? round(((h % 360) + 360) % 360, 1) : 0;
  const chroma = Math.min(floor(c, 4), maxChroma(lightness, hue));
  return [lightness, chroma, chroma > 0 ? hue : 0];
}

export function formatOklch([l, c, h]: Oklch): string {
  return `oklch(${l} ${c} ${h})`;
}

/** The hue a fraction `t` of the way from `a` to `b`, the short way round. */
function mixHue(a: number, b: number, t: number): number {
  const delta = ((((b - a) % 360) + 540) % 360) - 180;
  return a + delta * t;
}

/** A tone `t` of the way from `from` to `to`; a neutral end takes the other end's hue. */
function mix(from: Oklch, to: Oklch, t: number): Oklch {
  const [l1, c1, h1] = from;
  const [l2, c2, h2] = to;
  const hueFrom = c1 > 0 ? h1 : h2;
  const hueTo = c2 > 0 ? h2 : h1;
  return settle(l1 + (l2 - l1) * t, c1 + (c2 - c1) * t, mixHue(hueFrom, hueTo, t));
}

/**
 * The spot for one mode: the lightness nearest the paper (light: below it, dark: above it) at
 * which it reaches `SPOT_TARGET` against the paper, with as much of `chroma` as the gamut holds
 * there. Bisection, then a walk in 0.001 steps so the rounded value still passes.
 */
function solveSpot(paper: Oklch, chroma: number, hue: number, mode: Mode): Oklch {
  const target = SPOT_TARGET[mode];
  const at = (l: number) => settle(l, Math.min(chroma, maxChroma(round(l, 3), hue)), hue);
  const passes = (l: number) => contrast(at(l), paper) >= target;
  // light: the passing side is dark (lo), the failing side near the paper (hi); dark: mirrored.
  let pass = mode === "light" ? 0.2 : 0.98;
  let fail = paper[0];
  for (let i = 0; i < 40; i++) {
    const mid = (pass + fail) / 2;
    if (passes(mid)) pass = mid;
    else fail = mid;
  }
  const step = mode === "light" ? -0.001 : 0.001;
  let l = round(pass, 3);
  while (!passes(l)) l = round(l + step, 3);
  return at(l);
}

// ── Derivation ─────────────────────────────────────────────────────────────────────────────

const unit = (value: number, max: number) => value / max;

function deriveMode(look: CustomLook, mode: Mode): BaseColours {
  const paperTint = unit(look.paper.strength, STRENGTH_RANGE.max);
  const inkTint = unit(look.ink.strength, STRENGTH_RANGE.max);
  const paperChroma = MAX_TINT * paperTint;
  const inkChroma = MAX_TINT * inkTint;

  let paper: Oklch;
  let ink: Oklch;
  if (mode === "light") {
    const { white, tinted } = BANDS.light.paper;
    paper = settle(white + (tinted - white) * paperTint, paperChroma, look.paper.hue);
    ink = settle(BANDS.light.ink, inkChroma, look.ink.hue);
  } else {
    // Roles swap: the dark page is inked paper, its text the light paper's colour.
    const { white, tinted } = BANDS.dark.ink;
    paper = settle(BANDS.dark.paper, inkChroma, look.ink.hue);
    ink = settle(white + (tinted - white) * paperTint, paperChroma, look.paper.hue);
  }

  const vivid = unit(look.spot.vividness, VIVIDNESS_RANGE.max);
  const spotChroma = SPOT_CHROMA.min + (SPOT_CHROMA.max - SPOT_CHROMA.min) * vivid;
  const spot = solveSpot(paper, spotChroma, look.spot.hue, mode);
  const tones = TONE_STEPS[mode].map((t) => mix(paper, ink, t));

  return {
    ink: formatOklch(ink),
    paper: formatOklch(paper),
    spot: formatOklch(spot),
    "spot-foreground": formatOklch(paper),
    "tone-1": formatOklch(tones[0]),
    "tone-2": formatOklch(tones[1]),
    "tone-3": formatOklch(tones[2]),
    "tone-4": formatOklch(tones[3]),
  };
}

/** The 16 base values of a look: a shipped look's own values file, or a custom look derived. */
export function baseValues(look: Look): BaseValues {
  if ("preset" in look) {
    const shipped = SHIPPED[look.preset];
    return { light: { ...shipped.light }, dark: { ...shipped.dark } };
  }
  return { light: deriveMode(look.custom, "light"), dark: deriveMode(look.custom, "dark") };
}
