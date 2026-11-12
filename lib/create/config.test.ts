import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadRegistry } from "@/lib/registry";
import { configProblem } from "./code";
import {
  DEFAULT_CONFIG,
  DIALOGUE_FONT_SLOTS,
  DIALOGUE_FONTS,
  DISPLAY_FONT_SLOTS,
  DISPLAY_FONTS,
  FONT_SLOTS,
  PEN_NAMES,
  PEN_RANGES,
  PEN_TOKENS,
  PENS,
  penName,
  rangeIndex,
  rangeSize,
  rangeValue,
  SCREENTONE_RANGES,
  SCREENTONE_TOKENS,
  screentoneProblem,
} from "./config";

const theme = loadRegistry().items.find((item) => item.name === "theme") as unknown as {
  cssVars: { theme: Record<string, string> };
};
const themeNumber = (token: string) => Number.parseFloat(theme.cssVars.theme[token]);

describe("the default configuration", () => {
  it("is the default theme's pen and screentone, its fonts, and the Installation page's kit", () => {
    for (const token of PEN_TOKENS)
      expect(DEFAULT_CONFIG.pen[token], token).toBe(themeNumber(token));
    for (const token of SCREENTONE_TOKENS) {
      expect(DEFAULT_CONFIG.screentone[token], token).toBe(themeNumber(token));
    }
    expect(DEFAULT_CONFIG.look).toEqual({ preset: "default" });
    expect(DEFAULT_CONFIG.fonts).toEqual({ display: "dela-gothic-one", dialogue: "shantell-sans" });
    expect(theme.cssVars.theme["font-display"]).toContain('"Dela Gothic One"');
    expect(theme.cssVars.theme["font-dialogue"]).toContain('"Shantell Sans"');
    expect(DEFAULT_CONFIG.kit).toEqual({ preset: "basics" });
    expect(configProblem(DEFAULT_CONFIG)).toBeNull();
  });
});

describe("ranges", () => {
  it("are the Theming playground's for the pen", () => {
    const source = readFileSync(path.resolve("components/docs/theme-playground.tsx"), "utf8");
    for (const token of PEN_TOKENS) {
      const { min, max, step } = PEN_RANGES[token];
      const entry = new RegExp(
        `name: "--${token}",[\\s\\S]*?min: ${min},\\s*max: ${max},\\s*step: ${step},`,
      );
      expect(source, token).toMatch(entry);
    }
  });

  it("hold every default value on a step", () => {
    for (const token of PEN_TOKENS) {
      expect(rangeIndex(PEN_RANGES[token], DEFAULT_CONFIG.pen[token])).toBeGreaterThanOrEqual(0);
    }
    for (const token of SCREENTONE_TOKENS) {
      const range = SCREENTONE_RANGES[token];
      expect(rangeIndex(range, DEFAULT_CONFIG.screentone[token])).toBeGreaterThanOrEqual(0);
    }
  });

  it("index and value each other without float noise", () => {
    const range = PEN_RANGES["outline-width"];
    expect(rangeSize(range)).toBe(36);
    expect(rangeValue(range, 2)).toBe(0.7);
    expect(rangeIndex(range, 0.7)).toBe(2);
    for (const off of [0.75, 0.4, 4.1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(rangeIndex(range, off)).toBe(-1);
    }
  });

  it("keep the dot inside its pitch", () => {
    expect(screentoneProblem(DEFAULT_CONFIG.screentone)).toBeNull();
    expect(
      screentoneProblem({ "halftone-size": 3, "halftone-dot": 1, "speed-line-width": 2 }),
    ).toBeNull();
    expect(
      screentoneProblem({ "halftone-size": 3, "halftone-dot": 1.1, "speed-line-width": 2 }),
    ).toMatch(/too large for a 3px pitch \(at most 1px\)/);
    // The largest dot fits the largest pitch.
    const size = SCREENTONE_RANGES["halftone-size"].max;
    const dot = SCREENTONE_RANGES["halftone-dot"].max;
    expect(
      screentoneProblem({ "halftone-size": size, "halftone-dot": dot, "speed-line-width": 2 }),
    ).toBeNull();
  });
});

describe("named pens", () => {
  it("sit on the ranges' steps, and default is the theme's pen", () => {
    for (const name of PEN_NAMES) {
      for (const token of PEN_TOKENS) {
        expect(
          rangeIndex(PEN_RANGES[token], PENS[name][token]),
          `${name} ${token}`,
        ).toBeGreaterThanOrEqual(0);
      }
      expect(penName(PENS[name])).toBe(name);
    }
    expect(PENS.default).toEqual(DEFAULT_CONFIG.pen);
    expect(penName({ ...PENS.default, "ink-offset": 0 })).toBeNull();
  });

  it("go from fine to brush: thinner and steadier, then heavier and looser", () => {
    for (const token of PEN_TOKENS) {
      expect(PENS.fine[token], token).toBeLessThan(PENS.default[token]);
      expect(PENS.brush[token], token).toBeGreaterThan(PENS.default[token]);
    }
    // Still a 1.5px-class line, and the heavy outline stays heavier than the regular one.
    expect(PENS.fine["outline-width"]).toBeGreaterThanOrEqual(1);
    for (const name of PEN_NAMES) {
      expect(PENS[name]["outline-width-heavy"]).toBeGreaterThan(PENS[name]["outline-width"]);
    }
  });
});

describe("fonts", () => {
  it("have eight slots per role, two in use and two reserved", () => {
    for (const slots of [DISPLAY_FONT_SLOTS, DIALOGUE_FONT_SLOTS]) {
      expect(slots).toHaveLength(FONT_SLOTS);
      expect(slots.slice(2)).toEqual([null, null, null, null, null, null]);
    }
    expect(DISPLAY_FONTS).toEqual(["dela-gothic-one", "reggae-one"]);
    expect(DIALOGUE_FONTS).toEqual(["shantell-sans", "patrick-hand-sc"]);
  });
});
