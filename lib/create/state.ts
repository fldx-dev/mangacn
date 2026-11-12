/**
 * The Create page's state: one `CreateConfig` changed through a reducer. Every action lands on
 * a configuration `encode` accepts (values snapped to their range's steps, the screentone's dot
 * clamped to its pitch), so the page can always write a code. A shuffle, a pasted code and a
 * code in the URL go through here too. No Node imports: the page runs this in the browser.
 */

import { decode, encode } from "./code";
import {
  type CreateConfig,
  type CustomLook,
  DEFAULT_CONFIG,
  DIALOGUE_FONTS,
  DISPLAY_FONTS,
  type DialogueFont,
  type DisplayFont,
  HUE_RANGE,
  KIT_NAMES,
  type KitName,
  LOOK_PRESETS,
  type LookPreset,
  PEN_NAMES,
  PEN_RANGES,
  PEN_TOKENS,
  PENS,
  type PenName,
  type PenToken,
  type Range,
  rangeSize,
  rangeValue,
  SCREENTONE_RANGES,
  SCREENTONE_TOKENS,
  type Screentone,
  type ScreentoneToken,
  STRENGTH_RANGE,
  screentoneProblem,
  VIVIDNESS_RANGE,
} from "./config";

export type CustomPart = keyof CustomLook;

export type CreateAction =
  | { type: "look-preset"; preset: LookPreset }
  /** Switches to a custom look, starting from the current preset's nearest custom values. */
  | { type: "look-custom" }
  | { type: "look-value"; part: "paper" | "ink"; key: "hue" | "strength"; value: number }
  | { type: "look-value"; part: "spot"; key: "hue" | "vividness"; value: number }
  | { type: "pen-name"; name: PenName }
  | { type: "pen-value"; token: PenToken; value: number }
  | { type: "screentone"; token: ScreentoneToken; value: number }
  | { type: "display-font"; font: DisplayFont }
  | { type: "dialogue-font"; font: DialogueFont }
  | { type: "kit"; kit: KitName }
  /** A configuration from a decoded code (the URL, a pasted code, a shuffle). */
  | { type: "replace"; config: CreateConfig }
  | { type: "reset" };

/** The nearest value on a range's steps, inside it. */
export function snap(range: Range, value: number): number {
  if (!Number.isFinite(value)) return range.min;
  const i = Math.round((value - range.min) / range.step);
  return rangeValue(range, Math.min(rangeSize(range) - 1, Math.max(0, i)));
}

/**
 * The largest dot on its steps that fits a pitch by `screentoneProblem`'s own rule
 * (`dot + 0.5 ≤ size / 2`, compared in rounded tenths), so the slider and the code agree.
 */
export function maxDot(size: number): number {
  const range = SCREENTONE_RANGES["halftone-dot"];
  for (let i = rangeSize(range) - 1; i > 0; i--) {
    const dot = rangeValue(range, i);
    const tone = { "halftone-size": size, "halftone-dot": dot, "speed-line-width": 2 };
    if (screentoneProblem(tone) === null) return dot;
  }
  return range.min;
}

/**
 * A screentone with `token` set to `value` (snapped), the dot clamped to what its pitch allows:
 * a larger dot stops at the limit, a smaller pitch pulls the dot down with it.
 */
export function withScreentone(
  tone: Screentone,
  token: ScreentoneToken,
  value: number,
): Screentone {
  const next = { ...tone, [token]: snap(SCREENTONE_RANGES[token], value) };
  next["halftone-dot"] = Math.min(next["halftone-dot"], maxDot(next["halftone-size"]));
  return next;
}

/**
 * Where "Custom" starts from each shipped look: the paper, ink and spot settings nearest that
 * look's own colours (chroma ÷ 0.0035 for a strength, (chroma − 0.06) ÷ 0.02 for vividness).
 */
export const CUSTOM_STARTS: Record<LookPreset, CustomLook> = {
  default: {
    paper: { hue: 85, strength: 2 },
    ink: { hue: 60, strength: 1 },
    spot: { hue: 27, vividness: 8 },
  },
  sepia: {
    paper: { hue: 84, strength: 9 },
    ink: { hue: 50, strength: 6 },
    spot: { hue: 37, vividness: 6 },
  },
  weekly: {
    paper: { hue: 135, strength: 6 },
    ink: { hue: 150, strength: 3 },
    spot: { hue: 350, vividness: 8 },
  },
  blueline: {
    paper: { hue: 230, strength: 2 },
    ink: { hue: 260, strength: 10 },
    spot: { hue: 228, vividness: 2 },
  },
};

function lookValue(
  look: CustomLook,
  part: CustomPart,
  key: "hue" | "strength" | "vividness",
  value: number,
): CustomLook {
  const range = key === "hue" ? HUE_RANGE : key === "strength" ? STRENGTH_RANGE : VIVIDNESS_RANGE;
  if (part === "spot" && key === "strength") return look;
  if (part !== "spot" && key === "vividness") return look;
  return { ...look, [part]: { ...look[part], [key]: snap(range, value) } };
}

export function createReducer(config: CreateConfig, action: CreateAction): CreateConfig {
  switch (action.type) {
    case "look-preset":
      return { ...config, look: { preset: action.preset } };
    case "look-custom":
      return "custom" in config.look
        ? config
        : { ...config, look: { custom: structuredClone(CUSTOM_STARTS[config.look.preset]) } };
    case "look-value": {
      const base = "custom" in config.look ? config.look.custom : CUSTOM_STARTS[config.look.preset];
      return {
        ...config,
        look: { custom: lookValue(base, action.part, action.key, action.value) },
      };
    }
    case "pen-name":
      return { ...config, pen: { ...PENS[action.name] } };
    case "pen-value":
      return {
        ...config,
        pen: { ...config.pen, [action.token]: snap(PEN_RANGES[action.token], action.value) },
      };
    case "screentone":
      return {
        ...config,
        screentone: withScreentone(config.screentone, action.token, action.value),
      };
    case "display-font":
      return { ...config, fonts: { ...config.fonts, display: action.font } };
    case "dialogue-font":
      return { ...config, fonts: { ...config.fonts, dialogue: action.font } };
    case "kit":
      return { ...config, kit: { preset: action.kit } };
    case "replace":
      return action.config;
    case "reset":
      return DEFAULT_CONFIG;
  }
}

// ── Shuffle ─────────────────────────────────────────────────────────────────────────────────

type Random = () => number;

const pick = <T>(list: readonly T[], random: Random): T =>
  list[Math.min(list.length - 1, Math.floor(random() * list.length))];
const anyValue = (range: Range, random: Random) =>
  rangeValue(range, Math.min(rangeSize(range) - 1, Math.floor(random() * rangeSize(range))));

/**
 * A random configuration `decode` accepts: half the time a shipped look, else a custom one;
 * mostly a named pen (a hand-tuned pen reads better than six random numbers); a screentone
 * whose dot fits its pitch; any fonts and kit.
 */
export function shuffleConfig(random: Random = Math.random): CreateConfig {
  const look: CreateConfig["look"] =
    random() < 0.5
      ? { preset: pick(LOOK_PRESETS, random) }
      : {
          custom: {
            paper: {
              hue: anyValue(HUE_RANGE, random),
              strength: anyValue(STRENGTH_RANGE, random),
            },
            ink: { hue: anyValue(HUE_RANGE, random), strength: anyValue(STRENGTH_RANGE, random) },
            spot: {
              hue: anyValue(HUE_RANGE, random),
              vividness: anyValue(VIVIDNESS_RANGE, random),
            },
          },
        };
  const pen =
    random() < 0.75
      ? { ...PENS[pick(PEN_NAMES, random)] }
      : (Object.fromEntries(
          PEN_TOKENS.map((token) => [token, anyValue(PEN_RANGES[token], random)]),
        ) as CreateConfig["pen"]);
  let screentone = { ...DEFAULT_CONFIG.screentone };
  for (const token of SCREENTONE_TOKENS) {
    screentone = withScreentone(screentone, token, anyValue(SCREENTONE_RANGES[token], random));
  }
  return {
    look,
    pen,
    screentone,
    fonts: { display: pick(DISPLAY_FONTS, random), dialogue: pick(DIALOGUE_FONTS, random) },
    kit: { preset: pick(KIT_NAMES, random) },
  };
}

// ── Codes from the URL or a paste ───────────────────────────────────────────────────────────

/** The query parameter that carries the code: `/create?c=<code>`. */
export const CODE_PARAM = "c";

/**
 * The code in what a visitor pasted: a bare code, or a Create URL (absolute or a path) whose
 * `?c=` holds it. Never throws; returns the trimmed text when it is not a URL.
 */
export function codeFromInput(input: string): string {
  const text = input.trim();
  if (!/[/?=]/.test(text)) return text;
  try {
    const url = new URL(text, "https://www.mangacn.com");
    return url.searchParams.get(CODE_PARAM)?.trim() ?? "";
  } catch {
    return text;
  }
}

/** A pasted code or URL, decoded: the configuration, or why it was refused. */
export function readPastedCode(
  input: string,
): { ok: true; config: CreateConfig; code: string } | { ok: false; reason: string } {
  const code = codeFromInput(input);
  if (code === "") return { ok: false, reason: "there is no code in what was pasted" };
  const result = decode(code);
  return result.ok ? { ok: true, config: result.config, code: encode(result.config) } : result;
}

/** The page's URL for a code: the current path and other parameters, `?c=` set to the code. */
export function urlWithCode(href: string, code: string): string {
  const url = new URL(href);
  url.searchParams.set(CODE_PARAM, code);
  return `${url.pathname}${url.search}${url.hash}`;
}
