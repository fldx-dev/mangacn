import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { collectDemos } from "./demo-map";
import { loadRegistry } from "./index";

// The demo map lists every demo (collectDemos is what `pnpm gen:demos` writes); each item
// folder with demos must hold a test that runs axe on all of them through lib/test/axe.ts.
const CALL = 'expectDemosAccessible(import.meta.glob("./demos/*.tsx")';

describe("axe coverage of the demo map", () => {
  it("has a test calling expectDemosAccessible beside every item with demos", () => {
    const entries = collectDemos(loadRegistry());
    const folders = [
      ...new Set(entries.map((entry) => path.posix.dirname(path.posix.dirname(entry.path)))),
    ];
    const uncovered = folders.filter((folder) => {
      const tests = readdirSync(folder).filter((file) => /\.test\.tsx?$/.test(file));
      return !tests.some((file) => readFileSync(path.join(folder, file), "utf8").includes(CALL));
    });
    expect(folders.length).toBeGreaterThan(0);
    expect(uncovered, `item folders with demos but no ${CALL})`).toEqual([]);
  });
});
