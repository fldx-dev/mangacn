import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadRegistry } from "@/lib/registry";
import { contrast, contrastFailures, PAIRS, parseOklch, resolve } from "@/lib/registry/contrast";
import type { ThemeCssSource } from "@/lib/registry/theme-css";
import { type DefaultTheme, presetItem, readPresetValues } from "@/lib/registry/theme-preset-items";

const registry = loadRegistry();

// The default theme and every preset (Task 99): each is held to the same targets in both modes.
const themes = registry.items.filter(
  (item) => item.type === "registry:theme",
) as (ThemeCssSource & {
  name: string;
})[];

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
    const failures = contrastFailures(presetItem(theme, fixture).cssVars);
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
