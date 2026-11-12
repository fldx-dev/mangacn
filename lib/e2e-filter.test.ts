import { readFileSync } from "node:fs";
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
import { PARITY_PRIMITIVES } from "./registry/parity";

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
  { name: "input", folder: "registry/ui/input", hasDemos: true, uses: ["ink-frame"] },
  { name: "textarea", folder: "registry/ui/textarea", hasDemos: true, uses: ["ink-frame"] },
  {
    name: "input-group",
    folder: "registry/ui/input-group",
    hasDemos: true,
    uses: ["input", "textarea"],
  },
  { name: "button-group", folder: "registry/ui/button-group", hasDemos: true, uses: [] },
  { name: "scroll-area", folder: "registry/ui/scroll-area", hasDemos: true, uses: [] },
  { name: "spinner", folder: "registry/ui/spinner", hasDemos: true, uses: [] },
  { name: "emanata", folder: "registry/ui/emanata", hasDemos: true, uses: [] },
  { name: "empty", folder: "registry/ui/empty", hasDemos: true, uses: ["emanata"] },
  { name: "label", folder: "registry/ui/label", hasDemos: true, uses: [] },
  { name: "progress", folder: "registry/ui/progress", hasDemos: true, uses: [] },
  { name: "chapter-list", folder: "registry/blocks/chapter-list", hasDemos: true, uses: [] },
  { name: "spread-viewer", folder: "registry/blocks/spread-viewer", hasDemos: true, uses: [] },
  {
    name: "login-01",
    folder: "registry/blocks/login-01",
    hasDemos: true,
    page: true,
    uses: ["label"],
  },
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
    expect(pick(["components/docs/demo-frame.tsx", "app/(site)/page.tsx"])).toBe("site");
    expect(pick(["content/docs/theming.mdx"])).toBe("site,mcp,presets");
    expect(pick(["content/docs/installation.mdx"])).toBe("site,mcp");
    expect(pick(["lib/docs/props.generated.json"])).toBe("site,mcp");
    expect(pick(["lib/mcp/tools.ts", "app/api/mcp/route.ts"])).toBe("mcp");
    expect(pick(["skills/mangacn/SKILL.md"])).toBe("mcp");
    expect(pick(["e2e/annotations.spec.ts"])).toBe("annotations");
  });

  it("selects the create suite for the Create page's files (Task C4)", () => {
    expect(pick(["e2e/create.spec.ts"])).toBe("create");
    expect(pick(["lib/create/state.ts"])).toBe("create");
    expect(pick(["lib/create/state.test.ts"])).toBe("none");
    expect(pick(["components/create/create-page.tsx"])).toBe("site,create");
    expect(pick(["app/(site)/create/page.tsx"])).toBe("site,create");
    expect(pick(["e2e/__screenshots__/linux/w360/create-default-light.png"])).toBe("create");
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

  it("selects the presets suite for anything under registry/theme/ (Task 99)", () => {
    expect(pick(["registry/theme/presets/sepia.json"])).toBe("presets,create");
    expect(pick(["e2e/presets.spec.ts"])).toBe("presets");
    expect(pick(["components/docs/theme-preset-switch.tsx"])).toBe("site,presets");
    // The stage's mode component reads the preset names: like all of lib/registry/, everything.
    expect(pick(["lib/registry/theme-presets.ts"])).toBe("all");
    expect(pick(["e2e/__screenshots__/linux/w360/presets-sepia-light.png"])).toBe("presets");
    // A unit test or Markdown under the theme is still nothing; the pen is still everything.
    expect(pick(["registry/theme/contrast.test.ts", "registry/theme/README.md"])).toBe("none");
    expect(pick(["registry/theme/ink-frame/ink-frame.tsx"])).toBe("all");
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

/** tsconfig.json as it was before Task 73 (9626830^1), with `aliases` inserted before sfx-text. */
function tsconfig(aliases: string[] = [], edit: (text: string) => string = (text) => text) {
  const lines = [
    "{",
    '  "compilerOptions": {',
    '    "target": "ES2017",',
    '    "lib": ["dom", "dom.iterable", "esnext"],',
    '    "allowJs": true,',
    '    "skipLibCheck": true,',
    '    "strict": true,',
    '    "noEmit": true,',
    '    "esModuleInterop": true,',
    '    "module": "esnext",',
    '    "moduleResolution": "bundler",',
    '    "resolveJsonModule": true,',
    '    "isolatedModules": true,',
    '    "jsx": "react-jsx",',
    '    "incremental": true,',
    '    "plugins": [',
    "      {",
    '        "name": "next"',
    "      }",
    "    ],",
    '    "paths": {',
    '      "@/components/ink-frame": ["./registry/theme/ink-frame/ink-frame.tsx"],',
    '      "@/components/ui/button": ["./registry/ui/button/button.tsx"],',
    '      "@/components/ui/toggle": ["./registry/ui/toggle/toggle.tsx"],',
    ...aliases,
    '      "@/components/sfx-text": ["./registry/ui/sfx-text/sfx-text.tsx"],',
    '      "@/components/ui/separator": ["./registry/ui/separator/separator.tsx"],',
    '      "@/components/caption-box": ["./registry/ui/caption-box/caption-box.tsx"],',
    '      "@/components/ink-mark": ["./registry/ui/ink-mark/ink-mark.tsx"],',
    '      "@/components/stamp": ["./registry/ui/stamp/stamp.tsx"],',
    '      "@/*": ["./*"]',
    "    }",
    "  },",
    '  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts", "**/*.mts"],',
    '  "exclude": ["node_modules"]',
    "}",
  ];
  return edit(`${lines.join("\n")}\n`);
}

const INPUT_ALIAS = '      "@/components/ui/input": ["./registry/ui/input/input.tsx"],';
const TEXTAREA_ALIAS = '      "@/components/ui/textarea": ["./registry/ui/textarea/textarea.tsx"],';

/**
 * lib/registry/parity.ts as it is, with PARITY_PRIMITIVES cut after `last` (the list as it was
 * when `last` was appended), then `appended` added and `edit` applied.
 */
const PARITY_SOURCE = readFileSync("lib/registry/parity.ts", "utf8");
function parity(
  last: string,
  appended: string[] = [],
  edit: (names: string[]) => string[] = (names) => names,
) {
  const all: readonly string[] = PARITY_PRIMITIVES;
  const names = edit([...all.slice(0, all.indexOf(last) + 1), ...appended]);
  const body = names.map((name) => `  "${name}",\n`).join("");
  return PARITY_SOURCE.replace(
    /(export const PARITY_PRIMITIVES = \[)[^\]]*(\] as const;)/,
    `$1\n${body}$2`,
  );
}

describe("selectE2e for page blocks", () => {
  it("takes a page block's own files, with its view shots, and the site", () => {
    expect(pick(["registry/blocks/login-01/components/login-form.tsx"])).toBe("login-01,site");
    expect(pick(["registry/blocks/login-01/page.tsx"])).toBe("login-01,site");
  });

  it("reaches a page block through the items it renders", () => {
    expect(pick(["registry/ui/label/label.tsx"])).toBe("label,login-01,site");
  });

  it("takes every page block and the site for the view route and the blocks spec", () => {
    expect(pick(["app/view/[block]/page.tsx"])).toBe("login-01,site");
    expect(pick(["e2e/blocks.spec.ts"])).toBe("login-01,site");
    expect(selectE2e(["app/view/[block]/view-mode.tsx"], sources()).reasons).toEqual([
      "app/view/[block]/view-mode.tsx → page blocks login-01 + site",
    ]);
  });

  it("maps a view baseline to its block", () => {
    expect(pick(["e2e/__screenshots__/linux/w360/login-01-view-dark.png"])).toBe("login-01");
  });

  it("selects nothing for the parity snapshots", () => {
    expect(
      pick(["registry/blocks/__parity__/base-nova.json", "registry/ui/__parity__/base-nova.json"]),
    ).toBe("none");
  });
});

describe("selectE2e on alias and parity diffs", () => {
  const TS = "tsconfig.json";
  const VITEST = "vitest.config.mts";
  const PARITY = "lib/registry/parity.ts";

  it("Task 73: two aliases in both configs and two parity names select those items", () => {
    const src = sources({
      [TS]: [tsconfig(), tsconfig([INPUT_ALIAS, TEXTAREA_ALIAS])],
      [VITEST]: ["before", "after"],
      [PARITY]: [parity("label"), parity("label", ["input-group", "button-group"])],
    });
    expect(pick([TS, VITEST, PARITY], src)).toBe("button-group,input,input-group,textarea");
    expect(selectE2e([TS, VITEST, PARITY], src).reasons).toEqual([
      "lib/registry/parity.ts → button-group, input-group (parity names)",
      "tsconfig.json alias → input + users input-group",
      "tsconfig.json alias → textarea + users input-group",
    ]);
  });

  it("Task 71: four parity names, and its emanata alias, select those items", () => {
    const emanata = '      "@/components/emanata": ["./registry/ui/emanata/emanata.tsx"],';
    const task71 = ["scroll-area", "spinner", "empty", "label"];
    expect(
      pick([PARITY], sources({ [PARITY]: [parity("sonner"), parity("sonner", task71)] })),
    ).toBe("empty,label,scroll-area,spinner");
    expect(pick([TS], sources({ [TS]: [tsconfig(), tsconfig([emanata])] }))).toBe("emanata,empty");
  });

  it("names blocks, an item at the components root, and a hook by its target's folder", () => {
    const aliases = [
      '      "@/components/blocks/chapter-list/chapter-list": ["./registry/blocks/chapter-list/chapter-list.tsx"],',
      '      "@/hooks/use-spread": ["./registry/blocks/spread-viewer/use-spread.ts"],',
      '      "@/components/progress": ["./registry/ui/progress/progress.tsx"],',
    ];
    expect(pick([TS], sources({ [TS]: [tsconfig(), tsconfig(aliases)] }))).toBe(
      "chapter-list,progress,spread-viewer",
    );
  });

  it("selects only the blocks appended to PARITY_BLOCKS", () => {
    // Sets the list whatever it holds today, so the test outlives the next stock block.
    const withBlocks = (source: string, names: string[]) =>
      source.replace(
        /(export const PARITY_BLOCKS = \[)[^\]]*(\] as const;)/,
        `$1${names.map((name) => `"${name}"`).join(", ")}$2`,
      );
    const blocks = (names: string[]) => withBlocks(parity("chart"), names);
    const appended = sources({
      [PARITY]: [blocks(["chapter-list"]), blocks(["chapter-list", "login-01"])],
    });
    expect(pick([PARITY], appended)).toBe("login-01");
    const both = sources({
      [PARITY]: [
        blocks(["chapter-list"]),
        withBlocks(parity("chart", ["label"]), ["chapter-list", "login-01"]),
      ],
    });
    expect(pick([PARITY], both)).toBe("label,login-01");
    const removed = sources({
      [PARITY]: [blocks(["chapter-list", "login-01"]), blocks(["login-01"])],
    });
    expect(pick([PARITY], removed)).toBe("all");
  });

  it("names a page block by its component's install path", () => {
    const form =
      '      "@/components/login-form": ["./registry/blocks/login-01/components/login-form.tsx"],';
    expect(pick([TS], sources({ [TS]: [tsconfig(), tsconfig([form])] }))).toBe("login-01");
  });

  it("still selects everything when the filter itself changes beside an alias", () => {
    const src = sources({ [TS]: [tsconfig(), tsconfig([INPUT_ALIAS])] });
    const { selection, reasons } = selectE2e([TS, "lib/e2e-filter.ts"], src);
    expect(selection).toBeUndefined();
    expect(reasons.at(-1)).toBe("lib/e2e-filter.ts → everything (every snapshot depends on it)");
  });

  it("selects everything for any other tsconfig.json change", () => {
    const cases: Record<string, [string | undefined, string | undefined]> = {
      "a compilerOptions edit": [tsconfig(), tsconfig([], (t) => t.replace("ES2017", "ES2022"))],
      "one alias plus one other line": [
        tsconfig(),
        tsconfig([INPUT_ALIAS], (t) => t.replace('"strict": true', '"strict": false')),
      ],
      "a removed alias": [tsconfig([INPUT_ALIAS]), tsconfig()],
      "an edited alias": [
        tsconfig([INPUT_ALIAS]),
        tsconfig([INPUT_ALIAS.replace("input.tsx", "index.tsx")]),
      ],
      "reordered aliases": [
        tsconfig([INPUT_ALIAS, TEXTAREA_ALIAS]),
        tsconfig([TEXTAREA_ALIAS, INPUT_ALIAS]),
      ],
      "an alias that names no item": [
        tsconfig(),
        tsconfig(['      "@/components/ui/nope": ["./registry/ui/nope/nope.tsx"],']),
      ],
      "an alias outside components": [
        tsconfig(),
        tsconfig(['      "@/lib/manga-motion": ["./registry/lib/manga-motion.ts"],']),
      ],
      "a comment (not plain JSON)": [tsconfig(), tsconfig(["      // input", INPUT_ALIAS])],
      "no content": [undefined, undefined],
    };
    for (const [name, files] of Object.entries(cases)) {
      expect(pick([TS], sources({ [TS]: files })), name).toBe("all");
    }
  });

  it("selects everything for any other parity.ts change", () => {
    const cases: Record<string, [string, string]> = {
      "a removed name": [
        parity("label"),
        parity("label", [], (n) => n.filter((x) => x !== "card")),
      ],
      "a name inserted mid-list": [
        parity("sonner"),
        parity("sonner", [], (n) => [...n.slice(0, 2), "spinner", ...n.slice(2)]),
      ],
      "a reordering": [parity("label"), parity("label", [], (n) => [...n].reverse())],
      "an append plus another line": [
        parity("sonner"),
        parity("sonner", ["spinner"]).replace("base-nova.json", "base-nova-2.json"),
      ],
      "a name that is no item": [parity("label"), parity("label", ["nope"])],
    };
    for (const [name, files] of Object.entries(cases)) {
      expect(pick([PARITY], sources({ [PARITY]: files })), name).toBe("all");
    }
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
