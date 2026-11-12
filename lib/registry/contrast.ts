/**
 * The contrast maths and the pairs every look is held to (SPEC-manga-theme §9), shared by
 * `registry/theme/contrast.test.ts` (the default theme and the presets) and the Create module
 * (`lib/create/colours.ts` solves its spot against these pairs, and its property test checks
 * every derived look with them). No Node imports: the Create page runs it in the browser.
 */

export type Oklch = [l: number, c: number, h: number];
export type Mode = "light" | "dark";

/** [label, foreground token, background token, minimum, modes, alpha] */
export type ContrastPair = [
  label: string,
  fg: string,
  bg: string,
  min: number,
  modes: Mode[],
  alpha?: number,
];

const PLAIN_OKLCH = /^oklch\(([\d.]+) ([\d.]+) ([\d.]+)\)$/;

export function parseOklch(value: string): Oklch {
  const match = PLAIN_OKLCH.exec(value);
  if (!match) throw new Error(`Not a plain oklch() value: ${value}`);
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

/** oklch → linear sRGB, unclamped (a channel outside 0–1 is out of gamut). */
export function linearSrgb([L, C, h]: Oklch): [r: number, g: number, b: number] {
  const a = C * Math.cos((h * Math.PI) / 180);
  const b = C * Math.sin((h * Math.PI) / 180);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

/** Whether a colour is inside the sRGB gamut, every linear channel in 0–1. */
export function inGamut(colour: Oklch): boolean {
  return linearSrgb(colour).every((v) => v >= 0 && v <= 1);
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** oklch → linear sRGB → WCAG 2.x relative luminance (same maths as theme-preview.html). */
export function luminance(colour: Oklch): number {
  const [red, green, blue] = linearSrgb(colour).map(clamp01);
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

/** oklch → gamma-encoded sRGB, each channel clamped to 0–1. */
export function srgb(colour: Oklch): number[] {
  return linearSrgb(colour).map((v) => {
    const linear = clamp01(v);
    return linear <= 0.0031308 ? 12.92 * linear : 1.055 * linear ** (1 / 2.4) - 0.055;
  });
}

/**
 * The luminance of `fg` at `alpha` over `bg`, blended in gamma-encoded sRGB as the browser
 * composites `text-foreground/60`, then measured the WCAG way.
 */
export function blendedLuminance(fg: Oklch, bg: Oklch, alpha: number): number {
  const back = srgb(bg);
  const [r, g, b] = srgb(fg).map((v, i) => {
    const mixed = alpha * v + (1 - alpha) * back[i];
    return mixed <= 0.04045 ? mixed / 12.92 : ((mixed + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(fg: Oklch, bg: Oklch, alpha = 1): number {
  const a = (alpha === 1 ? luminance(fg) : blendedLuminance(fg, bg, alpha)) + 0.05;
  const b = luminance(bg) + 0.05;
  return a > b ? a / b : b / a;
}

// SPEC-manga-theme §9: [label, foreground token, background token, minimum, modes, alpha]
export const PAIRS: readonly ContrastPair[] = [
  ["ink on paper", "ink", "paper", 7, ["light", "dark"]],
  ["spot on paper (text)", "spot", "paper", 4.5, ["light"]],
  ["spot-foreground on spot", "spot-foreground", "spot", 4.5, ["light", "dark"]],
  ["tone-3 on paper (secondary text)", "tone-3", "paper", 4.5, ["light", "dark"]],
  ["spot focus ring next to paper", "spot", "paper", 3, ["light", "dark"]],
  // Task 68 (SPEC-components-3 §13 Q3): muted text sits on the muted fill (inactive tabs,
  // skeleton rows) as well as on paper; tone-3 was about 4:1 on tone-1.
  ["muted-foreground on muted", "muted-foreground", "muted", 4.5, ["light", "dark"]],
  ["muted-foreground on paper", "muted-foreground", "paper", 4.5, ["light", "dark"]],
  // Task 99: inactive tabs are `text-foreground/60`, ink at 60 % over the muted fill or paper.
  // The default's near-black ink clears it; sepia's first brown-black ink measured 4.15:1.
  ["ink at 60 % on muted (inactive tab)", "foreground", "muted", 4.5, ["light", "dark"], 0.6],
  ["ink at 60 % on paper (inactive tab)", "foreground", "paper", 4.5, ["light", "dark"], 0.6],
];

/** A token's oklch value, following `var(--name)` references within the same mode. */
export function resolve(vars: Record<string, string>, name: string): Oklch {
  let value = vars[name];
  for (let hops = 0; value?.startsWith("var(--"); hops++) {
    if (hops > 4) throw new Error(`--${name} does not resolve to a colour`);
    value = vars[value.slice("var(--".length, -")".length)];
  }
  if (value === undefined) throw new Error(`No --${name}`);
  return parseOklch(value);
}

/** Every pair a theme misses, as `label (mode): ratio < minimum`. */
export function contrastFailures(cssVars: Partial<Record<Mode, Record<string, string>>>): string[] {
  return PAIRS.flatMap(([label, fg, bg, min, modes, alpha]) =>
    modes.flatMap((mode) => {
      const vars = cssVars[mode] ?? {};
      const ratio = contrast(resolve(vars, fg), resolve(vars, bg), alpha);
      return ratio >= min ? [] : [`${label} (${mode}): ${ratio.toFixed(2)} < ${min}`];
    }),
  );
}
