import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { PRESET_ATTRIBUTE, THEME_PRESETS } from "@/lib/registry/theme-presets";

// DemoMode spells the preset attribute out instead of importing it (see its comment); this keeps
// the two in step, and every preset name within the pattern it accepts from `?theme=`.
const source = readFileSync(path.resolve("app/demo/[item]/[demo]/demo-mode.tsx"), "utf8");

describe("DemoMode's theme preset", () => {
  it("sets the attribute the preset stylesheet scopes to", () => {
    expect(source).toContain(`const PRESET_ATTRIBUTE = "${PRESET_ATTRIBUTE}";`);
  });

  it("accepts every preset name", () => {
    const pattern = /const PRESET_NAME = \/(.+)\/;/.exec(source)?.[1];
    expect(pattern).toBeDefined();
    for (const name of THEME_PRESETS) expect(name).toMatch(new RegExp(pattern ?? "$^"));
    expect("a b").not.toMatch(new RegExp(pattern ?? "$^"));
  });
});
