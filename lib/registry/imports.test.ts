import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  extractImports,
  findImportViolations,
  findRegistryDependencyProblems,
  formatImportViolations,
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
