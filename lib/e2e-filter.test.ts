import { describe, expect, it } from "vitest";
import {
  dependencyItems,
  type E2eItem,
  type E2eSources,
  formatE2eItems,
  importedItems,
  parseE2eItems,
  selectE2e,
  selectedDemoItems,
} from "./e2e-filter";

const ITEMS: E2eItem[] = [
  { name: "theme", hasDemos: false, uses: ["font-display"] },
  { name: "font-display", hasDemos: false, uses: [] },
  { name: "ink-frame", folder: "registry/theme/ink-frame", hasDemos: true, uses: [] },
  { name: "button", folder: "registry/ui/button", hasDemos: true, uses: ["ink-frame"] },
  { name: "dialog", folder: "registry/ui/dialog", hasDemos: true, uses: ["button", "ink-frame"] },
  { name: "alert-dialog", folder: "registry/ui/alert-dialog", hasDemos: true, uses: ["dialog"] },
  { name: "slider", folder: "registry/ui/slider", hasDemos: true, uses: ["ink-frame"] },
  { name: "toggle", folder: "registry/ui/toggle", hasDemos: true, uses: [] },
  { name: "toggle-group", folder: "registry/ui/toggle-group", hasDemos: true, uses: ["toggle"] },
  { name: "ink-mark", folder: "registry/ui/ink-mark", hasDemos: true, uses: [] },
];

function sources(files: Record<string, [string | undefined, string | undefined]> = {}): E2eSources {
  return {
    items: ITEMS,
    before: (path) => files[path]?.[0],
    after: (path) => files[path]?.[1],
  };
}

const pick = (paths: string[], src = sources()) => formatE2eItems(selectE2e(paths, src).selection);

describe("E2E_ITEMS parsing", () => {
  it("reads unset, empty and all as everything, none as nothing", () => {
    expect(parseE2eItems(undefined)).toBeUndefined();
    expect(parseE2eItems(" ")).toBeUndefined();
    expect(parseE2eItems("all")).toBeUndefined();
    expect(parseE2eItems("none")).toEqual(new Set());
    expect(parseE2eItems("slider, site,,")).toEqual(new Set(["slider", "site"]));
  });

  it("formats items in name order, then the suites", () => {
    expect(formatE2eItems(new Set(["site", "slider", "button", "mcp"]))).toBe(
      "button,slider,site,mcp",
    );
    expect(formatE2eItems(undefined)).toBe("all");
    expect(formatE2eItems(new Set())).toBe("none");
  });

  it("separates demo items from suites", () => {
    expect(selectedDemoItems(new Set(["slider", "site"]))).toEqual(["slider"]);
    expect(selectedDemoItems(undefined)).toBeUndefined();
  });
});

describe("selectE2e", () => {
  it("takes a changed item, the items that use it, and the site", () => {
    expect(pick(["registry/ui/slider/slider.tsx"])).toBe("slider,site");
    expect(pick(["registry/ui/button/button.tsx"])).toBe("alert-dialog,button,dialog,site");
    expect(pick(["registry/ui/toggle/demos/pressed.tsx"])).toBe("toggle,toggle-group,site");
  });

  it("adds the annotations spec for ink-mark", () => {
    expect(pick(["registry/ui/ink-mark/ink-mark.tsx"])).toBe("ink-mark,site,annotations");
  });

  it("ignores unit tests, Markdown, scripts and CI", () => {
    expect(
      pick([
        "registry/ui/slider/slider.test.tsx",
        "registry/ui/README.md",
        "lib/registry/index.test.ts",
        "scripts/registry-smoke.ts",
        ".github/workflows/ci.yml",
        "SPEC-components.md",
      ]),
    ).toBe("none");
  });

  it("maps docs, MCP and spec paths to their suites", () => {
    expect(pick(["content/docs/theming.mdx", "components/docs/demo-frame.tsx"])).toBe("site");
    expect(pick(["lib/mcp/tools.ts", "app/api/mcp/route.ts"])).toBe("mcp");
    expect(pick(["skills/mangacn/SKILL.md"])).toBe("mcp");
    expect(pick(["e2e/annotations.spec.ts"])).toBe("annotations");
  });

  it("runs everything for shared inputs and unknown paths", () => {
    for (const path of [
      "e2e/playwright.config.ts",
      "e2e/ready.ts",
      "app/globals.css",
      "app/demo/[item]/[demo]/page.tsx",
      "registry/theme/ink-frame/ink-frame.tsx",
      "lib/registry/demos.ts",
      "lib/e2e-filter.ts",
      "pnpm-lock.yaml",
      "something/new.ts",
    ]) {
      expect(pick([path]), path).toBe("all");
    }
  });

  it("maps a baseline to its item, longest name first, or to the site", () => {
    expect(pick(["e2e/__screenshots__/linux/w360/toggle-group-default-dark.png"])).toBe(
      "toggle-group",
    );
    expect(pick(["e2e/__screenshots__/linux/w360/site-home-light.png"])).toBe("site");
    expect(pick(["e2e/__screenshots__/linux/w360/gone-default-light.png"])).toBe("none");
  });

  it("reads package.json: scripts alone change nothing, dependencies everything", () => {
    const before = JSON.stringify({ scripts: { check: "a" }, dependencies: { x: "1" } });
    const scripts = JSON.stringify({ scripts: { check: "b" }, dependencies: { x: "1" } });
    const deps = JSON.stringify({ scripts: { check: "a" }, dependencies: { x: "2" } });
    const build = JSON.stringify({ scripts: { check: "a", build: "c" }, dependencies: { x: "1" } });
    expect(pick(["package.json"], sources({ "package.json": [before, scripts] }))).toBe("none");
    expect(pick(["package.json"], sources({ "package.json": [before, deps] }))).toBe("all");
    expect(pick(["package.json"], sources({ "package.json": [before, build] }))).toBe("all");
  });

  it("reads a catalog by entry: an item's entry is that item, CSS or the theme catalog everything", () => {
    const catalog = (items: object[]) => JSON.stringify({ items });
    const ui = "registry/ui/registry.json";
    const base = [{ name: "slider", title: "Slider" }, { name: "toggle" }];
    expect(
      pick(
        [ui],
        sources({
          [ui]: [catalog(base), catalog([{ name: "slider", title: "S" }, { name: "toggle" }])],
        }),
      ),
    ).toBe("slider,site");
    expect(
      pick(
        [ui],
        sources({ [ui]: [catalog(base), catalog([...base, { name: "sfx", css: { a: 1 } }])] }),
      ),
    ).toBe("all");
    const theme = "registry/theme/registry.json";
    expect(
      pick([theme], sources({ [theme]: [catalog(base), catalog([{ name: "theme", x: 1 }])] })),
    ).toBe("all");
  });

  it("explains each decision", () => {
    const { reasons } = selectE2e(["registry/ui/button/button.tsx", "lib/mcp/tools.ts"], sources());
    expect(reasons).toEqual([
      "lib/mcp/tools.ts → mcp",
      "registry/ui/button/button.tsx → button + users alert-dialog, dialog + site",
    ]);
  });
});

describe("item graph helpers", () => {
  const names = new Set(["ink-frame", "button", "sfx-text", "toggle", "manga-motion"]);

  it("finds catalog items imported by registry or install path", () => {
    const source = [
      'import { InkFrame } from "@/components/ink-frame";',
      'import { Button } from "@/components/ui/button";',
      'import { SfxText } from "@/registry/ui/sfx-text/sfx-text";',
      'import { DemoFrame } from "@/components/docs/demo-frame";',
      'import { cn } from "@/lib/utils";',
      'import { popIn } from "@/lib/manga-motion";',
    ].join("\n");
    expect(importedItems(source, names).sort()).toEqual([
      "button",
      "ink-frame",
      "manga-motion",
      "sfx-text",
    ]);
  });

  it("keeps registryDependencies that are catalog items, by URL or bare name", () => {
    expect(
      dependencyItems(["https://www.mangacn.com/r/toggle.json", "button", "label"], names),
    ).toEqual(["toggle", "button"]);
    expect(dependencyItems(undefined, names)).toEqual([]);
  });
});
