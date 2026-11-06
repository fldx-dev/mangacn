import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { clientNote, hasUseClientDirective, isClientItem } from "./client";
import { loadRegistry } from "./index";

describe("hasUseClientDirective", () => {
  it("finds the directive after comments and blank lines, in either quote", () => {
    expect(hasUseClientDirective('"use client";\nexport {}')).toBe(true);
    expect(hasUseClientDirective("'use client'\n")).toBe(true);
    expect(hasUseClientDirective('// header\n/* block\n */\n\n"use client";\n')).toBe(true);
  });

  it("ignores a directive that is not the first statement or is mistyped", () => {
    expect(hasUseClientDirective('import x from "y";\n"use client";\n')).toBe(false);
    expect(hasUseClientDirective('"use server";\n')).toBe(false);
    expect(hasUseClientDirective("\"use client'\n")).toBe(false);
    expect(hasUseClientDirective("export function Panel() {}\n")).toBe(false);
  });
});

describe("isClientItem", () => {
  const items = loadRegistry().items;

  it("is null for an item that ships no script", () => {
    const theme = items.find((item) => item.name === "theme");
    expect(theme && isClientItem(theme)).toBeNull();
  });

  it("matches the entry file of every item that ships one", () => {
    let client = 0;
    let server = 0;
    for (const item of items) {
      const entry = item.files.find((file) => /\.[cm]?[jt]sx?$/.test(file.path));
      if (!entry) continue;
      const first = readFileSync(path.resolve(entry.path), "utf8")
        .split("\n")
        .find((line) => line.trim() !== "" && !line.trim().startsWith("//"));
      const expected = /^["']use client["']/.test(first?.trim() ?? "");
      expect(isClientItem(item), item.name).toBe(expected);
      if (expected) client++;
      else server++;
    }
    // Both kinds ship: the ink frame draws on the client, panels render on the server.
    expect(client).toBeGreaterThan(0);
    expect(server).toBeGreaterThan(0);
  });
});

describe("clientNote", () => {
  it("names the directive either way", () => {
    expect(clientNote(true)).toMatch(/^Client component: the file starts with "use client"\./);
    expect(clientNote(false)).toMatch(/^Server component: the file has no "use client"/);
  });
});
