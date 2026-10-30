import { describe, expect, it } from "vitest";
import { loadRegistry } from "@/lib/registry";
import { findImportViolations, formatImportViolations } from "@/lib/registry/imports";

// SPEC-registry-core §6.5 over every file every catalog ships (theme, ui, blocks).
const registry = loadRegistry();

describe("shipped files", () => {
  it("import only react, declared dependencies, @/lib/utils and declared registry items", () => {
    const violations = findImportViolations(registry);
    expect(violations, `Forbidden imports:\n${formatImportViolations(violations)}`).toEqual([]);
  });

  it("never include demos or tests", () => {
    const shipped = registry.items.flatMap((item) => item.files.map((file) => file.path));
    expect(shipped.length).toBeGreaterThan(0);
    expect(
      shipped.filter((file) => /\/demos\/|\.test\.|__fixtures__|__parity__/.test(file)),
    ).toEqual([]);
  });
});
