import { describe, expect, it } from "vitest";
import {
  BLOCKS_CATALOG,
  blockTarget,
  findBlockProblems,
  isBlock,
  isPageBlock,
  pageComponentTarget,
  pageFile,
} from "./blocks";
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

/** A page block as stock's login-01 ships: the route first, then its components. */
function pageBlock(overrides: Partial<LoadedRegistryItem> = {}): LoadedRegistryItem {
  return block({
    name: "login-01",
    registryDependencies: ["https://www.mangacn.com/r/card.json"],
    files: [
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
    ],
    ...overrides,
  });
}

describe("page blocks", () => {
  it("are blocks with a registry:page file, which pageFile returns", () => {
    expect(isPageBlock(pageBlock())).toBe(true);
    expect(pageFile(pageBlock())?.target).toBe("app/login/page.tsx");
    expect(isPageBlock(block())).toBe(false);
    expect(pageFile(block())).toBeUndefined();
  });

  it("put their components where stock's untargeted registry:component lands", () => {
    expect(
      pageComponentTarget("login-01", "registry/blocks/login-01/components/login-form.tsx"),
    ).toBe("@components/login-form.tsx");
    expect(
      pageComponentTarget("sidebar-07", "registry/blocks/sidebar-07/components/nav/nav-user.tsx"),
    ).toBe("@components/nav/nav-user.tsx");
  });

  it("accept the route first and components in components/", () => {
    expect(findBlockProblems(registry(pageBlock()))).toEqual([]);
  });

  it("name every broken rule of a page block", () => {
    const broken = pageBlock({
      files: [
        {
          path: "registry/blocks/login-01/components/login-form.tsx",
          type: "registry:component",
          target: "@components/login-form.tsx",
        },
        { path: "registry/blocks/login-01/page.tsx", type: "registry:page", target: "login.tsx" },
        {
          path: "registry/blocks/login-01/login-form.tsx",
          type: "registry:component",
          target: "@components/login-form.tsx",
        },
        {
          path: "registry/blocks/login-01/components/field.tsx",
          type: "registry:block",
          target: "@components/blocks/login-01/field.tsx",
        },
      ],
    });
    expect(findBlockProblems(registry(broken))).toEqual([
      "login-01: the first file is registry/blocks/login-01/components/login-form.tsx (registry:component); expected registry/blocks/login-01/page.tsx (registry:page)",
      "login-01: registry/blocks/login-01/page.tsx is outside registry/blocks/login-01/components/ (a page block's other files are its components)",
      "login-01: registry/blocks/login-01/login-form.tsx is outside registry/blocks/login-01/components/ (a page block's other files are its components)",
      'login-01: registry/blocks/login-01/components/field.tsx has type "registry:block"',
      'login-01: registry/blocks/login-01/components/field.tsx has target "@components/blocks/login-01/field.tsx"; expected "@components/field.tsx"',
    ]);
  });

  it("need an app/<route>/page.tsx target", () => {
    const [page, form] = pageBlock().files;
    const wrong = pageBlock({ files: [{ ...page, target: "@components/page.tsx" }, form] });
    expect(findBlockProblems(registry(wrong))).toEqual([
      'login-01: registry/blocks/login-01/page.tsx has target "@components/page.tsx"; expected app/<route>/page.tsx',
    ]);
  });
});

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

  it("refuses a block file that installs over another item's file", () => {
    const stamp: LoadedRegistryItem = {
      name: "stamp",
      type: "registry:component",
      files: [
        {
          path: "registry/ui/stamp/stamp.tsx",
          type: "registry:component",
          target: "@components/stamp.tsx",
        },
      ],
      source: "registry/ui/registry.json",
    };
    const clash = pageBlock({
      files: [
        pageBlock().files[0],
        {
          path: "registry/blocks/login-01/components/stamp.tsx",
          type: "registry:component",
          target: "@components/stamp.tsx",
        },
      ],
    });
    expect(findBlockProblems(registry(stamp, clash))).toEqual([
      "login-01: registry/blocks/login-01/components/stamp.tsx installs to components/stamp.tsx, as a file of stamp does",
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
