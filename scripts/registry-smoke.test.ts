// @vitest-environment node
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadRegistry } from "../lib/registry/index";
import { installTarget } from "../lib/registry/install-target";
import { installedPageSource } from "../lib/registry/page-source";
import {
  EXPECTED_CONTENT,
  familyOrder,
  installFamilies,
  itemsForChangedPaths,
} from "./registry-smoke";

// The smoke's tables, without installing anything: what `--changed` selects, and that every
// file EXPECTED_CONTENT reads for a shipped source holds what it asks for (a smoke run would
// otherwise find a stale string only on main, after a 25-minute install).

const registry = loadRegistry();
const listed = registry.items.map((item) => item.name);
const hooks = registry.items
  .filter((item) => item.type === "registry:hook")
  .map((item) => ({
    name: item.name,
    // As registry/hooks/registry.json lists them: relative to the hook catalog.
    files: item.files.map((file) => ({ path: path.posix.relative("registry/hooks", file.path) })),
  }));

describe("itemsForChangedPaths", () => {
  it("maps a hook's lib file to the hook that ships it", () => {
    expect(itemsForChangedPaths(["registry/hooks/lib/highlighter.tsx"], listed, hooks)).toEqual([
      "use-highlighted-code",
    ]);
  });

  it("maps a lib file no hook ships to nothing", () => {
    expect(itemsForChangedPaths(["registry/hooks/lib/unknown.tsx"], listed, hooks)).toEqual([]);
  });

  it("still maps a hook's own file, an item's folder and a block's file", () => {
    expect(
      itemsForChangedPaths(
        [
          "registry/hooks/use-mobile.ts",
          "registry/ui/bubble/bubble.tsx",
          "registry/blocks/series-page/page.tsx",
        ],
        listed,
        hooks,
      ),
    ).toEqual(["use-mobile", "bubble", "series-page"]);
  });

  it("smokes everything when a catalog changed", () => {
    expect(itemsForChangedPaths(["registry/hooks/registry.json"], listed, hooks)).toBeUndefined();
  });
});

/** Install path → the repo file it is installed from, for every file of every catalog item. */
const sources = new Map(
  registry.items.flatMap((item) => item.files.map((file) => [installTarget(file), file.path])),
);

/**
 * What `item`'s add writes at `file`, from the repo: its own file first (variants of a family
 * share install paths), a page as the build emits it (own imports at install paths), else the
 * file of whichever item installs there. `undefined` for a file the CLI writes itself.
 */
function installedText(item: string, file: string): string | undefined {
  const entry = registry.items.find((candidate) => candidate.name === item);
  const own = entry?.files.find((candidate) => installTarget(candidate) === file);
  if (own?.type === "registry:page") return installedPageSource(item, registry);
  const source = own?.path ?? sources.get(file);
  return source && existsSync(source) ? readFileSync(source, "utf8") : undefined;
}

describe("EXPECTED_CONTENT", () => {
  it("checks both files of use-highlighted-code", () => {
    expect(EXPECTED_CONTENT["use-highlighted-code"]?.map(({ file }) => file)).toEqual([
      "hooks/use-highlighted-code.ts",
      "lib/highlighter.tsx",
    ]);
  });

  it("asks only for what the shipped sources hold", () => {
    const stale: string[] = [];
    for (const [item, files] of Object.entries(EXPECTED_CONTENT)) {
      expect(listed, `EXPECTED_CONTENT names "${item}", no catalog item`).toContain(item);
      for (const { file, attribution, includes = [] } of files) {
        // Files the CLI writes or rewrites (globals.css, layout.tsx) are checked by the smoke.
        const text = installedText(item, file);
        if (text === undefined) continue;
        for (const needle of [...(attribution ? [attribution] : []), ...includes]) {
          if (!text.includes(needle))
            stale.push(`${item}: ${file} lacks ${JSON.stringify(needle)}`);
        }
      }
    }
    expect(stale).toEqual([]);
  });
});

describe("variants of one family in the full smoke", () => {
  // SPEC-components-6 §5.1: variants share install paths, so each is installed in name order
  // and checked right after its own add; a block that declares a variant comes after them all.
  const url = (name: string) => `https://www.mangacn.com/r/${name}.json`;
  const page = (name: string, route: string, components: string[], deps: string[] = []) => ({
    name,
    type: "registry:block",
    registryDependencies: deps.map(url),
    files: [
      { path: `registry/blocks/${name}/page.tsx`, type: "registry:page", target: route },
      ...components.map((file) => ({
        path: `registry/blocks/${name}/components/${file}.tsx`,
        type: "registry:component",
        target: `@components/${file}.tsx`,
      })),
    ],
  });
  const items = [
    { name: "ink-frame", files: [{ path: "x/ink-frame.tsx", type: "registry:component" }] },
    page("library-page", "app/library/page.tsx", ["shelf"], ["sidebar-07"]),
    page("sidebar-08", "app/dashboard/page.tsx", ["app-sidebar", "nav-main"]),
    page("login-02", "app/login/page.tsx", ["login-form"]),
    page("sidebar-07", "app/dashboard/page.tsx", ["app-sidebar", "nav-main"]),
    page("login-01", "app/login/page.tsx", ["login-form"]),
    page("signup-01", "app/signup/page.tsx", ["signup-form"]),
  ];

  it("groups the items that write the same path, in name order", () => {
    expect(installFamilies(items)).toEqual([
      ["sidebar-07", "sidebar-08"],
      ["login-01", "login-02"],
    ]);
  });

  it("installs each family together in name order, and its dependents after it", () => {
    expect(
      familyOrder(
        items.map((item) => item.name),
        items,
      ),
    ).toEqual([
      "ink-frame",
      "sidebar-07",
      "sidebar-08",
      "library-page",
      "login-01",
      "login-02",
      "signup-01",
    ]);
  });

  it("leaves the order alone when no two items share a path", () => {
    const order = ["ink-frame", "library-page", "sidebar-07", "signup-01"];
    expect(
      familyOrder(
        order,
        items.filter((item) => order.includes(item.name)),
      ),
    ).toEqual(order);
  });

  it("smokes the shipped catalog's page blocks with their families in name order", () => {
    const built = registry.items.map(({ name, registryDependencies, files }) => ({
      name,
      registryDependencies,
      files,
    }));
    const order = familyOrder(
      built.map((item) => item.name),
      built,
    );
    for (const family of installFamilies(built)) {
      const at = family.map((name) => order.indexOf(name));
      expect(at).toEqual([...at].sort((a, b) => a - b));
    }
    expect(order.indexOf("library-page")).toBeGreaterThan(order.indexOf("sidebar-07"));
  });
});
