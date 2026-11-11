import { describe, expect, it } from "vitest";
import { loadRegistry } from "@/lib/registry";
import {
  blockImportPaths,
  blockImportViolation,
  findImportViolations,
  findRegistryDependencyProblems,
  formatImportViolations,
} from "@/lib/registry/imports";

// SPEC-registry-core §6.5 over every file every catalog ships (theme, ui, blocks). Blocks are
// stricter (SPEC-components-3 §3, §10): beyond React, their packages and @/lib/utils they import
// only the install paths of the items they declare by mangacn URL, and their own part files.
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

describe("a block made of blocks", () => {
  // SPEC-components-4 §3: a block declares the blocks it composes by mangacn URL and imports
  // them from their install paths, as it does items; a block it does not declare is refused.
  const catalog = new Map(registry.items.map((item) => [item.name, item]));
  const composer = {
    dependencies: ["cn"],
    registryDependencies: ["https://www.mangacn.com/r/spread-viewer.json"],
    files: [],
  };
  const allowed = blockImportPaths(composer, catalog);
  const check = (specifier: string) =>
    blockImportViolation(specifier, composer, "registry/blocks/composer/composer.tsx", allowed);

  it("may import every file of a block it declares, from its install path", () => {
    expect(check("@/components/blocks/spread-viewer/spread-viewer")).toBeNull();
    expect(check("@/components/blocks/spread-viewer/use-spread")).toBeNull();
  });

  it("may not import a block it does not declare", () => {
    expect(check("@/components/blocks/chapter-list/chapter-list")).toContain("alias import");
    expect(check("@/registry/blocks/spread-viewer/spread-viewer")).toContain("alias import");
  });
});
