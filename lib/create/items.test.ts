/** @vitest-environment node */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { registryItemSchema } from "shadcn/schema";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { loadRegistry, registryItemUrl } from "@/lib/registry";
import { PRESET_BASE_TOKENS, presetItemName } from "@/lib/registry/theme-presets";
import { decode, encode } from "./code";
import { baseValues } from "./colours";
import {
  type CreateConfig,
  type CustomLook,
  DEFAULT_CONFIG,
  DIALOGUE_FONTS,
  DISPLAY_FONTS,
  HUE_RANGE,
  KIT_NAMES,
  LOOK_PRESETS,
  PEN_NAMES,
  PEN_RANGES,
  PEN_TOKENS,
  PENS,
  type Range,
  rangeSize,
  rangeValue,
  SCREENTONE_RANGES,
  SCREENTONE_TOKENS,
  STRENGTH_RANGE,
  screentoneProblem,
  VIVIDNESS_RANGE,
} from "./config";
import {
  BASE_CONFIG,
  bundleItem,
  type CssTree,
  FONT_MAPPINGS,
  fontItemNames,
  ITEM_SCHEMA,
  SEMANTIC_TOKENS,
  themeItem,
} from "./items";
import { KIT_CATALOG_V1, KITS, kitItems } from "./kits";
import { createAnswer } from "./serve";
import { bundleUrl, registryUrl, SITE_ORIGIN, themeUrl } from "./urls";

type Vars = Record<string, string>;
interface BuiltItem {
  name: string;
  registryDependencies?: string[];
  cssVars: { theme: Vars; light: Vars; dark: Vars };
  css?: CssTree;
}

const config = (patch: Partial<CreateConfig> = {}): CreateConfig => ({
  ...structuredClone(DEFAULT_CONFIG),
  ...patch,
});

// ── A fresh build of the static items, to compare against ───────────────────────────────────

let built: string;
const read = (name: string): BuiltItem =>
  JSON.parse(readFileSync(path.join(built, `${name}.json`), "utf8")) as BuiltItem;

beforeAll(() => {
  built = mkdtempSync(path.join(tmpdir(), "mangacn-create-items-"));
  // `pnpm registry:build`'s command, into a folder of its own (pnpm runs tests from the root).
  const cli = path.resolve("node_modules/shadcn/dist/index.js");
  execFileSync(process.execPath, [cli, "build", "--output", built], { stdio: "ignore" });
}, 60_000);

afterAll(() => {
  if (built) rmSync(built, { recursive: true, force: true });
});

/** What the generated theme adds to the static theme's `cssVars.theme`. */
const ADDED_THEME_VARS: Vars = {
  ...Object.fromEntries(SEMANTIC_TOKENS.map((t) => [`color-${t}`, `var(--${t})`])),
  ...FONT_MAPPINGS,
};

describe("the generated theme of a named look", () => {
  it.each(LOOK_PRESETS)("%s: every variable equals the static item's, value for value", (look) => {
    const generated = themeItem(config({ look: { preset: look } }));
    const shipped = read(presetItemName(look));
    expect(generated.cssVars.light).toEqual(shipped.cssVars.light);
    expect(generated.cssVars.dark).toEqual(shipped.cssVars.dark);
    expect(generated.cssVars.theme).toEqual({ ...shipped.cssVars.theme, ...ADDED_THEME_VARS });
    // Same order too: the CLI writes them as listed.
    expect(Object.keys(generated.cssVars.light)).toEqual(Object.keys(shipped.cssVars.light));
  });

  it("brings the default theme's css, utilities and keyframes, plus html { @apply font-sans }", () => {
    const shipped = read("theme");
    const generated = themeItem(DEFAULT_CONFIG);
    const base = shipped.css?.["@layer base"] as CssTree;
    expect(generated.css).toEqual({
      ...shipped.css,
      "@layer base": { ...base, html: { "@apply font-sans": {} } },
    });
  });

  it("depends on the same three font items as theme.json, never on theme.json itself", () => {
    const generated = themeItem(DEFAULT_CONFIG);
    expect(generated.registryDependencies).toEqual(read("theme").registryDependencies);
    expect(generated.registryDependencies).not.toContain(registryItemUrl("theme"));
  });

  it("maps every shadcn token the theme defines, and only those", () => {
    const shipped = read("theme");
    const tokens = Object.keys(shipped.cssVars.light).filter(
      (key) => !(PRESET_BASE_TOKENS as readonly string[]).includes(key) && key !== "radius",
    );
    expect([...SEMANTIC_TOKENS]).toEqual(tokens);
  });
});

/** The keys whose values differ between two variable sets with the same keys. */
function changed(a: Vars, b: Vars): string[] {
  expect(Object.keys(a)).toEqual(Object.keys(b));
  return Object.keys(a).filter((key) => a[key] !== b[key]);
}

describe("a configured theme changes what it should and nothing else", () => {
  const plain = themeItem(DEFAULT_CONFIG);

  it("a custom look changes only the base colours, to baseValues", () => {
    const custom: CustomLook = {
      paper: { hue: 200, strength: 7 },
      ink: { hue: 300, strength: 3 },
      spot: { hue: 140, vividness: 8 },
    };
    const item = themeItem(config({ look: { custom } }));
    const values = baseValues({ custom });
    for (const mode of ["light", "dark"] as const) {
      const keys = changed(item.cssVars[mode], plain.cssVars[mode]);
      expect(keys.length).toBeGreaterThan(0);
      for (const key of keys) expect(PRESET_BASE_TOKENS).toContain(key);
      for (const token of PRESET_BASE_TOKENS) {
        expect(item.cssVars[mode][token]).toBe(values[mode][token]);
      }
    }
    expect(item.cssVars.theme).toEqual(plain.cssVars.theme);
    expect(item.css).toEqual(plain.css);
  });

  it("the brush pen changes the six pen variables, with their units", () => {
    const item = themeItem(config({ pen: { ...PENS.brush } }));
    expect(changed(item.cssVars.theme, plain.cssVars.theme)).toEqual([...PEN_TOKENS]);
    expect(PEN_TOKENS.map((t) => item.cssVars.theme[t])).toEqual([
      "2px",
      "2.8px",
      "1.8",
      "1.4",
      "2.2",
      "5px",
    ]);
    expect(item.cssVars.light).toEqual(plain.cssVars.light);
    expect(item.cssVars.dark).toEqual(plain.cssVars.dark);
    expect(item.css).toEqual(plain.css);
  });

  it("a screentone change changes only the variables that moved", () => {
    const item = themeItem(
      config({ screentone: { "halftone-size": 6, "halftone-dot": 2.1, "speed-line-width": 2 } }),
    );
    expect(changed(item.cssVars.theme, plain.cssVars.theme)).toEqual([
      "halftone-size",
      "halftone-dot",
    ]);
    expect(item.cssVars.theme["halftone-size"]).toBe("6px");
    expect(item.cssVars.theme["halftone-dot"]).toBe("2.1px");
    expect(item.cssVars.light).toEqual(plain.cssVars.light);
    expect(item.css).toEqual(plain.css);
  });

  it("a reserved font with no item yet installs its role's default font item", () => {
    expect(fontItemNames(DEFAULT_CONFIG.fonts)).toEqual([
      "font-display",
      "font-dialogue",
      "font-dialogue-ja",
    ]);
    for (const display of DISPLAY_FONTS) {
      for (const dialogue of DIALOGUE_FONTS) {
        expect(fontItemNames({ display, dialogue })).toEqual(fontItemNames(DEFAULT_CONFIG.fonts));
      }
    }
  });
});

describe("the bundle", () => {
  const catalog = new Set(loadRegistry().items.map((item) => item.name));

  it("is base-nova's preset as a registry:base, depending on the theme then the kit", () => {
    const item = bundleItem(DEFAULT_CONFIG);
    expect(item.type).toBe("registry:base");
    expect(item.config).toEqual(BASE_CONFIG);
    expect(item.files).toEqual([]);
    expect(item.registryDependencies).toEqual([
      themeUrl("10"),
      ...KITS.basics.map((name) => registryItemUrl(name)),
    ]);
  });

  it.each(KIT_NAMES)("kit %s: every dependency after the theme is a catalog item", (kit) => {
    const [theme, ...rest] = bundleItem(config({ kit: { preset: kit } })).registryDependencies;
    expect(theme).toBe(themeUrl(encode(config({ kit: { preset: kit } }))));
    expect(rest).toEqual(kitItems({ preset: kit }).map((name) => registryItemUrl(name)));
    for (const name of kitItems({ preset: kit })) expect(catalog).toContain(name);
  });

  it("a kit of every custom item names only catalog items", () => {
    const item = bundleItem(config({ kit: { custom: [...KIT_CATALOG_V1] } }));
    expect(item.registryDependencies).toHaveLength(1 + KIT_CATALOG_V1.length);
    for (const name of KIT_CATALOG_V1) expect(catalog).toContain(name);
  });

  it("builds its URLs on the origin it is given (a dev server's), and the site's by default", () => {
    expect(registryUrl("button")).toBe(registryItemUrl("button"));
    const local = bundleItem(DEFAULT_CONFIG, "http://localhost:3000");
    expect(local.registryDependencies[0]).toBe("http://localhost:3000/r/create/10/theme.json");
    expect(local.registryDependencies[1]).toBe("http://localhost:3000/r/ink-frame.json");
    expect(themeItem(DEFAULT_CONFIG, "http://localhost:3000").registryDependencies[0]).toBe(
      "http://localhost:3000/r/font-display.json",
    );
  });
});

describe("schema", () => {
  const looks: CreateConfig[] = [
    DEFAULT_CONFIG,
    config({ look: { preset: "sepia" }, kit: { preset: "reader" } }),
    config({
      look: {
        custom: {
          paper: { hue: 10, strength: 10 },
          ink: { hue: 0, strength: 0 },
          spot: { hue: 359, vividness: 0 },
        },
      },
      pen: { ...PENS.brush },
      kit: { custom: [...KIT_CATALOG_V1] },
    }),
  ];

  it.each(looks.map((c) => [encode(c), c] as const))(
    "%s: both items pass the CLI's registry item schema",
    (_, c) => {
      for (const item of [themeItem(c), bundleItem(c)]) {
        const result = registryItemSchema.safeParse(item);
        expect(result.error?.issues ?? []).toEqual([]);
      }
    },
  );

  it("the font items the theme depends on pass the font item schema with their dependency", () => {
    for (const name of fontItemNames(DEFAULT_CONFIG.fonts)) {
      const item = read(name) as unknown as { font: { dependency?: string } };
      expect(registryItemSchema.safeParse(item).success).toBe(true);
      expect(item.font.dependency).toMatch(/^@fontsource\/[a-z-]+$/);
    }
  });
});

// ── Fuzz: valid random codes give only allowlisted strings ──────────────────────────────────

/** mulberry32: seeded, so a failure names a configuration that can be rerun. */
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

function randomConfig(next: () => number): CreateConfig {
  const pick = <T>(list: readonly T[]): T => list[Math.floor(next() * list.length)];
  const inRange = (range: Range) => rangeValue(range, Math.floor(next() * rangeSize(range)));
  const look: CreateConfig["look"] =
    next() < 0.3
      ? { preset: pick(LOOK_PRESETS) }
      : {
          custom: {
            paper: { hue: inRange(HUE_RANGE), strength: inRange(STRENGTH_RANGE) },
            ink: { hue: inRange(HUE_RANGE), strength: inRange(STRENGTH_RANGE) },
            spot: { hue: inRange(HUE_RANGE), vividness: inRange(VIVIDNESS_RANGE) },
          },
        };
  const pen =
    next() < 0.4
      ? { ...PENS[pick(PEN_NAMES)] }
      : (Object.fromEntries(
          PEN_TOKENS.map((t) => [t, inRange(PEN_RANGES[t])]),
        ) as CreateConfig["pen"]);
  let screentone: CreateConfig["screentone"];
  do {
    screentone = Object.fromEntries(
      SCREENTONE_TOKENS.map((t) => [t, inRange(SCREENTONE_RANGES[t])]),
    ) as CreateConfig["screentone"];
  } while (screentoneProblem(screentone));
  const kit: CreateConfig["kit"] =
    next() < 0.5
      ? { preset: pick(KIT_NAMES) }
      : { custom: KIT_CATALOG_V1.filter(() => next() < (next() < 0.5 ? 0.05 : 0.6)) };
  return {
    look,
    pen,
    screentone,
    fonts: { display: pick(DISPLAY_FONTS), dialogue: pick(DIALOGUE_FONTS) },
    kit,
  };
}

const NUMBER = String.raw`\d+(?:\.\d+)?`;
const OKLCH = new RegExp(String.raw`^oklch\(${NUMBER} ${NUMBER} ${NUMBER}\)$`);
const LENGTH = new RegExp(`^${NUMBER}(?:px)?$`);
const CODE = "[0-9A-Za-z]+";
const SITE = String.raw`https://www\.mangacn\.com`;
const NAME = new RegExp(`^create-${CODE}(?:-theme)?$`);
const DOCS = new RegExp(
  `^(?:The mangacn theme of Create code ${CODE}: its look, pen and screentone, with its fonts` +
    `|mangacn Create code ${CODE}: its theme and fonts, and ` +
    String.raw`(?:the (?:${KIT_NAMES.join("|")}) kit|a kit of \d+ hand-picked items?))` +
    String.raw`\. Change it at ${SITE}/create\.$`,
);
const DEPENDENCY = new RegExp(String.raw`^${SITE}/r/(?:create/${CODE}/theme|([a-z0-9-]+))\.json$`);
const CATALOG = new Set(loadRegistry().items.map((item) => item.name));

const defaultTheme = themeItem(DEFAULT_CONFIG);
const DESCRIPTIONS = new Set([defaultTheme.description, bundleItem(DEFAULT_CONFIG).description]);
/** Every string the default theme's `css` holds: the only strings a generated `css` may hold. */
const CSS_STRINGS = new Set<string>();
(function collect(tree: CssTree) {
  for (const [key, value] of Object.entries(tree)) {
    CSS_STRINGS.add(key);
    if (typeof value === "string") CSS_STRINGS.add(value);
    else collect(value);
  }
})(defaultTheme.css);

const VARIABLE_THEME_TOKENS = new Set<string>([...PEN_TOKENS, ...SCREENTONE_TOKENS]);
const BASE_TOKENS = new Set<string>(PRESET_BASE_TOKENS);
const CONFIG_STRINGS = new Set<unknown>([
  ...Object.values(BASE_CONFIG),
  ...Object.values(BASE_CONFIG.tailwind),
]);

/** Whether a string at `at` (its JSON path) is on the allowlist for its field. */
function allowed(at: string[], value: string): boolean {
  const [field, mode, key] = at;
  switch (field) {
    case "$schema":
      return value === ITEM_SCHEMA;
    case "name":
      return NAME.test(value);
    case "type":
      return value === "registry:theme" || value === "registry:base";
    case "title":
      return value === "mangacn theme (Create)" || value === "mangacn project (Create)";
    case "description":
      return DESCRIPTIONS.has(value);
    case "categories":
      return value === "decoration";
    case "docs":
      return DOCS.test(value);
    case "registryDependencies": {
      const match = DEPENDENCY.exec(value);
      return match !== null && (match[1] === undefined || CATALOG.has(match[1]));
    }
    case "config":
      return CONFIG_STRINGS.has(value);
    case "cssVars":
      if (mode !== "theme" && BASE_TOKENS.has(key)) return OKLCH.test(value);
      if (mode === "theme" && VARIABLE_THEME_TOKENS.has(key)) return LENGTH.test(value);
      return (defaultTheme.cssVars as Record<string, Vars>)[mode]?.[key] === value;
    case "css":
      return at.slice(1).every((part) => CSS_STRINGS.has(part)) && CSS_STRINGS.has(value);
    default:
      return false;
  }
}

/** Every string in `value` (keys under cssVars and css too) that is not allowlisted. */
function problems(value: unknown, at: string[] = []): string[] {
  if (typeof value === "string") {
    return allowed(at, value) ? [] : [`${at.join(".")} = ${JSON.stringify(value)}`];
  }
  if (Array.isArray(value)) return value.flatMap((entry) => problems(entry, at));
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, entry]) => {
      const keyProblem =
        at[0] === "cssVars" && at.length === 2 && !/^[a-z0-9-]+$/.test(key)
          ? [`${at.join(".")} has the key ${JSON.stringify(key)}`]
          : [];
      return [...keyProblem, ...problems(entry, [...at, key])];
    });
  }
  return [];
}

describe("fuzz: valid random codes", () => {
  it("3000 random configurations give items whose every string is allowlisted", () => {
    const next = random(20261112);
    const found: string[] = [];
    for (let i = 0; i < 3000; i++) {
      const code = encode(randomConfig(next));
      if (!decode(code).ok) found.push(`${code}: does not decode`);
      const bundle = createAnswer("bundle", `${code}.json`, SITE_ORIGIN);
      const theme = createAnswer("theme", code, SITE_ORIGIN);
      if (bundle.status !== 200 || theme.status !== 200) found.push(`${code}: not 200`);
      for (const problem of [...problems(bundle.body), ...problems(theme.body)]) {
        found.push(`${code}: ${problem}`);
      }
      const [first] = (bundle.body as { registryDependencies: string[] }).registryDependencies;
      if (first !== themeUrl(code)) found.push(`${code}: the bundle does not start with its theme`);
    }
    expect(found.slice(0, 20)).toEqual([]);
  }, 120_000);

  it("the allowlist rejects what a hostile code would try to write", () => {
    expect(problems({ cssVars: { light: { paper: "red; } body { x: url(a)" } } })).toHaveLength(1);
    expect(problems({ registryDependencies: ["https://evil.example/r/x.json"] })).toHaveLength(1);
    expect(problems({ cssVars: { theme: { "outline-width": "1px;}" } } })).toHaveLength(1);
    expect(problems({ name: "create-</script>" })).toHaveLength(1);
  });

  it("the default code answers at the URLs the commands print", () => {
    expect(bundleUrl("10")).toBe("https://www.mangacn.com/r/create/10.json");
    expect(themeUrl("10")).toBe("https://www.mangacn.com/r/create/10/theme.json");
  });
});
