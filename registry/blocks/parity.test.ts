import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadRegistry } from "@/lib/registry";
import {
  BLOCK_PARITY_SNAPSHOT_PATH,
  type BlockParitySnapshot,
  compareBlockParity,
  extractBlockParityShape,
  PARITY_BLOCKS,
} from "@/lib/registry/parity";

// A block mangacn redraws from a stock base-nova block keeps stock's files (path inside the
// block and type), the page's route target, each file's exports and stock's registry
// dependencies (mangacn items by URL, more mangacn items allowed). The snapshot is refreshed
// only by `pnpm gen:parity`.
const snapshot = JSON.parse(
  readFileSync(path.resolve(BLOCK_PARITY_SNAPSHOT_PATH), "utf8"),
) as BlockParitySnapshot;
const items = new Map(loadRegistry().items.map((item) => [item.name, item]));

describe("block parity snapshot", () => {
  it(`has an entry for each of the ${PARITY_BLOCKS.length} stock-derived blocks`, () => {
    expect(Object.keys(snapshot.items).sort()).toEqual([...PARITY_BLOCKS].sort());
    expect(snapshot.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("stock-derived blocks match stock base-nova", () => {
  for (const name of PARITY_BLOCKS) {
    it(name, () => {
      const item = items.get(name);
      expect(item?.type, `${name}: not in the block catalog`).toBe("registry:block");
      const files = (item?.files ?? []).map((file) => ({
        ...file,
        content: readFileSync(path.resolve(file.path), "utf8"),
      }));
      const problems = compareBlockParity(
        snapshot.items[name],
        extractBlockParityShape(name, files, item),
      );
      expect(problems, `${name} differs from stock:\n  ${problems.join("\n  ")}`).toEqual([]);
    });
  }
});
