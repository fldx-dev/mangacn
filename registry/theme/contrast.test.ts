import { describe, expect, it } from "vitest";
import { loadRegistry } from "@/lib/registry";
import type { ThemeCssSource } from "@/lib/registry/theme-css";

type Oklch = [l: number, c: number, h: number];

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

function contrast(fg: Oklch, bg: Oklch): number {
  const a = luminance(fg) + 0.05;
  const b = luminance(bg) + 0.05;
  return a > b ? a / b : b / a;
}

const theme = loadRegistry().items.find((item) => item.name === "theme") as ThemeCssSource;

// SPEC-manga-theme §9: [label, foreground token, background token, minimum, modes]
const PAIRS: [string, string, string, number, ("light" | "dark")[]][] = [
  ["ink on paper", "ink", "paper", 7, ["light", "dark"]],
  ["spot on paper (text)", "spot", "paper", 4.5, ["light"]],
  ["spot-foreground on spot", "spot-foreground", "spot", 4.5, ["light", "dark"]],
  ["tone-3 on paper (muted text)", "tone-3", "paper", 4.5, ["light", "dark"]],
  ["spot focus ring next to paper", "spot", "paper", 3, ["light", "dark"]],
];

const cases = PAIRS.flatMap(([label, fg, bg, min, modes]) =>
  modes.map((mode) => ({ label, mode, fg, bg, min })),
);

describe("§9 contrast targets", () => {
  it.each(cases)("$label ($mode) ≥ $min:1", ({ mode, fg, bg, min }) => {
    const vars = theme.cssVars?.[mode] ?? {};
    const ratio = contrast(parseOklch(vars[fg]), parseOklch(vars[bg]));
    expect(ratio).toBeGreaterThanOrEqual(min);
  });

  it("matches the preview's maths on a known pair", () => {
    expect(contrast([0, 0, 0], [1, 0, 0])).toBeCloseTo(21, 1);
    expect(() => parseOklch("var(--paper)")).toThrow("Not a plain oklch()");
  });
});
