// @vitest-environment node
import { describe, expect, it } from "vitest";
import { failedTestFiles, mergeMessage, parseArgs } from "./land";

describe("loop:land", () => {
  it("parses its arguments", () => {
    expect(parseArgs(["feat/x", "Merge branch 'feat/x': a thing"])).toEqual({
      mode: "land",
      branch: "feat/x",
      subject: "Merge branch 'feat/x': a thing",
      dryRun: false,
    });
    expect(parseArgs(["feat/x", "S", "--dry-run"])).toMatchObject({ dryRun: true });
    expect(parseArgs(["--check"])).toEqual({ mode: "check", dryRun: false });
    expect(parseArgs(["--check", "--dry-run"])).toEqual({ mode: "check", dryRun: true });
    expect(parseArgs(["feat/x"])).toMatch(/^usage/);
    expect(parseArgs(["origin/feat/x", "S"])).toMatch(/without "origin\/"/);
    expect(parseArgs(["--check", "extra"])).toMatch(/no arguments/);
  });

  it("takes the trailer from the environment, never from the script", () => {
    expect(mergeMessage("Subject", undefined)).toBe("Subject\n");
    expect(mergeMessage("Subject", "  ")).toBe("Subject\n");
    expect(mergeMessage("Subject", "Co-Authored-By: A <a@example.invalid>")).toBe(
      "Subject\n\nCo-Authored-By: A <a@example.invalid>\n",
    );
  });

  it("finds the failed test files in Vitest's output", () => {
    const log = [
      " ✓ lib/docs/llms.test.ts (12 tests) 80ms",
      " FAIL  registry/ui/chart/chart.test.tsx > Chart > renders",
      " FAIL  lib/mcp/tools.test.ts [ lib/mcp/tools.test.ts ]",
      " FAIL  registry/ui/chart/chart.test.tsx > Chart > axe",
      " Test Files  2 failed | 1 passed (3)",
    ].join("\n");
    expect(failedTestFiles(log)).toEqual([
      "lib/mcp/tools.test.ts",
      "registry/ui/chart/chart.test.tsx",
    ]);
  });
});
