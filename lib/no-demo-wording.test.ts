import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Since batch 10 the word is "variant" for one file, item or card, and "gallery" for the page
// that lists them all (SPEC-components-10 §6). "Demo" is gone from code, files, routes and copy.
const PATTERN = /demo(?!graphic)/i;

// Files that must keep the word: the lockfile's hashes, the redirects from the old routes, and
// the checks that reject it (this test, and the variant label check and its test).
const ALLOWED: ReadonlySet<string> = new Set([
  "pnpm-lock.yaml",
  "next.config.ts",
  "lib/no-demo-wording.test.ts",
  "lib/registry/variant-items.ts",
  "lib/registry/variant-items.test.ts",
]);

const BINARY = /\.(png|ico|jpe?g|webp|gif|woff2?|ttf|otf)$/i;

describe("no demo wording", () => {
  it("leaves no tracked path or text file saying demo", () => {
    const files = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" })
      .split("\0")
      .filter(Boolean);
    const hits: string[] = [];
    for (const file of files) {
      if (ALLOWED.has(file)) continue;
      if (PATTERN.test(file)) {
        hits.push(file);
        continue;
      }
      if (BINARY.test(file)) continue;
      let text: string;
      try {
        text = readFileSync(file, "utf8");
      } catch {
        continue; // deleted in the working tree, not yet staged
      }
      const lines = text.split("\n");
      lines.forEach((line, index) => {
        if (PATTERN.test(line)) hits.push(`${file}:${index + 1}`);
      });
    }
    expect(hits).toEqual([]);
  });
});
