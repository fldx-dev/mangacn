import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadRegistry } from "./registry";
import { SHOWCASE } from "./showcase";

describe("showcase", () => {
  const names = new Set(loadRegistry().items.map((item) => item.name));

  it("names only registry items", () => {
    const unknown = SHOWCASE.flatMap((example) =>
      example.items.filter((name) => !names.has(name)).map((name) => `${example.id}: ${name}`),
    );
    expect(unknown).toEqual([]);
  });

  it("has a screenshot under 300 KB for every example", () => {
    for (const example of SHOWCASE) {
      const file = path.join("public", example.screenshot);
      expect(existsSync(file), file).toBe(true);
      expect(statSync(file).size, file).toBeLessThan(300 * 1024);
    }
  });

  it("links every example to its folder in the showcase repo", () => {
    for (const example of SHOWCASE) {
      expect(example.sourceUrl).toBe(
        `https://github.com/fldx-dev/mangacn-showcase/tree/main/${example.id}`,
      );
    }
  });
});
