import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadRegistry } from "@/lib/registry";
import type { ThemeCssSource } from "@/lib/registry/theme-css";
import { type DefaultTheme, presetItem, readPresetValues } from "@/lib/registry/theme-preset-items";

type Oklch = [l: number, c: number, h: number];
type Mode = "light" | "dark";

function parseOklch(value: string): Oklch {
  const match = /^oklch\(([\d.]+) ([\d.]+) ([\d.]+)\)$/.exec(value);
  if (!match) throw new Error(`Not a plain oklch() value: ${value}`);
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

/** oklch → linear sRGB → WCAG 2.x relative luminance (same maths as theme-preview.html). */
function luminance([L, C, h]: Oklch): number {
  const a = C * Math.cos((h * Math.PI) / 180);
  const b = C * Math.sin((h * Math.PI) / 180);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const clamp = (v: number) => Math.min(1, Math.max(0, v));
  const red = clamp(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s);
  const green = clamp(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s);
  const blue = clamp(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s);
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrast(fg: Oklch, bg: Oklch, alpha = 1): number {
  const a = (alpha === 1 ? luminance(fg) : blendedLuminance(fg, bg, alpha)) + 0.05;
  const b = luminance(bg) + 0.05;
  return a > b ? a / b : b / a;
}

/** oklch → gamma-encoded sRGB, each channel clamped to 0–1. */
function srgb([L, C, h]: Oklch): number[] {
  const a = C * Math.cos((h * Math.PI) / 180);
  const b = C * Math.sin((h * Math.PI) / 180);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map((v) => {
    const linear = Math.min(1, Math.max(0, v));
    return linear <= 0.0031308 ? 12.92 * linear : 1.055 * linear ** (1 / 2.4) - 0.055;
  });
}

/**
 * The luminance of `fg` at `alpha` over `bg`, blended in gamma-encoded sRGB as the browser
 * composites `text-foreground/60`, then measured the WCAG way.
 */
function blendedLuminance(fg: Oklch, bg: Oklch, alpha: number): number {
  const back = srgb(bg);
  const [r, g, b] = srgb(fg).map((v, i) => {
    const mixed = alpha * v + (1 - alpha) * back[i];
    return mixed <= 0.04045 ? mixed / 12.92 : ((mixed + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const registry = loadRegistry();

// The default theme and every preset (Task 99): each is held to the same targets in both modes.
const themes = registry.items.filter(
  (item) => item.type === "registry:theme",
) as (ThemeCssSource & {
  name: string;
})[];

// SPEC-manga-theme §9: [label, foreground token, background token, minimum, modes, alpha]
const PAIRS: [string, string, string, number, Mode[], number?][] = [
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
function resolve(vars: Record<string, string>, name: string): Oklch {
  let value = vars[name];
  for (let hops = 0; value?.startsWith("var(--"); hops++) {
    if (hops > 4) throw new Error(`--${name} does not resolve to a colour`);
    value = vars[value.slice("var(--".length, -")".length)];
  }
  if (value === undefined) throw new Error(`No --${name}`);
  return parseOklch(value);
}

/** Every pair a theme item misses, as `label (mode): ratio < minimum`. */
function contrastFailures(theme: ThemeCssSource): string[] {
  return PAIRS.flatMap(([label, fg, bg, min, modes, alpha]) =>
    modes.flatMap((mode) => {
      const vars = theme.cssVars?.[mode] ?? {};
      const ratio = contrast(resolve(vars, fg), resolve(vars, bg), alpha);
      return ratio >= min ? [] : [`${label} (${mode}): ${ratio.toFixed(2)} < ${min}`];
    }),
  );
}

const cases = themes.flatMap((theme) =>
  PAIRS.flatMap(([label, fg, bg, min, modes, alpha]) =>
    modes.map((mode) => ({
      theme: theme.name,
      cssVars: theme.cssVars,
      label,
      mode,
      fg,
      bg,
      min,
      alpha,
    })),
  ),
);

describe("§9 contrast targets", () => {
  it("covers the default theme and at least one preset", () => {
    expect(themes.map((theme) => theme.name)).toContain("theme");
    expect(themes.map((theme) => theme.name)).toContain("theme-sepia");
  });

  it.each(cases)("$theme: $label ($mode) ≥ $min:1", ({ cssVars, mode, fg, bg, min, alpha }) => {
    const vars = cssVars?.[mode] ?? {};
    const ratio = contrast(resolve(vars, fg), resolve(vars, bg), alpha);
    expect(ratio).toBeGreaterThanOrEqual(min);
  });

  it("fails a preset whose ink is too light (fixture, not shipped)", () => {
    const fixture = readPresetValues(
      path.resolve("registry/theme/__fixtures__/presets/too-light-ink.json"),
    );
    const theme = themes.find((item) => item.name === "theme") as unknown as DefaultTheme;
    const failures = contrastFailures(presetItem(theme, fixture));
    expect(failures).toContainEqual(
      expect.stringMatching(/^ink on paper \(light\): \d\.\d\d < 7$/),
    );
    // Dark mode is sepia's own, so nothing there fails.
    expect(failures.filter((failure) => failure.includes("(dark)"))).toEqual([]);
    expect(themes.map((item) => item.name)).not.toContain("theme-too-light-ink");
  });

  it("resolves token references and rejects a dangling one", () => {
    expect(resolve({ a: "var(--b)", b: "oklch(1 0 0)" }, "a")).toEqual([1, 0, 0]);
    expect(() => resolve({ a: "var(--missing)" }, "a")).toThrow("No --a");
  });

  it("matches the preview's maths on a known pair", () => {
    expect(contrast([0, 0, 0], [1, 0, 0])).toBeCloseTo(21, 1);
    // Black at 60 % on white composites to sRGB 0.4 (#666), 5.74:1, as the browser paints it.
    expect(contrast([0, 0, 0], [1, 0, 0], 0.6)).toBeCloseTo(5.74, 1);
    expect(() => parseOklch("var(--paper)")).toThrow("Not a plain oklch()");
  });
});
