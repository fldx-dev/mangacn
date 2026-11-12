import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import {
  aliasedBlockName,
  blockImportPaths,
  blockImportViolation,
  extractImports,
  findImportViolations,
  findRegistryDependencyProblems,
  formatImportViolations,
  hookImportViolation,
  importViolation,
  packageName,
} from "./imports";
import { loadRegistry } from "./index";

describe("extractImports", () => {
  it("finds static, side-effect, re-export, dynamic and require specifiers with lines", () => {
    const source = [
      'import * as React from "react";',
      "import Default, {",
      "  named,",
      "  type Other,",
      '} from "@/lib/utils";',
      "import type { X } from 'type-only';",
      'import "side-effect";',
      'export { a } from "./sibling";',
      'export * from "star";',
      'export type { T } from "types";',
      'const lazy = () => import("lazy");',
      'const old = require("cjs");',
      "const tpl = import(`template`);",
    ].join("\n");
    expect(extractImports(source)).toEqual([
      { specifier: "react", line: 1 },
      { specifier: "@/lib/utils", line: 5 },
      { specifier: "type-only", line: 6 },
      { specifier: "side-effect", line: 7 },
      { specifier: "./sibling", line: 8 },
      { specifier: "star", line: 9 },
      { specifier: "types", line: 10 },
      { specifier: "lazy", line: 11 },
      { specifier: "cjs", line: 12 },
      { specifier: "template", line: 13 },
    ]);
  });

  it("ignores comments and look-alikes in strings but keeps line numbers", () => {
    const source = [
      '// import x from "line-comment";',
      '/* import "block-comment";',
      '   require("still-comment") */',
      "const text = \"import y from 'in-string'\";",
      "const url = 'http://example.com'; // trailing",
      "<p>Don't import from here</p>;",
      'export const importer = 1; import { z } from "real";',
    ].join("\n");
    expect(extractImports(source)).toEqual([{ specifier: "real", line: 7 }]);
  });

  it("returns nothing for a module without imports", () => {
    expect(extractImports("export const a = 1;\n")).toEqual([]);
  });
});

describe("packageName", () => {
  it.each([
    ["react", "react"],
    ["react/jsx-runtime", "react"],
    ["@base-ui/react/popover", "@base-ui/react"],
    ["motion/react", "motion"],
    ["motion@14.7.1", "motion"],
    ["@scope/pkg@1", "@scope/pkg"],
  ])("%s → %s", (specifier, name) => {
    expect(packageName(specifier)).toBe(name);
  });
});

describe("importViolation", () => {
  const file = "registry/ui/dialog/dialog.tsx";
  const item = {
    dependencies: ["@base-ui/react", "motion@14"],
    registryDependencies: ["button", "manga-motion", "https://www.mangacn.com/r/ink-frame.json"],
    files: [
      { path: file, type: "registry:ui" },
      { path: "registry/ui/dialog/dialog-parts.tsx", type: "registry:ui" },
    ],
  };

  it.each([
    "react",
    "react-dom/client",
    "@base-ui/react/dialog",
    "motion/react",
    "@/lib/utils",
    "@/components/ui/button",
    "@/lib/manga-motion",
    "@/components/ink-frame",
    "./dialog-parts",
  ])("allows %s", (specifier) => {
    expect(importViolation(specifier, item, file)).toBeNull();
  });

  it.each([
    ["lucide-react", 'package "lucide-react" is not in this item\'s dependencies'],
    ["node:fs", 'package "node:fs" is not in this item\'s dependencies'],
    ["@/app/page", "alias import that is not @/lib/utils or a declared registryDependency"],
    ["@/lib/registry", "alias import that is not @/lib/utils or a declared registryDependency"],
    ["@/components/site-header", "alias import"],
    ["@/components/ui/card", "alias import"],
    ["@/components/ui/button/extra", "alias import"],
    ["@/components/ink-frame/extra", "alias import"],
    ["@/registry/ui/button/button", "alias import"],
    ["../button/button", "relative import outside this item"],
    ["./missing", "relative import outside this item"],
  ])("rejects %s", (specifier, reason) => {
    expect(importViolation(specifier, item, file)).toContain(reason);
  });

  it("treats missing dependency lists as empty", () => {
    expect(importViolation("cn", { files: [] }, file)).toContain("not in this item");
    expect(importViolation("@/components/ui/button", { files: [] }, file)).toContain("alias");
  });

  it("rejects ink-frame unless its mangacn URL is declared", () => {
    const undeclared = { ...item, registryDependencies: ["button"] };
    expect(importViolation("@/components/ink-frame", undeclared, file)).toContain("alias");
    const other = { ...item, registryDependencies: ["https://example.com/r/ink-frame.json"] };
    expect(importViolation("@/components/ink-frame", other, file)).toContain("alias");
  });
});

describe("blocks", () => {
  // A block's files may import only the install paths of the items it declares by URL.
  const root = mkdtempSync(path.join(tmpdir(), "mangacn-block-imports-"));
  afterAll(() => rmSync(root, { recursive: true, force: true }));
  const write = (file: string, content: string) => {
    mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    writeFileSync(path.join(root, file), content);
  };
  const url = (name: string) => `https://www.mangacn.com/r/${name}.json`;
  write(
    "registry.json",
    JSON.stringify({
      items: [
        {
          name: "separator",
          type: "registry:ui",
          files: [{ path: "separator.tsx", type: "registry:ui", target: "@ui/separator.tsx" }],
        },
        {
          name: "stamp",
          type: "registry:component",
          files: [
            { path: "stamp.tsx", type: "registry:component", target: "@components/stamp.tsx" },
          ],
        },
        { name: "manga-motion", type: "registry:lib", files: [] },
        {
          name: "shelf",
          type: "registry:block",
          dependencies: ["cn"],
          registryDependencies: [url("separator"), url("stamp")],
          files: [
            {
              path: "registry/blocks/shelf/shelf.tsx",
              type: "registry:block",
              target: "@components/blocks/shelf/shelf.tsx",
            },
            {
              path: "registry/blocks/shelf/shelf-row.tsx",
              type: "registry:block",
              target: "@components/blocks/shelf/shelf-row.tsx",
            },
          ],
        },
      ],
    }),
  );
  write("separator.tsx", "export const Separator = 1;\n");
  write("stamp.tsx", "export const Stamp = 1;\n");
  write(
    "registry/blocks/shelf/shelf.tsx",
    [
      'import * as React from "react";',
      'import { cn } from "cn";',
      'import { x } from "@/lib/utils";',
      'import { Separator } from "@/components/ui/separator";',
      'import { Stamp } from "@/components/stamp";',
      'import { Row } from "./shelf-row";',
      'import { InkFrame } from "@/components/ink-frame";',
      'import { popIn } from "@/lib/manga-motion";',
      'import { Row as Again } from "@/components/blocks/shelf/shelf-row";',
      'import { Other } from "../other/other";',
      'import { Wrong } from "@/components/ui/stamp";',
      'import { Star } from "lucide-react";',
    ].join("\n"),
  );
  write("registry/blocks/shelf/shelf-row.tsx", "export const Row = 1;\n");
  const registry = loadRegistry(path.join(root, "registry.json"));
  const catalog = new Map(registry.items.map((item) => [item.name, item]));

  it("may import the install paths of the items declared by URL, nothing else of @/", () => {
    const shelf = catalog.get("shelf");
    expect(shelf && [...blockImportPaths(shelf, catalog)]).toEqual([
      "@/components/ui/separator",
      "@/components/stamp",
    ]);
  });

  it("reports every forbidden import of a block's files and nothing allowed", () => {
    expect(
      findImportViolations(registry, root).map((v) => [v.specifier, v.line, v.reason]),
    ).toEqual([
      [
        "@/components/ink-frame",
        7,
        "alias import that is not @/lib/utils or the install path of an item this block declares by mangacn URL",
      ],
      ["@/lib/manga-motion", 8, expect.stringContaining("alias import")],
      ["@/components/blocks/shelf/shelf-row", 9, expect.stringContaining("alias import")],
      ["../other/other", 10, "relative import outside this block (import its own part files only)"],
      ["@/components/ui/stamp", 11, expect.stringContaining("alias import")],
      ["lucide-react", 12, 'package "lucide-react" is not in this item\'s dependencies'],
    ]);
  });

  it("does not take a bare stock name as a declaration", () => {
    const item = { dependencies: [], files: [] };
    const allowed = blockImportPaths({ registryDependencies: ["separator"] }, catalog);
    expect(allowed.size).toBe(0);
    expect(
      blockImportViolation("@/components/ui/separator", item, "registry/blocks/x/x.tsx", allowed),
    ).toContain("alias import");
  });
});

describe("a page block's own files", () => {
  // The page lands in app/<route>/ and its components in components/: the page imports them by
  // install path (a relative path would miss after `shadcn add`), the components each other
  // relatively (they land side by side).
  const files = [
    {
      path: "registry/blocks/login-01/page.tsx",
      type: "registry:page",
      target: "app/login/page.tsx",
    },
    {
      path: "registry/blocks/login-01/components/login-form.tsx",
      type: "registry:component",
      target: "@components/login-form.tsx",
    },
    {
      path: "registry/blocks/login-01/components/login-field.tsx",
      type: "registry:component",
      target: "@components/login-field.tsx",
    },
  ];
  const item = { dependencies: [], files };
  const none = new Set<string>();
  const [page, form] = files.map((file) => file.path);

  it("lets the page import a component by its install path, not relatively", () => {
    expect(blockImportViolation("@/components/login-form", item, page, none)).toBeNull();
    expect(blockImportViolation("./components/login-form", item, page, none)).toBe(
      "relative import that misses after install (registry/blocks/login-01/components/login-form.tsx installs to components/login-form.tsx); import @/components/login-form",
    );
  });

  it("lets components import each other relatively, not by install path", () => {
    expect(blockImportViolation("./login-field", item, form, none)).toBeNull();
    expect(blockImportViolation("@/components/login-field", item, form, none)).toContain(
      "alias import",
    );
    expect(blockImportViolation("@/components/login-form", item, form, none)).toContain(
      "alias import",
    );
  });
});

describe("a block made of blocks", () => {
  // SPEC-components-4 §3: a block may compose a block it declares by mangacn URL, importing it
  // from its install path, as it does an item. An undeclared block stays refused.
  const root = mkdtempSync(path.join(tmpdir(), "mangacn-block-blocks-"));
  afterAll(() => rmSync(root, { recursive: true, force: true }));
  const write = (file: string, content: string) => {
    mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    writeFileSync(path.join(root, file), content);
  };
  const url = (name: string) => `https://www.mangacn.com/r/${name}.json`;
  const block = (name: string, files: string[], registryDependencies: string[] = []) => ({
    name,
    type: "registry:block",
    registryDependencies,
    files: files.map((file) => ({
      path: `registry/blocks/${name}/${file}`,
      type: "registry:block",
      target: `@components/blocks/${name}/${file}`,
    })),
  });
  write(
    "registry.json",
    JSON.stringify({
      items: [
        block("viewer", ["viewer.tsx", "use-viewer.ts"]),
        block("index", ["index.tsx"]),
        block("reader", ["reader.tsx"], [url("viewer")]),
        block("shelf", ["shelf.tsx"], [url("viewer")]),
      ],
    }),
  );
  write("registry/blocks/viewer/viewer.tsx", "export const Viewer = 1;\n");
  write("registry/blocks/viewer/use-viewer.ts", "export const useViewer = 1;\n");
  write("registry/blocks/index/index.tsx", "export const Index = 1;\n");
  write(
    "registry/blocks/reader/reader.tsx",
    [
      'import { Viewer } from "@/components/blocks/viewer/viewer";',
      'import { useViewer } from "@/components/blocks/viewer/use-viewer";',
      'import { Index } from "@/components/blocks/index/index";',
    ].join("\n"),
  );
  // shelf declares viewer and never imports it.
  write("registry/blocks/shelf/shelf.tsx", "export const Shelf = 1;\n");
  const registry = loadRegistry(path.join(root, "registry.json"));
  const catalog = new Map(registry.items.map((item) => [item.name, item]));

  it("names the block a block path imports from", () => {
    expect(aliasedBlockName("@/components/blocks/spread-viewer/use-spread")).toBe("spread-viewer");
    expect(aliasedBlockName("@/components/blocks/spread-viewer")).toBeNull();
    expect(aliasedBlockName("@/components/stamp")).toBeNull();
  });

  it("allows every file of a block declared by URL, through its install path", () => {
    const reader = catalog.get("reader");
    expect(reader && [...blockImportPaths(reader, catalog)]).toEqual([
      "@/components/blocks/viewer/viewer",
      "@/components/blocks/viewer/use-viewer",
    ]);
  });

  it("refuses a block it does not declare, and nothing else", () => {
    expect(
      findImportViolations(registry, root).map((v) => [v.item, v.specifier, v.line, v.reason]),
    ).toEqual([
      [
        "reader",
        "@/components/blocks/index/index",
        3,
        "alias import that is not @/lib/utils or the install path of an item this block declares by mangacn URL",
      ],
    ]);
  });

  it("asks for the URL of an imported block and the import of a declared one", () => {
    expect(findRegistryDependencyProblems(registry, root)).toEqual([
      "reader: imports index without declaring https://www.mangacn.com/r/index.json",
      "shelf: declares https://www.mangacn.com/r/viewer.json but no shipped file imports it",
    ]);
  });
});

describe("hooks", () => {
  // A hook imports React and the platform only; an item or a block imports a hook from its
  // install path, @/hooks/<name>, only when it declares the hook by mangacn URL
  // (SPEC-components-4 §7).
  const root = mkdtempSync(path.join(tmpdir(), "mangacn-hook-imports-"));
  afterAll(() => rmSync(root, { recursive: true, force: true }));
  const write = (file: string, lines: string[]) => {
    mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    writeFileSync(path.join(root, file), `${lines.join("\n")}\n`);
  };
  const url = (name: string) => `https://www.mangacn.com/r/${name}.json`;
  const hook = (name: string) => ({
    name,
    type: "registry:hook",
    files: [{ path: `${name}.ts`, type: "registry:hook", target: `@hooks/${name}.ts` }],
  });
  write("registry/hooks/registry.json", [
    JSON.stringify({ items: [hook("use-tilt"), hook("use-pan")] }),
  ]);
  write("registry.json", [
    JSON.stringify({
      include: ["registry/hooks/registry.json"],
      items: [
        {
          name: "tilted",
          type: "registry:component",
          registryDependencies: [url("use-tilt")],
          files: [{ path: "tilted.tsx", type: "registry:component" }],
        },
        {
          name: "bare",
          type: "registry:component",
          registryDependencies: ["use-tilt"],
          files: [{ path: "bare.tsx", type: "registry:component" }],
        },
        {
          name: "shelf",
          type: "registry:block",
          registryDependencies: [url("use-tilt")],
          files: [
            {
              path: "registry/blocks/shelf/shelf.tsx",
              type: "registry:block",
              target: "@components/blocks/shelf/shelf.tsx",
            },
          ],
        },
      ],
    }),
  ]);
  write("registry/hooks/use-tilt.ts", [
    'import * as React from "react";',
    'import { flushSync } from "react-dom";',
    'import { cn } from "@/lib/utils";',
    'import { usePan } from "@/hooks/use-pan";',
    'import { InkFrame } from "@/components/ink-frame";',
    'import { clamp } from "./clamp";',
    'import { motion } from "motion/react";',
  ]);
  write("registry/hooks/use-pan.ts", ['import { useState } from "react";']);
  write("tilted.tsx", ['import { useTilt } from "@/hooks/use-tilt";']);
  const both = [
    'import { useTilt } from "@/hooks/use-tilt";',
    'import { usePan } from "@/hooks/use-pan";',
  ];
  write("bare.tsx", both);
  write("registry/blocks/shelf/shelf.tsx", both);
  const registry = loadRegistry(path.join(root, "registry.json"));

  it.each(["react", "react/jsx-runtime", "react-dom"])("a hook may import %s", (specifier) => {
    expect(hookImportViolation(specifier)).toBeNull();
  });

  it.each(["@/lib/utils", "@/hooks/use-pan", "@/components/ink-frame", "./clamp", "cn", "node:fs"])(
    "a hook may not import %s",
    (specifier) => {
      expect(hookImportViolation(specifier)).toBe(
        "a hook imports React and the platform only (no registry item, package or other file)",
      );
    },
  );

  it("lets an item import a hook it declares by URL, not by bare name or undeclared", () => {
    const file = "registry/ui/x/x.tsx";
    const byUrl = { registryDependencies: [url("use-tilt")], files: [] };
    const bare = { registryDependencies: ["use-tilt"], files: [] };
    const reason = "hook import that is not a hook this item declares by mangacn URL";
    expect(importViolation("@/hooks/use-tilt", byUrl, file)).toBeNull();
    expect(importViolation("@/hooks/use-pan", byUrl, file)).toBe(reason);
    expect(importViolation("@/hooks/use-tilt/extra", byUrl, file)).toBe(reason);
    expect(importViolation("@/hooks/use-tilt", bare, file)).toBe(reason);
  });

  it("lets a block import a hook it declares by URL, through its install path", () => {
    const catalog = new Map(registry.items.map((item) => [item.name, item]));
    const shelf = catalog.get("shelf");
    expect(shelf && [...blockImportPaths(shelf, catalog)]).toEqual(["@/hooks/use-tilt"]);
  });

  it("reports every forbidden import of hooks, items and blocks, and nothing allowed", () => {
    expect(findImportViolations(registry, root).map((v) => [v.item, v.specifier, v.line])).toEqual([
      ["bare", "@/hooks/use-tilt", 1],
      ["bare", "@/hooks/use-pan", 2],
      ["shelf", "@/hooks/use-pan", 2],
      ["use-tilt", "@/lib/utils", 3],
      ["use-tilt", "@/hooks/use-pan", 4],
      ["use-tilt", "@/components/ink-frame", 5],
      ["use-tilt", "./clamp", 6],
      ["use-tilt", "motion/react", 7],
    ]);
  });

  it("asks for the URL of every hook imported or declared by bare name", () => {
    expect(findRegistryDependencyProblems(registry, root)).toEqual([
      `bare: "use-tilt" resolves to shadcn's registry; declare ${url("use-tilt")}`,
      `bare: imports use-tilt without declaring ${url("use-tilt")}`,
      `bare: imports use-pan without declaring ${url("use-pan")}`,
      `shelf: imports use-pan without declaring ${url("use-pan")}`,
      `use-tilt: imports use-pan without declaring ${url("use-pan")}`,
    ]);
  });
});

describe("bad-import fixture", () => {
  const fixture = path.resolve("lib/registry/__fixtures__/bad-import/registry.json");
  const violations = findImportViolations(loadRegistry(fixture), path.dirname(fixture));

  it("reports every forbidden import and nothing allowed", () => {
    expect(violations.map((v) => [v.specifier, v.line])).toEqual([
      ["@/app/page", 3],
      ["@/lib/registry", 7],
      ["../../../../../registry/ui/button/button", 8],
      ["@base-ui/react/popover", 10],
    ]);
  });

  it("names the file and the specifier in the failure message", () => {
    const message = formatImportViolations(violations);
    expect(message).toContain(
      'bad-import/bad-import.ts:3 imports "@/app/page" (bad-import): alias import',
    );
    expect(message).toContain(
      'bad-import/bad-import.ts:10 imports "@base-ui/react/popover" (bad-import): package "@base-ui/react"',
    );
    expect(message.split("\n")).toHaveLength(4);
  });
});

describe("findRegistryDependencyProblems", () => {
  const fixture = path.resolve("lib/registry/__fixtures__/bad-deps/registry.json");
  const problems = findRegistryDependencyProblems(loadRegistry(fixture), path.dirname(fixture));

  it("accepts stock names, imported mangacn URLs and non-code URLs (theme → font)", () => {
    expect(problems.filter((p) => /^(ink-frame|font-display|theme|framed):/.test(p))).toEqual([]);
  });

  it("pairs a restyled primitive's URL with its @/components/ui/<item> import", () => {
    // restyled declares https://www.mangacn.com/r/button.json and imports @/components/ui/button.
    expect(problems.filter((p) => /^(button|restyled):/.test(p))).toEqual([]);
  });

  it("reports undeclared, unused, bare, namespaced, foreign and unknown dependencies", () => {
    expect(problems).toEqual([
      "undeclared: imports ink-frame without declaring https://www.mangacn.com/r/ink-frame.json",
      "unused: declares https://www.mangacn.com/r/ink-frame.json but no shipped file imports it",
      `bare: "ink-frame" resolves to shadcn's registry; declare https://www.mangacn.com/r/ink-frame.json`,
      "bare: imports ink-frame without declaring https://www.mangacn.com/r/ink-frame.json",
      'elsewhere: "@mangacn/ink-frame" is namespaced; declare https://www.mangacn.com/r/ink-frame.json',
      'elsewhere: "https://example.com/r/ink-frame.json" is not a stock name or https://www.mangacn.com/r/<name>.json',
      'elsewhere: "https://www.mangacn.com/r/missing.json" names no item in the catalog',
    ]);
  });
});
