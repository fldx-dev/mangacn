import { describe, expect, it } from "vitest";
import { loadRegistry } from "@/lib/registry";
import type { CssTree, ThemeCssSource } from "@/lib/registry/theme-css";

const theme = loadRegistry().items.find((item) => item.name === "theme") as
  | (ThemeCssSource & { registryDependencies?: string[]; docs?: string })
  | undefined;

// SPEC-manga-theme §5.1
const MANGACN_TOKENS = [
  "ink",
  "paper",
  "spot",
  "spot-foreground",
  "tone-1",
  "tone-2",
  "tone-3",
  "tone-4",
];

// SPEC-manga-theme §6
const SHADCN_VARIABLES = [
  "background",
  "foreground",
  "card",
  "card-foreground",
  "popover",
  "popover-foreground",
  "primary",
  "primary-foreground",
  "secondary",
  "secondary-foreground",
  "muted",
  "muted-foreground",
  "accent",
  "accent-foreground",
  "destructive",
  "border",
  "input",
  "ring",
  "chart-1",
  "chart-2",
  "chart-3",
  "chart-4",
  "chart-5",
  "sidebar",
  "sidebar-foreground",
  "sidebar-primary",
  "sidebar-primary-foreground",
  "sidebar-accent",
  "sidebar-accent-foreground",
  "sidebar-border",
  "sidebar-ring",
  "radius",
];

// SPEC-manga-theme §5.2, §5.3 and §17
const THEME_VARIABLES = [
  "font-display",
  "font-dialogue",
  "outline-width",
  "outline-width-heavy",
  "ink-roughness",
  "ink-bowing",
  "ink-offset",
  "ink-hachure-gap",
  "shadow-offset",
  "halftone-size",
  "halftone-dot",
  "speed-line-width",
];

// SPEC-manga-theme §7
const UTILITIES = [
  "halftone",
  "halftone-light",
  "halftone-dark",
  "screentone-lines",
  "screentone-cross",
  "speed-lines",
  "ink-border",
  "ink-border-heavy",
  "ink-shadow",
  "ink-shadow-sm",
  "ink-shadow-spot",
  "paper-grain",
];
const KEYFRAMES = ["shake", "pop", "slam", "flash", "speed-in"];

const fonts = loadRegistry().items.filter((item) => item.type === "registry:font") as {
  name: string;
  categories?: string[];
  font?: Record<string, unknown>;
}[];

describe("font items", () => {
  it("ships the display, dialogue and Japanese dialogue faces", () => {
    expect(fonts.map((item) => item.name)).toEqual([
      "font-display",
      "font-dialogue",
      "font-dialogue-ja",
    ]);
  });

  it("keeps the dialogue faces off --font-dialogue, so shadcn add leaves the stack alone", () => {
    // In a Next.js project `shadcn add` rewrites each font's @theme entry to var(<variable>);
    // a font on --font-dialogue would replace the chained stack (SPEC-manga-theme §8).
    expect(fonts.find((item) => item.name === "font-dialogue")?.font?.variable).toBe(
      "--font-dialogue-latin",
    );
    for (const item of fonts) expect(item.font?.variable).not.toBe("--font-dialogue");
  });

  it("ships Yusei Magic as the Japanese dialogue fallback (SPEC-manga-theme §8)", () => {
    const ja = fonts.find((item) => item.name === "font-dialogue-ja");
    expect(ja?.categories).toEqual(["text"]);
    // next/font lists no "japanese" subset for Yusei Magic; the glyphs ship as
    // unicode-range slices, as for Dela Gothic One.
    expect(ja?.font).toEqual({
      family: "Yusei Magic",
      provider: "google",
      import: "Yusei_Magic",
      variable: "--font-dialogue-ja",
      weight: ["400"],
      subsets: ["latin"],
    });
  });
});

describe("theme item", () => {
  it("exists", () => {
    expect(theme).toBeDefined();
  });

  it.each(["light", "dark"] as const)(
    "defines every mangacn token and shadcn variable in %s",
    (mode) => {
      const vars = Object.keys(theme?.cssVars?.[mode] ?? {});
      for (const name of [...MANGACN_TOKENS, ...SHADCN_VARIABLES]) {
        expect(vars, `${mode} is missing --${name}`).toContain(name);
      }
    },
  );

  it("keeps light and dark structurally identical", () => {
    const light = Object.keys(theme?.cssVars?.light ?? {}).sort();
    const dark = Object.keys(theme?.cssVars?.dark ?? {}).sort();
    expect(dark).toEqual(light);
  });

  it("maps the red accent to --spot, never to --accent", () => {
    for (const mode of ["light", "dark"] as const) {
      const vars = theme?.cssVars?.[mode] ?? {};
      expect(vars.accent).toBe("var(--tone-1)");
      expect(vars.destructive).toBe("var(--spot)");
      expect(vars.ring).toBe("var(--spot)");
    }
  });

  it("holds geometry and both font stacks in cssVars.theme", () => {
    const vars = theme?.cssVars?.theme ?? {};
    for (const name of THEME_VARIABLES) expect(Object.keys(vars)).toContain(name);
    expect(vars["font-display"]).toMatch(/^var\(--font-display, "Dela Gothic One",/);
    // Shantell Sans has no Japanese glyphs: kana and kanji fall through to Yusei Magic
    // (SPEC-manga-theme §8), whether or not next/font set --font-dialogue-latin.
    expect(vars["font-dialogue"]).toMatch(
      /^var\(--font-dialogue-latin, "Shantell Sans"\), var\(--font-dialogue-ja, "Yusei Magic"\), /,
    );
    expect(vars["font-dialogue"]).toMatch(/, cursive, sans-serif$/);
  });

  it("holds the hand-drawn pen defaults the user chose (SPEC-manga-theme §17)", () => {
    const vars = theme?.cssVars?.theme ?? {};
    expect(vars).toMatchObject({
      "outline-width": "1.5px",
      "outline-width-heavy": "2.1px",
      "ink-roughness": "1.2",
      "ink-bowing": "0.8",
      "ink-offset": "1.5",
      "ink-hachure-gap": "4px",
      "shadow-offset": "4px",
    });
  });

  it("ships every utility, keyframe and animate utility from §7", () => {
    const css = theme?.css ?? {};
    for (const name of UTILITIES) expect(css, name).toHaveProperty([`@utility ${name}`]);
    for (const name of KEYFRAMES) {
      expect(css, name).toHaveProperty([`@keyframes mangacn-${name}`]);
      expect(css, name).toHaveProperty([`@utility animate-mangacn-${name}`]);
      const utility = css[`@utility animate-mangacn-${name}`] as CssTree;
      expect(utility.animation).toMatch(new RegExp(`^mangacn-${name} `));
    }
  });

  it("disables the animate-mangacn-* utilities under reduced motion and sets the base layer", () => {
    const css = theme?.css ?? {};
    expect(css["@media (prefers-reduced-motion: reduce)"]).toEqual({
      '[class*="animate-mangacn-"]': { animation: "none" },
    });
    expect(Object.keys(css["@layer base"] as CssTree)).toEqual(["*", "body"]);
  });

  it("pulls in the three fonts by URL, so one add installs them on every install path", () => {
    // `@mangacn/...` entries only resolve when the consumer has the namespace configured (a
    // direct-URL or `owner/repo/item` install fails with "Unknown registry"); full URLs
    // resolve everywhere (SPEC-manga-theme §4).
    expect(theme?.registryDependencies).toEqual([
      "https://www.mangacn.com/r/font-display.json",
      "https://www.mangacn.com/r/font-dialogue.json",
      "https://www.mangacn.com/r/font-dialogue-ja.json",
    ]);
    expect(theme?.docs).toContain("npx shadcn@latest add @mangacn/theme installs the fonts too");
    expect(theme?.docs).toContain("or set --font-display");
    expect(theme?.docs).not.toContain("add @mangacn/font-display");
  });
});
