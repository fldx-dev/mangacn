import { describe, expect, it } from "vitest";
import {
  BLOCK_GROUPS,
  BLOCKS_CATALOG,
  blockGroup,
  blockTarget,
  EXAMPLES_GROUP,
  examplePageTarget,
  examplePageUrl,
  findBlockProblems,
  groupBlocks,
  installPageSource,
  isBlock,
  isPageBlock,
  pageComponentTarget,
  pageFile,
  type StockFamily,
} from "./blocks";
import { extractImportOffsets } from "./imports";
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
        target: "app/(mangacn-examples)/examples/login-01/page.tsx",
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
    expect(pageFile(pageBlock())?.target).toBe("app/(mangacn-examples)/examples/login-01/page.tsx");
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

  it("need their example route under the (mangacn-examples) group", () => {
    const [page, form] = pageBlock().files;
    const expected = '"app/(mangacn-examples)/examples/login-01/page.tsx"';
    for (const target of [
      "@components/page.tsx",
      "app/login/page.tsx",
      "app/(mangacn-examples)/login/page.tsx",
      "app/(mangacn-examples)/examples/login-02/page.tsx",
    ]) {
      const wrong = pageBlock({ files: [{ ...page, target }, form] });
      expect(findBlockProblems(registry(wrong))).toEqual([
        `login-01: registry/blocks/login-01/page.tsx has target "${target}"; expected ${expected}`,
      ]);
    }
  });

  it("install their route at /examples/<name>, inside the one route group", () => {
    expect(EXAMPLES_GROUP).toBe("(mangacn-examples)");
    expect(examplePageTarget("sidebar-07")).toBe(
      "app/(mangacn-examples)/examples/sidebar-07/page.tsx",
    );
    expect(examplePageUrl("sidebar-07")).toBe("/examples/sidebar-07");
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
    // In either order: the item's file is refused even when the block comes first.
    expect(findBlockProblems(registry(clash, stamp))).toEqual([
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

describe("variants of one stock family (SPEC-components-6 §5.1)", () => {
  // login-01 and login-02 both install stock's `components/login-form.tsx`: alternatives, as in
  // stock. Their routes are their own (`examples/login-0N`). Anything else stays refused.
  const variant = (name: string) =>
    pageBlock({
      name,
      files: [
        {
          path: `registry/blocks/${name}/page.tsx`,
          type: "registry:page",
          target: examplePageTarget(name),
        },
        {
          path: `registry/blocks/${name}/components/login-form.tsx`,
          type: "registry:component",
          target: "@components/login-form.tsx",
        },
      ],
    });
  const stockLogin = {
    files: [
      { path: "components/login-form.tsx", type: "registry:component", exports: ["LoginForm"] },
      {
        path: "page.tsx",
        type: "registry:page",
        target: "app/login/page.tsx",
        exports: ["default"],
      },
    ],
  };
  const family: StockFamily = {
    blocks: ["login-01", "login-02"],
    stock: { "login-01": stockLogin, "login-02": stockLogin },
  };

  it("lets two stock family variants share the paths stock's files share", () => {
    expect(findBlockProblems(registry(variant("login-01"), variant("login-02")), family)).toEqual(
      [],
    );
  });

  it("refuses a shared path between a variant and a block outside PARITY_BLOCKS", () => {
    expect(findBlockProblems(registry(variant("login-01"), variant("login-09")), family)).toEqual([
      "login-09: registry/blocks/login-09/components/login-form.tsx installs to components/login-form.tsx, as a file of login-01 does",
    ]);
  });

  it("refuses a shared path stock's own files do not share", () => {
    const narrow: StockFamily = {
      blocks: family.blocks,
      stock: { ...family.stock, "login-02": { files: [stockLogin.files[1]] } },
    };
    expect(findBlockProblems(registry(variant("login-01"), variant("login-02")), narrow)).toEqual([
      "login-02: registry/blocks/login-02/components/login-form.tsx installs to components/login-form.tsx, as a file of login-01 does",
    ]);
  });

  it("checks a third block against every owner of a shared path, not only the first", () => {
    const three: StockFamily = {
      blocks: ["login-01", "login-02", "login-03"],
      stock: { "login-01": stockLogin, "login-02": stockLogin, "login-03": stockLogin },
    };
    // Allowed with both owners: no problem.
    expect(
      findBlockProblems(
        registry(variant("login-01"), variant("login-02"), variant("login-03")),
        three,
      ),
    ).toEqual([]);
    // Allowed with neither: refused against each owner, not only login-01.
    expect(
      findBlockProblems(
        registry(variant("login-01"), variant("login-02"), variant("login-09")),
        three,
      ),
    ).toEqual([
      "login-09: registry/blocks/login-09/components/login-form.tsx installs to components/login-form.tsx, as a file of login-01 does",
      "login-09: registry/blocks/login-09/components/login-form.tsx installs to components/login-form.tsx, as a file of login-02 does",
    ]);
    // Allowed with the first owner only (stock's login-02 has no login form): refused against
    // the second, which checking only the first owner missed.
    const narrow: StockFamily = {
      blocks: three.blocks,
      stock: { ...three.stock, "login-02": { files: [stockLogin.files[1]] } },
    };
    expect(
      findBlockProblems(
        registry(variant("login-01"), variant("login-02"), variant("login-03")),
        narrow,
      ),
    ).toEqual([
      "login-02: registry/blocks/login-02/components/login-form.tsx installs to components/login-form.tsx, as a file of login-01 does",
      "login-03: registry/blocks/login-03/components/login-form.tsx installs to components/login-form.tsx, as a file of login-02 does",
    ]);
  });

  it("refuses a variant's file over an item's that is not a block", () => {
    const loginForm: LoadedRegistryItem = {
      name: "login-form",
      type: "registry:component",
      files: [
        {
          path: "registry/ui/login-form/login-form.tsx",
          type: "registry:component",
          target: "@components/login-form.tsx",
        },
      ],
      source: "registry/ui/registry.json",
    };
    expect(findBlockProblems(registry(loginForm, variant("login-01")), family)).toEqual([
      "login-01: registry/blocks/login-01/components/login-form.tsx installs to components/login-form.tsx, as a file of login-form does",
    ]);
  });
});

describe("installPageSource", () => {
  const item = pageBlock({
    files: [
      ...pageBlock().files,
      {
        path: "registry/blocks/login-01/components/nav-main.tsx",
        type: "registry:component",
        target: "@components/nav-main.tsx",
      },
    ],
  });
  const rewrite = (source: string, of: Parameters<typeof installPageSource>[1] = item) =>
    installPageSource(source, of, extractImportOffsets(source));

  it("turns a page's ./components/<file> imports into @/components/<file>", () => {
    expect(
      rewrite(
        [
          'import { LoginForm } from "./components/login-form";',
          "import { NavMain } from './components/nav-main';",
          "",
        ].join("\n"),
      ),
    ).toBe(
      [
        'import { LoginForm } from "@/components/login-form";',
        "import { NavMain } from '@/components/nav-main';",
        "",
      ].join("\n"),
    );
  });

  it("leaves every other import, comment and string alone", () => {
    const source = [
      'import * as React from "react";',
      'import { Button } from "@/components/ui/button";',
      'import { Missing } from "./components/missing";',
      'import { Deep } from "./components/parts/deep";',
      "// ./components/login-form",
      'const label = "./components/login-form";',
      "",
    ].join("\n");
    expect(rewrite(source)).toBe(source);
  });

  it("leaves a component file's relative imports alone (they install side by side)", () => {
    const form = pageBlock({
      files: [
        {
          path: "registry/blocks/login-01/components/login-form.tsx",
          type: "registry:component",
          target: "@components/login-form.tsx",
        },
      ],
    });
    const source = 'import { NavMain } from "./components/nav-main";\n';
    expect(rewrite(source, form)).toBe(source);
  });
});

describe("block groups (SPEC-components-6 §6)", () => {
  const named = (...names: string[]) => names.map((name) => ({ name }));

  it("puts a stock block in its family's group by name, anything else in Manga", () => {
    expect(blockGroup("login-05")).toBe("login");
    expect(blockGroup("signup-01")).toBe("signup");
    expect(blockGroup("sidebar-16")).toBe("sidebar");
    expect(blockGroup("settings-01")).toBe("app");
    expect(blockGroup("file-manager-01")).toBe("app");
    expect(blockGroup("chapter-list")).toBe("manga");
    expect(blockGroup("library-page")).toBe("manga");
  });

  it("orders the groups Manga, App, Login, Signup, Sidebar: Manga as given, a family by number", () => {
    const groups = groupBlocks(
      named(
        "sidebar-10",
        "reader",
        "upload-01",
        "login-01",
        "settings-02",
        "sidebar-07",
        "chapter-list",
        "settings-01",
        "sidebar-02",
      ),
    );
    expect(
      groups.map(({ id, label, items }) => [id, label, items.map((item) => item.name)]),
    ).toEqual([
      ["manga", "Manga", ["reader", "chapter-list"]],
      ["app", "App", ["upload-01", "settings-01", "settings-02"]],
      ["login", "Login", ["login-01"]],
      ["sidebar", "Sidebar", ["sidebar-02", "sidebar-07", "sidebar-10"]],
    ]);
    expect(BLOCK_GROUPS.map((group) => group.label)).toEqual([
      "Manga",
      "App",
      "Login",
      "Signup",
      "Sidebar",
    ]);
  });

  it("leaves out a group with no blocks, App included", () => {
    expect(groupBlocks(named("reader", "login-01")).map((group) => group.id)).toEqual([
      "manga",
      "login",
    ]);
  });

  it("names a family with no group instead of filing it under Manga", () => {
    expect(() => groupBlocks(named("dashboard-01"))).toThrow(
      /"dashboard" family, which has no group/,
    );
    expect(() => blockGroup("file-browser-01")).toThrow(/"file-browser" family/);
  });
});
