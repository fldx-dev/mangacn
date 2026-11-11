import { describe, expect, it } from "vitest";
import { loadRegistry } from "@/lib/registry";
import { findHookProblems } from "@/lib/registry/hooks";

// The hook catalog's shape (SPEC-components-4 §4, §7); registry/ui/imports.test.ts checks that a
// hook imports nothing from the registry, and `pnpm registry:smoke --only=<hook>` that it lands in
// the fresh app's hooks/ folder.
describe("registry/hooks/registry.json", () => {
  it("holds registry:hook items, one file each, with its @hooks target and no registry dependency", () => {
    const problems = findHookProblems(loadRegistry());
    expect(problems, `Hook catalog:\n${problems.join("\n")}`).toEqual([]);
  });
});
