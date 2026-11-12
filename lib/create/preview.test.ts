import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { PRESET_BASE_TOKENS } from "@/lib/registry/theme-presets";
import { baseValues } from "./colours";
import { type CreateConfig, DEFAULT_CONFIG, PENS } from "./config";
import { DERIVED_TOKENS, FONT_FACE_VARIABLES, previewVariables } from "./preview";
import { CUSTOM_STARTS } from "./state";

describe("the preview's variables", () => {
  it("re-declares every derived token of the theme, pointing at the base tokens", () => {
    expect(DERIVED_TOKENS).toMatchObject({
      background: "var(--paper)",
      foreground: "var(--ink)",
      primary: "var(--ink)",
      muted: "var(--tone-1)",
      "muted-foreground": "var(--tone-4)",
      border: "var(--ink)",
      ring: "var(--spot)",
      "chart-5": "var(--spot)",
    });
    expect(Object.keys(DERIVED_TOKENS).length).toBeGreaterThanOrEqual(30);
    for (const value of Object.values(DERIVED_TOKENS))
      expect(value).toMatch(/^var\(--[a-z0-9-]+\)$/);
  });

  it("sets a shipped look's exact base values in each mode", () => {
    const config: CreateConfig = { ...DEFAULT_CONFIG, look: { preset: "sepia" } };
    for (const mode of ["light", "dark"] as const) {
      const vars = previewVariables(config, mode);
      const expected = baseValues(config.look)[mode];
      for (const token of PRESET_BASE_TOKENS) expect(vars[`--${token}`]).toBe(expected[token]);
      expect(vars["--background"]).toBe("var(--paper)");
    }
  });

  it("sets a custom look's derived base values", () => {
    const config: CreateConfig = { ...DEFAULT_CONFIG, look: { custom: CUSTOM_STARTS.weekly } };
    const vars = previewVariables(config, "dark");
    expect(vars["--paper"]).toBe(baseValues(config.look).dark.paper);
    expect(vars["--spot"]).toMatch(/^oklch\(\d/);
  });

  it("writes the pen and screentone with their units, and the seed offset", () => {
    const config: CreateConfig = { ...DEFAULT_CONFIG, pen: { ...PENS.brush } };
    const vars = previewVariables(config, "light", 41);
    expect(vars).toMatchObject({
      "--outline-width": "2px",
      "--outline-width-heavy": "2.8px",
      "--ink-roughness": "1.8",
      "--ink-hachure-gap": "5px",
      "--halftone-size": "4px",
      "--halftone-dot": "1.2px",
      "--speed-line-width": "2px",
      "--ink-seed": "41",
    });
    expect(previewVariables(config, "light")["--ink-seed"]).toBe("0");
  });

  it("leaves the site's faces in place and points the others at their loaded variables", () => {
    expect(previewVariables(DEFAULT_CONFIG, "light")).not.toHaveProperty("--font-display");
    expect(previewVariables(DEFAULT_CONFIG, "light")).not.toHaveProperty("--font-dialogue-latin");
    const vars = previewVariables(
      { ...DEFAULT_CONFIG, fonts: { display: "reggae-one", dialogue: "patrick-hand-sc" } },
      "light",
    );
    expect(vars["--font-display"]).toBe("var(--font-create-reggae-one)");
    expect(vars["--font-dialogue-latin"]).toBe("var(--font-create-patrick-hand-sc)");
  });

  it("names the same variables the page's font loader defines", () => {
    const loader = readFileSync(
      path.join(process.cwd(), "components/create/create-fonts.ts"),
      "utf8",
    );
    for (const variable of Object.values(FONT_FACE_VARIABLES)) {
      expect(loader).toContain(`variable: "${variable}"`);
    }
  });
});
