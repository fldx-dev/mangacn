import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadRegistry } from "@/lib/registry";
import { contrast, inGamut, PAIRS, parseOklch, resolve } from "@/lib/registry/contrast";
import { type DefaultTheme, presetItem } from "@/lib/registry/theme-preset-items";
import { PRESET_BASE_TOKENS, THEME_PRESETS } from "@/lib/registry/theme-presets";
import { type BaseValues, baseValues } from "./colours";
import {
  type CustomLook,
  HUE_RANGE,
  LOOK_PRESETS,
  type Range,
  rangeSize,
  rangeValue,
  STRENGTH_RANGE,
  VIVIDNESS_RANGE,
} from "./config";

const theme = loadRegistry().items.find((item) => item.name === "theme") as unknown as DefaultTheme;
const PLAIN_OKLCH = /^oklch\(([\d.]+) ([\d.]+) ([\d.]+)\)$/;

/** mulberry32: a small seeded generator, so a failure names a look that can be rerun. */
function random(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SEED = 20261112;
const COUNT = 5000;

function look(values: number[]): CustomLook {
  const [ph, ps, ih, is, sh, sv] = values;
  return {
    paper: { hue: ph, strength: ps },
    ink: { hue: ih, strength: is },
    spot: { hue: sh, vividness: sv },
  };
}

const RANGES: Range[] = [
  HUE_RANGE,
  STRENGTH_RANGE,
  HUE_RANGE,
  STRENGTH_RANGE,
  HUE_RANGE,
  VIVIDNESS_RANGE,
];

function randomLooks(): CustomLook[] {
  const next = random(SEED);
  return Array.from({ length: COUNT }, () =>
    look(RANGES.map((range) => rangeValue(range, Math.floor(next() * rangeSize(range))))),
  );
}

/** Every corner of the custom look's ranges: each field at its minimum or maximum (2⁶ looks). */
function corners(): CustomLook[] {
  return Array.from({ length: 2 ** RANGES.length }, (_, bits) =>
    look(RANGES.map((range, i) => ((bits >> i) & 1 ? range.max : range.min))),
  );
}

/** What is wrong with a look's values: key set, oklch form, gamut, the one-accent rule. */
function shapeProblems(values: BaseValues): string[] {
  const problems: string[] = [];
  for (const mode of ["light", "dark"] as const) {
    const colours = values[mode];
    if (Object.keys(colours).join() !== PRESET_BASE_TOKENS.join()) {
      problems.push(`${mode}: keys ${Object.keys(colours).join()}`);
    }
    for (const [token, value] of Object.entries(colours)) {
      const match = PLAIN_OKLCH.exec(value);
      if (!match) {
        problems.push(`${mode} --${token}: ${value} is not a plain oklch()`);
        continue;
      }
      if (!inGamut(parseOklch(value))) problems.push(`${mode} --${token}: ${value} out of gamut`);
      if (token !== "spot" && Number(match[2]) > 0.04) {
        problems.push(`${mode} --${token}: chroma ${match[2]} > 0.04, a second accent`);
      }
    }
    if (colours["spot-foreground"] !== colours.paper) {
      problems.push(`${mode}: spot-foreground is not the paper`);
    }
  }
  return problems;
}

describe("baseValues: the shipped looks", () => {
  it.each(THEME_PRESETS)("%s returns its values file byte for byte", (name) => {
    const file = JSON.parse(
      readFileSync(path.resolve(`registry/theme/presets/${name}.json`), "utf8"),
    );
    const values = baseValues({ preset: name });
    expect(JSON.stringify(values.light)).toBe(JSON.stringify(file.light));
    expect(JSON.stringify(values.dark)).toBe(JSON.stringify(file.dark));
  });

  it("default returns the default theme's base values", () => {
    const values = baseValues({ preset: "default" });
    for (const mode of ["light", "dark"] as const) {
      expect(values[mode]).toEqual(
        Object.fromEntries(PRESET_BASE_TOKENS.map((t) => [t, theme.cssVars[mode][t]])),
      );
    }
  });

  it("covers every shipped look and hands out copies", () => {
    expect([...LOOK_PRESETS]).toEqual(["default", ...THEME_PRESETS]);
    const first = baseValues({ preset: "sepia" });
    first.light.ink = "changed";
    expect(baseValues({ preset: "sepia" }).light.ink).not.toBe("changed");
  });
});

describe("baseValues: a custom look", () => {
  const looks = [...corners(), ...randomLooks()];
  // The worst ratio over the minimum seen per pair and mode, for the hand-over table.
  const worst = new Map<string, { ratio: number; min: number; look: CustomLook }>();

  it(`passes every pair in both modes, in gamut and in shape: ${COUNT} random looks (seed ${SEED}) and all 64 corners`, () => {
    const failures: string[] = [];
    for (const custom of looks) {
      const values = baseValues({ custom });
      const problems = shapeProblems(values);
      const item = presetItem(theme, {
        name: "custom",
        title: "Custom",
        description: "",
        ...values,
      });
      for (const [label, fg, bg, min, modes, alpha] of PAIRS) {
        for (const mode of modes) {
          const vars = item.cssVars[mode];
          const ratio = contrast(resolve(vars, fg), resolve(vars, bg), alpha);
          const key = `${label} (${mode})`;
          const seen = worst.get(key);
          if (!seen || ratio / min < seen.ratio / seen.min)
            worst.set(key, { ratio, min, look: custom });
          if (ratio < min) problems.push(`${key}: ${ratio.toFixed(3)} < ${min}`);
        }
      }
      if (problems.length > 0) failures.push(`${JSON.stringify(custom)}: ${problems.join("; ")}`);
    }
    expect(failures.slice(0, 5)).toEqual([]);
    expect(worst.size).toBe(PAIRS.reduce((n, pair) => n + pair[4].length, 0));
    console.info(
      [
        `Worst margin per pair over ${looks.length} custom looks (seed ${SEED}):`,
        ...[...worst].map(
          ([key, { ratio, min }]) =>
            `  ${key.padEnd(46)} ${ratio.toFixed(3)} ≥ ${min}  (+${((ratio / min - 1) * 100).toFixed(1)} %)`,
        ),
      ].join("\n"),
    );
  }, 120_000);

  it("is deterministic and follows its inputs", () => {
    const custom = look([84, 9, 50, 6, 37, 6]);
    expect(baseValues({ custom })).toEqual(baseValues({ custom }));
    const white = baseValues({ custom: look([84, 0, 50, 0, 37, 6]) });
    expect(parseOklch(white.light.paper)[1]).toBe(0);
    expect(parseOklch(white.light.ink)[1]).toBe(0);
    const tinted = baseValues({ custom });
    expect(parseOklch(tinted.light.paper)[1]).toBeGreaterThan(0.02);
    // Roles swap in dark: dark paper wears the ink's hue, dark ink the paper's.
    expect(parseOklch(tinted.dark.paper)[2]).toBe(50);
    expect(parseOklch(tinted.dark.ink)[2]).toBe(84);
    // The spot lifts in dark.
    expect(parseOklch(tinted.dark.spot)[0]).toBeGreaterThan(parseOklch(tinted.light.spot)[0]);
    const muted = baseValues({ custom: look([84, 9, 50, 6, 37, 0]) });
    expect(parseOklch(muted.light.spot)[1]).toBeLessThan(parseOklch(tinted.light.spot)[1]);
  });
});
