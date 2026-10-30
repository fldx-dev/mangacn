import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { collectDemos, DEMO_MAP_HEADER, DEMO_MAP_PATH, renderDemoMap } from "./demo-map";
import { type LoadedRegistry, loadRegistry } from "./index";

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

/** A temp tree with `registry/ui/<item>/<item>.tsx` and the given demo files per item. */
function fixture(demos: Record<string, string[]>): { root: string; registry: LoadedRegistry } {
  const root = mkdtempSync(path.join(tmpdir(), "mangacn-demos-"));
  tempDirs.push(root);
  const items = Object.entries(demos).map(([name, files]) => {
    const dir = path.join(root, "registry", "ui", name);
    mkdirSync(path.join(dir, "demos"), { recursive: true });
    writeFileSync(path.join(dir, `${name}.tsx`), "");
    for (const file of files) writeFileSync(path.join(dir, "demos", file), "");
    return {
      name,
      type: "registry:ui",
      source: "registry/ui/registry.json",
      files: [{ path: `registry/ui/${name}/${name}.tsx`, type: "registry:ui" }],
    };
  });
  return { root, registry: { name: "fixture", homepage: "", items } };
}

describe("collectDemos", () => {
  it("lists .tsx demos sorted by item then demo, with POSIX paths", () => {
    const { root, registry } = fixture({
      zebra: ["default.tsx"],
      alpha: ["sizes.tsx", "default.tsx", "README.md", "Variants.tsx"],
    });
    expect(collectDemos(registry, root)).toEqual([
      { item: "alpha", demo: "Variants", path: "registry/ui/alpha/demos/Variants.tsx" },
      { item: "alpha", demo: "default", path: "registry/ui/alpha/demos/default.tsx" },
      { item: "alpha", demo: "sizes", path: "registry/ui/alpha/demos/sizes.tsx" },
      { item: "zebra", demo: "default", path: "registry/ui/zebra/demos/default.tsx" },
    ]);
  });

  it("skips items without files (themes, fonts)", () => {
    const { root, registry } = fixture({ alpha: ["default.tsx"] });
    registry.items.push({ name: "theme", type: "registry:theme", source: "x", files: [] });
    expect(collectDemos(registry, root).map((entry) => entry.item)).toEqual(["alpha"]);
  });

  it("names every item without demos/default.tsx", () => {
    const { root, registry } = fixture({ alpha: ["extra.tsx"], beta: [], gamma: ["default.tsx"] });
    rmSync(path.join(root, "registry", "ui", "beta", "demos"), { recursive: true });
    expect(() => collectDemos(registry, root)).toThrow(
      [
        "Registry items without a default demo:",
        "  alpha (expected registry/ui/alpha/demos/default.tsx)",
        "  beta (expected registry/ui/beta/demos/default.tsx)",
      ].join("\n"),
    );
  });

  it("finds a default demo for every item in the real registry", () => {
    const entries = collectDemos(loadRegistry());
    expect(entries).toContainEqual({
      item: "button",
      demo: "default",
      path: "registry/ui/button/demos/default.tsx",
    });
  });
});

describe("renderDemoMap", () => {
  it("renders the data list and lazy loaders under the header", () => {
    const source = renderDemoMap([
      { item: "a", demo: "default", path: "registry/ui/a/demos/default.tsx" },
      { item: "a", demo: "sizes", path: "registry/ui/a/demos/sizes.tsx" },
      { item: "b", demo: "default", path: "registry/theme/b/demos/default.tsx" },
    ]);
    expect(source.startsWith(`${DEMO_MAP_HEADER}\n`)).toBe(true);
    expect(source).toContain(
      '  { item: "a", demo: "sizes", path: "registry/ui/a/demos/sizes.tsx" },',
    );
    expect(source).toContain(
      [
        '  "a": {',
        '    "default": () => import("@/registry/ui/a/demos/default"),',
        '    "sizes": () => import("@/registry/ui/a/demos/sizes"),',
        "  },",
        '  "b": {',
        '    "default": () => import("@/registry/theme/b/demos/default"),',
        "  },",
      ].join("\n"),
    );
    expect(source).not.toContain("\\");
  });
});

describe(`${DEMO_MAP_PATH} staleness`, () => {
  const file = path.resolve(DEMO_MAP_PATH);
  const present = existsSync(file);

  it.skipIf(!present)("matches the filesystem (run `pnpm gen:demos`)", () => {
    expect(readFileSync(file, "utf8")).toBe(renderDemoMap(collectDemos(loadRegistry())));
  });

  it.skipIf(!present)("resolves known demos and rejects unknown ones", async () => {
    const { getDemoLoader, listDemos } = await import("./demos");
    expect(listDemos().length).toBeGreaterThan(0);
    for (const { item, demo } of listDemos()) {
      expect(getDemoLoader(item, demo)).toBeTypeOf("function");
    }
    expect(getDemoLoader("button", "nope")).toBeUndefined();
    expect(getDemoLoader("nope", "default")).toBeUndefined();
    expect(getDemoLoader("constructor", "default")).toBeUndefined();
    expect(getDemoLoader("button", "toString")).toBeUndefined();
  });

  it.skipIf(!present)("loads the button default demo", async () => {
    const { getDemoLoader } = await import("./demos");
    const mod = await getDemoLoader("button", "default")?.();
    expect(mod?.default).toBeTypeOf("function");
  });
});
