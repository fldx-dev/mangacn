import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadRegistry } from "./index";
import { renderThemeCss, renderThemeCssFile, THEME_CSS_HEADER, THEME_CSS_PATH } from "./theme-css";

describe("renderThemeCss", () => {
  it("renders cssVars into @theme inline, :root and .dark blocks in source order", () => {
    const css = renderThemeCss({
      cssVars: {
        theme: { "halftone-size": "4px", "--already-prefixed": "1px" },
        light: { ink: "oklch(0.16 0.005 60)", background: "var(--paper)" },
        dark: { ink: "oklch(0.93 0.004 85)", background: "var(--paper)" },
      },
    });
    expect(css).toBe(
      [
        "@theme inline {",
        "  --halftone-size: 4px;",
        "  --already-prefixed: 1px;",
        "}",
        "",
        ":root {",
        "  --ink: oklch(0.16 0.005 60);",
        "  --background: var(--paper);",
        "}",
        "",
        ".dark {",
        "  --ink: oklch(0.93 0.004 85);",
        "  --background: var(--paper);",
        "}",
        "",
      ].join("\n"),
    );
  });

  it("keeps quoted font stacks verbatim", () => {
    const stack = 'var(--font-display, "Dela Gothic One", "Reggae One", Impact, sans-serif)';
    expect(renderThemeCss({ cssVars: { theme: { "font-display": stack } } })).toContain(
      `  --font-display: ${stack};`,
    );
  });

  it("renders @utility, nested @keyframes, @media and @layer rules", () => {
    const css = renderThemeCss({
      css: {
        "@utility ink-shadow": {
          "box-shadow": "var(--shadow-offset) var(--shadow-offset) 0 0 var(--ink)",
        },
        "@keyframes mangacn-shake": {
          "0%, 100%": { transform: "translateX(0)" },
          "50%": { transform: "translateX(4px)" },
        },
        "@media (prefers-reduced-motion: reduce)": {
          '[class*="animate-mangacn-"]': { animation: "none" },
        },
        "@layer base": {
          "*": { "@apply border-border outline-ring/50": {} },
        },
      },
    });
    expect(css).toBe(
      [
        "@utility ink-shadow {",
        "  box-shadow: var(--shadow-offset) var(--shadow-offset) 0 0 var(--ink);",
        "}",
        "",
        "@keyframes mangacn-shake {",
        "  0%, 100% {",
        "    transform: translateX(0);",
        "  }",
        "  50% {",
        "    transform: translateX(4px);",
        "  }",
        "}",
        "",
        "@media (prefers-reduced-motion: reduce) {",
        '  [class*="animate-mangacn-"] {',
        "    animation: none;",
        "  }",
        "}",
        "",
        "@layer base {",
        "  * {",
        "    @apply border-border outline-ring/50;",
        "  }",
        "}",
        "",
      ].join("\n"),
    );
  });

  it("renders empty at-rules as statements and empty selectors as empty blocks", () => {
    expect(renderThemeCss({ css: { '@import "tw-animate-css"': {}, ".empty": {} } })).toBe(
      '@import "tw-animate-css";\n\n.empty {}\n',
    );
  });

  it("skips missing or empty sections", () => {
    expect(renderThemeCss({})).toBe("\n");
    expect(renderThemeCss({ cssVars: { light: {} } })).toBe("\n");
  });

  it("rejects values that are not strings or objects", () => {
    expect(() => renderThemeCss({ css: { ".x": { opacity: 1 } } as never })).toThrow(
      /Unsupported value for "opacity"/,
    );
    expect(() => renderThemeCss({ css: { ".x": ["a"] } as never })).toThrow(TypeError);
  });

  it("is deterministic", () => {
    const item = loadRegistry().items.find((entry) => entry.name === "theme");
    expect(renderThemeCss(item as never)).toBe(renderThemeCss(item as never));
  });
});

describe("renderThemeCssFile", () => {
  it("prefixes the generated-file header and matches the snapshot", () => {
    const css = renderThemeCssFile(loadRegistry());
    expect(css.startsWith(`${THEME_CSS_HEADER}\n\n@theme inline {`)).toBe(true);
    expect(css).toMatchSnapshot();
  });

  it("throws for an unknown item", () => {
    expect(() => renderThemeCssFile(loadRegistry(), "nope")).toThrow('"nope" not found');
  });
});

describe(`${THEME_CSS_PATH} drift`, () => {
  const file = path.resolve(THEME_CSS_PATH);

  it.skipIf(!existsSync(file))("matches what the theme item renders (run `pnpm gen:theme`)", () => {
    expect(readFileSync(file, "utf8")).toBe(renderThemeCssFile(loadRegistry()));
  });
});
