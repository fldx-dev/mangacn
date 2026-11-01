import { describe, expect, it } from "vitest";
import { loadRegistry } from "@/lib/registry";
import {
  findImportViolations,
  findRegistryDependencyProblems,
  formatImportViolations,
} from "@/lib/registry/imports";

// SPEC-registry-core §6.5 over every file every catalog ships (theme, ui, blocks).
const registry = loadRegistry();

describe("shipped files", () => {
  it("import only react, declared dependencies, @/lib/utils and declared registry items", () => {
    const violations = findImportViolations(registry);
    expect(violations, `Forbidden imports:\n${formatImportViolations(violations)}`).toEqual([]);
  });

  it("declare every mangacn item they import by URL, and import every one they declare", () => {
    // One `shadcn add @mangacn/<item>` then installs ink-frame too (SPEC-components §4.4).
    const problems = findRegistryDependencyProblems(registry);
    expect(problems, `registryDependencies:\n${problems.join("\n")}`).toEqual([]);
  });

  it("never include demos or tests", () => {
    const shipped = registry.items.flatMap((item) => item.files.map((file) => file.path));
    expect(shipped.length).toBeGreaterThan(0);
    expect(
      shipped.filter((file) => /\/demos\/|\.test\.|__fixtures__|__parity__/.test(file)),
    ).toEqual([]);
  });
});
