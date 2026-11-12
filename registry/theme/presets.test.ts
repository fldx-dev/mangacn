import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadRegistry, registryItemUrl } from "@/lib/registry";
import {
  type DefaultTheme,
  defaultThemeOf,
  formatJson,
  isPresetItem,
  loadPresets,
  PRESETS_DIR,
  presetItem,
  renderPresetsCss,
  renderThemeCatalog,
  THEME_CATALOG_PATH,
} from "@/lib/registry/theme-preset-items";
import {
  PRESET_BASE_TOKENS,
  PRESET_SCRIPT,
  PRESET_STORAGE_KEY,
  THEME_PRESETS,
} from "@/lib/registry/theme-presets";

// Task 99: a preset is paper, ink and one spot. It gives the base colours other values, in light
// and dark, and nothing else: no new token, no second accent, the same radius, fonts, pen and
// utilities. These tests hold every preset item in the catalog to that.

const catalogText = readFileSync(path.resolve(THEME_CATALOG_PATH), "utf8");
const registry = loadRegistry();
const theme = registry.items.find((item) => item.name === "theme") as unknown as DefaultTheme & {
  css?: unknown;
};
const presets = registry.items.filter(isPresetItem) as unknown as ReturnType<typeof presetItem>[];

const PLAIN_OKLCH = /^oklch\(([\d.]+) ([\d.]+) ([\d.]+)\)$/;

describe("theme presets", () => {
  it("lists every values file in THEME_PRESETS, and nothing else", () => {
    const files = readdirSync(path.resolve(PRESETS_DIR))
      .filter((file) => file.endsWith(".json"))
      .map((file) => file.slice(0, -".json".length))
      .sort();
    expect(files).toEqual([...THEME_PRESETS].sort());
  });

  it("has one theme-<name> item per preset, after every other theme-catalog item", () => {
    expect(presets.map((item) => item.name)).toEqual(THEME_PRESETS.map((name) => `theme-${name}`));
    const themeCatalog = registry.items.filter((item) => item.source === THEME_CATALOG_PATH);
    expect(themeCatalog.slice(-presets.length).map((item) => item.name)).toEqual(
      presets.map((item) => item.name),
    );
  });

  it("is in sync with the values files (run `pnpm gen:theme`)", () => {
    expect(renderThemeCatalog(catalogText, loadPresets())).toBe(catalogText);
  });

  it.each(presets.map((item) => [item.name, item] as const))(
    "%s has the default theme's key set, and only colour values differ",
    (_name, item) => {
      for (const block of ["theme", "light", "dark"] as const) {
        const own = item.cssVars[block];
        const base = theme.cssVars[block];
        expect(Object.keys(own), `${block} keys`).toEqual(Object.keys(base));
        for (const [key, value] of Object.entries(own)) {
          if (value === base[key]) continue;
          // A differing value is a base colour, in a mode, as a plain oklch().
          expect(block, `--${key}`).not.toBe("theme");
          expect(PRESET_BASE_TOKENS as readonly string[], `--${key}`).toContain(key);
          expect(value, `--${key}`).toMatch(PLAIN_OKLCH);
        }
      }
    },
  );

  it.each(presets.map((item) => [item.name, item] as const))(
    "%s keeps one accent: only the spot carries colour",
    (_name, item) => {
      for (const mode of ["light", "dark"] as const) {
        for (const token of PRESET_BASE_TOKENS) {
          if (token === "spot") continue;
          const [, , chroma] = PLAIN_OKLCH.exec(item.cssVars[mode][token]) ?? [];
          expect(Number(chroma), `${mode} --${token} chroma`).toBeLessThanOrEqual(0.04);
        }
        // The text on a spot fill is the page's paper, as in the default theme.
        expect(item.cssVars[mode]["spot-foreground"]).toBe(item.cssVars[mode].paper);
      }
    },
  );

  it.each(presets.map((item) => [item.name, item] as const))(
    "%s brings the default theme by URL and ships nothing of its own",
    (_name, item) => {
      expect(item.type).toBe("registry:theme");
      expect(item.registryDependencies).toEqual([registryItemUrl("theme")]);
      expect(item.files).toEqual([]);
      for (const key of ["css", "tailwind", "dependencies", "font"]) {
        expect(item, key).not.toHaveProperty(key);
      }
      expect(item.docs).toContain("rewrites the same variables in globals.css in place");
    },
  );

  it("derives every shadcn token through var(), so the base colours are all a preset needs", () => {
    for (const mode of ["light", "dark"] as const) {
      for (const [key, value] of Object.entries(theme.cssVars[mode])) {
        if ((PRESET_BASE_TOKENS as readonly string[]).includes(key) || key === "radius") continue;
        expect(value, `--${key}`).toMatch(/^var\(--[a-z0-9-]+\)$/);
      }
    }
  });

  it("builds an item from the default theme and a values file", () => {
    const [sepia] = loadPresets();
    const item = presetItem(defaultThemeOf(JSON.parse(catalogText)), sepia);
    expect(item.cssVars.light.paper).toBe(sepia.light.paper);
    expect(item.cssVars.dark.ink).toBe(sepia.dark.ink);
    expect(item.cssVars.light.background).toBe("var(--paper)");
    expect(item.cssVars.light.radius).toBe(theme.cssVars.light.radius);
  });

  it("lays JSON out as Biome does: short arrays inline, long ones one entry per line", () => {
    expect(formatJson({ a: ["x"], b: [], c: {} })).toBe(
      '{\n  "a": ["x"],\n  "b": [],\n  "c": {}\n}',
    );
    const long = Array.from({ length: 8 }, (_, index) => `entry-number-${index}`);
    expect(formatJson({ list: long }).split("\n")).toHaveLength(long.length + 4);
  });
});

describe("the docs site's preset stylesheet", () => {
  const css = renderPresetsCss(theme, loadPresets());

  it("scopes each look's light set to the attribute and its dark set under .dark", () => {
    expect(css).toContain('[data-theme-preset="sepia"] {\n  --ink: oklch(0.17 0.022 50);');
    expect(css).toContain(
      '.dark[data-theme-preset="sepia"],\n.dark [data-theme-preset="sepia"] {\n  --ink: oklch(0.9 0.035 84);',
    );
    // The default is scoped too, so a region can show it inside a page in another look.
    expect(css).toContain('[data-theme-preset="default"] {\n  --ink: oklch(0.16 0.005 60);');
  });

  it("declares the derived tokens again, so they resolve on any element", () => {
    const sepia = css.slice(css.indexOf('[data-theme-preset="sepia"] {'));
    expect(sepia).toContain("--background: var(--paper);");
    expect(sepia).toContain("--chart-5: var(--spot);");
  });
});

describe("the no-flash script", () => {
  it("reads storage in a try and accepts only a listed preset", () => {
    expect(PRESET_SCRIPT).toMatch(/^try\{/);
    expect(PRESET_SCRIPT).toContain(JSON.stringify(PRESET_STORAGE_KEY));
    expect(PRESET_SCRIPT).toContain(JSON.stringify(THEME_PRESETS));
  });

  it("sets the attribute for a stored preset, ignores anything else and survives blocked storage", () => {
    const run = (stored: string | null, throws = false) => {
      const attributes = new Map<string, string>();
      const localStorage = {
        getItem: () => {
          if (throws) throw new Error("SecurityError");
          return stored;
        },
      };
      const document = {
        documentElement: {
          setAttribute: (name: string, value: string) => attributes.set(name, value),
        },
      };
      new Function("localStorage", "document", PRESET_SCRIPT)(localStorage, document);
      return attributes.get("data-theme-preset") ?? null;
    };
    expect(run("sepia")).toBe("sepia");
    expect(run("nope")).toBeNull();
    expect(run(null)).toBeNull();
    expect(run("sepia", true)).toBeNull();
  });
});
