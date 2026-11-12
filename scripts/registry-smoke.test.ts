// @vitest-environment node
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadRegistry } from "../lib/registry/index";
import { installTarget } from "../lib/registry/install-target";
import { EXPECTED_CONTENT, itemsForChangedPaths } from "./registry-smoke";

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
        const source = sources.get(file);
        // Files the CLI writes or rewrites (globals.css, layout.tsx) are checked by the smoke.
        if (!source || !existsSync(source)) continue;
        const text = readFileSync(source, "utf8");
        for (const needle of [...(attribution ? [attribution] : []), ...includes]) {
          if (!text.includes(needle))
            stale.push(`${item}: ${source} lacks ${JSON.stringify(needle)}`);
        }
      }
    }
    expect(stale).toEqual([]);
  });
});
