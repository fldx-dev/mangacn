import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { type LoadedRegistry, loadRegistry } from "./index";
import {
  collectPages,
  collectVariants,
  renderVariantList,
  renderVariantMap,
  renderVariantRoutes,
  VARIANT_MAP_HEADER,
  VARIANT_MAP_PATH,
} from "./variant-map";

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

/** A temp tree with `registry/ui/<item>/<item>.tsx` and the given variant files per item. */
function fixture(variants: Record<string, string[]>): { root: string; registry: LoadedRegistry } {
  const root = mkdtempSync(path.join(tmpdir(), "mangacn-variants-"));
  tempDirs.push(root);
  const items = Object.entries(variants).map(([name, files]) => {
    const dir = path.join(root, "registry", "ui", name);
    mkdirSync(path.join(dir, "variants"), { recursive: true });
    writeFileSync(path.join(dir, `${name}.tsx`), "");
    for (const file of files) writeFileSync(path.join(dir, "variants", file), "");
    return {
      name,
      type: "registry:ui",
      source: "registry/ui/registry.json",
      files: [{ path: `registry/ui/${name}/${name}.tsx`, type: "registry:ui" }],
    };
  });
  return { root, registry: { name: "fixture", homepage: "", items } };
}

describe("collectVariants", () => {
  it("lists .tsx variants sorted by item then variant, with POSIX paths", () => {
    const { root, registry } = fixture({
      zebra: ["default.tsx"],
      alpha: ["sizes.tsx", "default.tsx", "README.md", "Variants.tsx"],
    });
    expect(collectVariants(registry, root)).toEqual([
      { item: "alpha", variant: "Variants", path: "registry/ui/alpha/variants/Variants.tsx" },
      { item: "alpha", variant: "default", path: "registry/ui/alpha/variants/default.tsx" },
      { item: "alpha", variant: "sizes", path: "registry/ui/alpha/variants/sizes.tsx" },
      { item: "zebra", variant: "default", path: "registry/ui/zebra/variants/default.tsx" },
    ]);
  });

  it("skips items without files (themes, fonts)", () => {
    const { root, registry } = fixture({ alpha: ["default.tsx"] });
    registry.items.push({ name: "theme", type: "registry:theme", source: "x", files: [] });
    expect(collectVariants(registry, root).map((entry) => entry.item)).toEqual(["alpha"]);
  });

  it("skips hooks, which have no variants of their own", () => {
    const { root, registry } = fixture({ alpha: ["default.tsx"] });
    registry.items.push({
      name: "use-mobile",
      type: "registry:hook",
      source: "registry/hooks/registry.json",
      files: [{ path: "registry/hooks/use-mobile.ts", type: "registry:hook" }],
    });
    expect(collectVariants(registry, root).map((entry) => entry.item)).toEqual(["alpha"]);
  });

  it("names every item without variants/default.tsx", () => {
    const { root, registry } = fixture({ alpha: ["extra.tsx"], beta: [], gamma: ["default.tsx"] });
    rmSync(path.join(root, "registry", "ui", "beta", "variants"), { recursive: true });
    expect(() => collectVariants(registry, root)).toThrow(
      [
        "Registry items without a default variant:",
        "  alpha (expected registry/ui/alpha/variants/default.tsx)",
        "  beta (expected registry/ui/beta/variants/default.tsx)",
      ].join("\n"),
    );
  });

  it("finds a default variant for every item in the real registry", () => {
    const entries = collectVariants(loadRegistry());
    expect(entries).toContainEqual({
      item: "button",
      variant: "default",
      path: "registry/ui/button/variants/default.tsx",
    });
  });
});

describe("renderVariantMap", () => {
  it("renders the data list and lazy loaders under the header", () => {
    const source = renderVariantMap([
      { item: "a", variant: "default", path: "registry/ui/a/variants/default.tsx" },
      { item: "a", variant: "sizes", path: "registry/ui/a/variants/sizes.tsx" },
      { item: "b", variant: "default", path: "registry/theme/b/variants/default.tsx" },
    ]);
    expect(source.startsWith(`${VARIANT_MAP_HEADER}\n`)).toBe(true);
    expect(source).toContain(
      '  { item: "a", variant: "sizes", path: "registry/ui/a/variants/sizes.tsx" },',
    );
    expect(source).toContain(
      [
        '  "a": {',
        '    "default": () => import("@/registry/ui/a/variants/default"),',
        '    "sizes": () => import("@/registry/ui/a/variants/sizes"),',
        "  },",
        '  "b": {',
        '    "default": () => import("@/registry/theme/b/variants/default"),',
        "  },",
      ].join("\n"),
    );
    expect(source).not.toContain("\\");
  });

  it("renders the page blocks' routes with a lazy loader each", () => {
    const source = renderVariantMap(
      [{ item: "login", variant: "default", path: "registry/blocks/login/variants/default.tsx" }],
      [{ block: "login", path: "registry/blocks/login/page.tsx" }],
    );
    expect(source).toContain('  { block: "login", path: "registry/blocks/login/page.tsx" },');
    expect(source).toContain('  "login": () => import("@/registry/blocks/login/page"),');
  });
});

describe("renderVariantList", () => {
  it("renders the variants and page blocks as data, with no import", () => {
    const source = renderVariantList(
      [{ item: "a", variant: "default", path: "registry/ui/a/variants/default.tsx" }],
      [{ block: "login", path: "registry/blocks/login/page.tsx" }],
    );
    expect(
      source.startsWith(`${VARIANT_MAP_HEADER}
`),
    ).toBe(true);
    expect(source).toContain(
      '  { item: "a", variant: "default", path: "registry/ui/a/variants/default.tsx" },',
    );
    expect(source).toContain('  { block: "login", path: "registry/blocks/login/page.tsx" },');
    expect(source).not.toContain("import");
  });
});

describe("renderVariantRoutes", () => {
  const routes = renderVariantRoutes(
    [
      { item: "a", variant: "default", path: "registry/ui/a/variants/default.tsx" },
      { item: "a", variant: "sizes", path: "registry/ui/a/variants/sizes.tsx" },
    ],
    [{ block: "login", path: "registry/blocks/login/page.tsx" }],
  );
  const byPath = new Map(routes.map((route) => [route.path, route.source]));

  it("writes a view per page block, a gallery per item and a stage per variant", () => {
    expect([...byPath.keys()]).toEqual([
      "app/view/login/page.tsx",
      "app/gallery/a/page.tsx",
      "app/gallery/a/default/page.tsx",
      "app/gallery/a/sizes/page.tsx",
      "app/gallery/theme/specimen/page.tsx",
    ]);
  });

  it("imports each route's own module statically, never the variant map", () => {
    expect(byPath.get("app/view/login/page.tsx")).toContain(
      'import Page from "@/registry/blocks/login/page";',
    );
    expect(byPath.get("app/gallery/a/sizes/page.tsx")).toContain(
      'import Variant from "@/registry/ui/a/variants/sizes";',
    );
    expect(byPath.get("app/gallery/a/sizes/page.tsx")).toContain(
      '<VariantStage item="a" variant="sizes" component={Variant} />',
    );
    expect(byPath.get("app/gallery/a/page.tsx")).toContain('  "sizes": Variant1,');
    for (const source of byPath.values()) {
      expect(
        source.startsWith(`${VARIANT_MAP_HEADER}
`),
      ).toBe(true);
      expect(source).not.toContain("import(");
      expect(source).not.toContain("lib/registry/variants");
    }
  });

  it("refuses an item that collides with an extra stage", () => {
    expect(() =>
      renderVariantRoutes([
        { item: "theme", variant: "default", path: "registry/ui/theme/variants/default.tsx" },
      ]),
    ).toThrow(/theme/);
  });
});

describe(`${VARIANT_MAP_PATH} staleness`, () => {
  const file = path.resolve(VARIANT_MAP_PATH);
  const present = existsSync(file);

  it.skipIf(!present)("matches the filesystem (run `pnpm gen:variants`)", () => {
    const registry = loadRegistry();
    expect(readFileSync(file, "utf8")).toBe(
      renderVariantMap(collectVariants(registry), collectPages(registry)),
    );
  });

  it.skipIf(!present)("resolves each page block's route and nothing else", async () => {
    const { getPageLoader, listPages } = await import("./variants");
    expect(listPages().map((page) => page.block)).toContain("login-01");
    for (const { block } of listPages()) expect(getPageLoader(block)).toBeTypeOf("function");
    expect(getPageLoader("reader")).toBeUndefined();
    expect(getPageLoader("toString")).toBeUndefined();
  });

  it.skipIf(!present)("resolves known variants and rejects unknown ones", async () => {
    const { getVariantLoader, listVariants } = await import("./variants");
    expect(listVariants().length).toBeGreaterThan(0);
    for (const { item, variant } of listVariants()) {
      expect(getVariantLoader(item, variant)).toBeTypeOf("function");
    }
    expect(getVariantLoader("button", "nope")).toBeUndefined();
    expect(getVariantLoader("nope", "default")).toBeUndefined();
    expect(getVariantLoader("constructor", "default")).toBeUndefined();
    expect(getVariantLoader("button", "toString")).toBeUndefined();
  });

  it.skipIf(!present)("loads the button default variant", async () => {
    const { getVariantLoader } = await import("./variants");
    const mod = await getVariantLoader("button", "default")?.();
    expect(mod?.default).toBeTypeOf("function");
  });
});
