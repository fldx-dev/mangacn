import { describe, expect, it } from "vitest";
import { loadRegistry } from "@/lib/registry";
import { findBlockProblems } from "@/lib/registry/blocks";

// The block catalog's shape (SPEC-components-3 §3, §7); registry/ui/imports.test.ts checks what
// a block's files import, and `pnpm registry:smoke --only=<block>` that every file lands.
describe("registry/blocks/registry.json", () => {
  it("holds registry:block items, one folder each, every file with its components/blocks target", () => {
    const problems = findBlockProblems(loadRegistry());
    expect(problems, `Block catalog:\n${problems.join("\n")}`).toEqual([]);
  });
});
