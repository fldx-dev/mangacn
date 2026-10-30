import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadRegistry } from "@/lib/registry";
import {
  compareParity,
  extractParityShape,
  PARITY_PRIMITIVES,
  PARITY_SNAPSHOT_PATH,
  type ParitySnapshot,
} from "@/lib/registry/parity";

// SPEC-components §4.1: each restyled primitive keeps stock's exports, slots, variant keys
// and dependencies. The snapshot is refreshed only by `pnpm gen:parity` (manual, network).
const snapshot = JSON.parse(
  readFileSync(path.resolve(PARITY_SNAPSHOT_PATH), "utf8"),
) as ParitySnapshot;
const items = new Map(loadRegistry().items.map((item) => [item.name, item]));

const restyled = PARITY_PRIMITIVES.filter((name) => items.get(name)?.type === "registry:ui");
const pending = PARITY_PRIMITIVES.filter((name) => !restyled.includes(name));

describe("parity snapshot", () => {
  it("has an entry for each of the 21 primitives", () => {
    expect(Object.keys(snapshot.items).sort()).toEqual([...PARITY_PRIMITIVES].sort());
    expect(snapshot.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it(`reports ${restyled.length} restyled, ${pending.length} pending`, () => {
    console.info(
      `parity: ${restyled.length} restyled, ${pending.length} pending (${pending.join(", ")})`,
    );
    expect(restyled.length + pending.length).toBe(PARITY_PRIMITIVES.length);
  });
});

describe("restyled primitives match stock base-nova", () => {
  for (const name of restyled) {
    it(name, () => {
      const item = items.get(name);
      const file = item?.files.find((entry) => entry.path.endsWith(`/${name}.tsx`));
      expect(file, `${name}: no ${name}.tsx in files[]`).toBeDefined();
      const source = readFileSync(path.resolve(file?.path ?? ""), "utf8");
      const problems = compareParity(snapshot.items[name], extractParityShape(source, item));
      expect(problems, `${name} differs from stock:\n  ${problems.join("\n  ")}`).toEqual([]);
    });
  }

  for (const name of pending) it.todo(`${name} (not restyled yet)`);
});
