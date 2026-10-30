import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { loadRegistry } from "./index";

let root: string;

function write(relativePath: string, content: unknown) {
  const file = path.join(root, relativePath);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, typeof content === "string" ? content : JSON.stringify(content));
}

function item(name: string, files: string[]) {
  return {
    name,
    type: "registry:component",
    files: files.map((file) => ({ path: file, type: "registry:component" })),
  };
}

beforeEach(() => {
  root = mkdtempSync(path.join(tmpdir(), "mangacn-registry-"));
  write("registry.json", {
    name: "fixture",
    homepage: "https://example.com",
    include: ["registry/ui/registry.json", "registry/blocks/registry.json"],
  });
  write("registry/ui/registry.json", { items: [item("alpha", ["alpha/alpha.tsx"])] });
  write("registry/ui/alpha/alpha.tsx", "export const Alpha = 1;\n");
  write("registry/blocks/registry.json", {
    include: ["nested/registry.json"],
    items: [item("beta", ["beta/beta.tsx", "beta/beta-part.tsx"])],
  });
  write("registry/blocks/beta/beta.tsx", "export const Beta = 1;\n");
  write("registry/blocks/beta/beta-part.tsx", "export const BetaPart = 1;\n");
  write("registry/blocks/nested/registry.json", { items: [item("gamma", ["gamma.tsx"])] });
  write("registry/blocks/nested/gamma.tsx", "export const Gamma = 1;\n");
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe("loadRegistry", () => {
  it("flattens included catalogs and rewrites file paths to repo-relative", () => {
    const registry = loadRegistry(path.join(root, "registry.json"));

    expect(registry.name).toBe("fixture");
    expect(registry.homepage).toBe("https://example.com");
    expect(registry.items.map((entry) => entry.name)).toEqual(["alpha", "beta", "gamma"]);
    expect(registry.items.map((entry) => entry.files.map((file) => file.path))).toEqual([
      ["registry/ui/alpha/alpha.tsx"],
      ["registry/blocks/beta/beta.tsx", "registry/blocks/beta/beta-part.tsx"],
      ["registry/blocks/nested/gamma.tsx"],
    ]);
    expect(registry.items.map((entry) => entry.source)).toEqual([
      "registry/ui/registry.json",
      "registry/blocks/registry.json",
      "registry/blocks/nested/registry.json",
    ]);
  });

  it("throws on duplicate item names, naming the item and both catalogs", () => {
    write("registry/blocks/registry.json", { items: [item("alpha", ["beta/beta.tsx"])] });

    expect(() => loadRegistry(path.join(root, "registry.json"))).toThrow(
      'Duplicate registry item "alpha" in registry/blocks/registry.json (already declared in registry/ui/registry.json)',
    );
  });

  it("throws on a missing item file, naming the item and path", () => {
    rmSync(path.join(root, "registry/ui/alpha/alpha.tsx"));

    expect(() => loadRegistry(path.join(root, "registry.json"))).toThrow(
      'Registry item "alpha" lists missing file registry/ui/alpha/alpha.tsx',
    );
  });

  it("throws on a missing included catalog", () => {
    rmSync(path.join(root, "registry/blocks/nested/registry.json"));

    expect(() => loadRegistry(path.join(root, "registry.json"))).toThrow(
      "Registry file not found: registry/blocks/nested/registry.json",
    );
  });

  it("throws on invalid JSON", () => {
    write("registry/ui/registry.json", "{ not json");

    expect(() => loadRegistry(path.join(root, "registry.json"))).toThrow(
      /^Invalid JSON in registry\/ui\/registry\.json/,
    );
  });

  it("loads the real repository registry", () => {
    const registry = loadRegistry();

    expect(registry.name).toBe("mangacn");
    expect(registry.items.find((entry) => entry.name === "button")?.files[0]?.path).toBe(
      "registry/ui/button/button.tsx",
    );
  });
});
