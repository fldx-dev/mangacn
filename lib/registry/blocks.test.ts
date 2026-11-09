import { describe, expect, it } from "vitest";
import { BLOCKS_CATALOG, blockTarget, findBlockProblems, isBlock } from "./blocks";
import type { LoadedRegistry, LoadedRegistryItem } from "./index";

function block(overrides: Partial<LoadedRegistryItem> = {}): LoadedRegistryItem {
  return {
    name: "chapter-list",
    type: "registry:block",
    categories: ["block"],
    registryDependencies: ["https://www.mangacn.com/r/stamp.json"],
    files: [
      {
        path: "registry/blocks/chapter-list/chapter-list.tsx",
        type: "registry:block",
        target: "@components/blocks/chapter-list/chapter-list.tsx",
      },
      {
        path: "registry/blocks/chapter-list/chapter-numeral.ts",
        type: "registry:block",
        target: "@components/blocks/chapter-list/chapter-numeral.ts",
      },
    ],
    source: BLOCKS_CATALOG,
    ...overrides,
  };
}

function registry(...items: LoadedRegistryItem[]): LoadedRegistry {
  return { name: "fixture", homepage: "", items };
}

describe("blockTarget", () => {
  it("keeps the path inside the block's folder under components/blocks/<name>/", () => {
    expect(blockTarget("chapter-list", "registry/blocks/chapter-list/chapter-list.tsx")).toBe(
      "@components/blocks/chapter-list/chapter-list.tsx",
    );
    expect(blockTarget("viewer", "registry/blocks/viewer/parts/use-spread.ts")).toBe(
      "@components/blocks/viewer/parts/use-spread.ts",
    );
  });

  it("falls back to the file name for a file outside the folder", () => {
    expect(blockTarget("viewer", "registry/ui/x/x.tsx")).toBe("@components/blocks/viewer/x.tsx");
  });
});

describe("findBlockProblems", () => {
  it("accepts a well-formed block with several files", () => {
    expect(isBlock(block())).toBe(true);
    expect(findBlockProblems(registry(block()))).toEqual([]);
  });

  it("names every broken rule", () => {
    const broken = block({
      type: "registry:component",
      categories: ["data"],
      registryDependencies: ["stamp", "https://www.mangacn.com/r/item.json"],
      files: [
        { path: "registry/blocks/chapter-list/part.tsx", type: "registry:component" },
        {
          path: "registry/blocks/other/chapter-list.tsx",
          type: "registry:block",
          target: "@/components/blocks/chapter-list/chapter-list.tsx",
        },
      ],
    });
    expect(findBlockProblems(registry(broken))).toEqual([
      'chapter-list: type is "registry:component"; expected "registry:block"',
      'chapter-list: first category is "data"; expected "block"',
      "chapter-list: the first file is registry/blocks/chapter-list/part.tsx; expected the entry registry/blocks/chapter-list/chapter-list.tsx",
      'chapter-list: registry/blocks/chapter-list/part.tsx has type "registry:component"',
      'chapter-list: registry/blocks/chapter-list/part.tsx has target undefined; expected "@components/blocks/chapter-list/part.tsx"',
      "chapter-list: registry/blocks/other/chapter-list.tsx is outside registry/blocks/chapter-list/",
      'chapter-list: registry/blocks/other/chapter-list.tsx has target "@/components/blocks/chapter-list/chapter-list.tsx"; expected "@components/blocks/chapter-list/chapter-list.tsx"',
      'chapter-list: "stamp" is not a mangacn URL (blocks declare every item by URL)',
    ]);
  });

  it("rejects a block without files and a block outside the block catalog", () => {
    expect(
      findBlockProblems(
        registry(
          block({ files: [] }),
          block({ name: "stray", source: "registry/ui/registry.json" }),
        ),
      ),
    ).toEqual([
      "chapter-list: ships no files",
      "stray: blocks belong in registry/blocks/registry.json",
    ]);
  });

  it("ignores items of other types outside the block catalog", () => {
    expect(
      findBlockProblems(
        registry(
          block({ name: "button", type: "registry:ui", source: "registry/ui/registry.json" }),
        ),
      ),
    ).toEqual([]);
  });
});
