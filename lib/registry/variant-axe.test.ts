import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadRegistry } from "./index";
import { collectVariants } from "./variant-map";

// The variant map lists every variant (collectVariants is what `pnpm gen:variants` writes); each item
// folder with variants must hold a test that runs axe on all of them through lib/test/axe.ts.
const CALL = 'expectVariantsAccessible(import.meta.glob("./variants/*.tsx")';

describe("axe coverage of the variant map", () => {
  it("has a test calling expectVariantsAccessible beside every item with variants", () => {
    const entries = collectVariants(loadRegistry());
    const folders = [
      ...new Set(entries.map((entry) => path.posix.dirname(path.posix.dirname(entry.path)))),
    ];
    const uncovered = folders.filter((folder) => {
      const tests = readdirSync(folder).filter((file) => /\.test\.tsx?$/.test(file));
      return !tests.some((file) => readFileSync(path.join(folder, file), "utf8").includes(CALL));
    });
    expect(folders.length).toBeGreaterThan(0);
    expect(uncovered, `item folders with variants but no ${CALL})`).toEqual([]);
  });
});
