// @vitest-environment node
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import ts from "typescript";
import { afterEach, describe, expect, it } from "vitest";
import {
  entries,
  kindOf,
  MergeConflict,
  mergeJson,
  resolveConflicts,
  resolveDiff3,
  unmergedFiles,
} from "./resolve-catalogs";

// Each case is a real merge conflict in a throwaway repository: a base commit, `main` and
// `feature` changing the same files, then `git merge feature` on main, as the loop does it.

const roots: string[] = [];
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

type Files = Record<string, string>;

function git(root: string, ...args: string[]) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: "pipe" });
}

function write(root: string, files: Files) {
  for (const [file, text] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    writeFileSync(path.join(root, file), text);
  }
}

/** A repository mid-merge of `feature` into `main`, with the conflicts git left. */
function conflict(base: Files, ours: Files, theirs: Files): string {
  const root = mkdtempSync(path.join(tmpdir(), "mangacn-resolve-test-"));
  roots.push(root);
  git(root, "init", "-q", "-b", "main");
  git(root, "config", "user.name", "test");
  git(root, "config", "user.email", "test@example.invalid");
  git(root, "config", "core.autocrlf", "false");
  git(root, "config", "commit.gpgsign", "false");
  write(root, base);
  git(root, "add", "-A");
  git(root, "commit", "-q", "-m", "base");
  git(root, "checkout", "-q", "-b", "feature");
  write(root, theirs);
  git(root, "commit", "-q", "-am", "theirs");
  git(root, "checkout", "-q", "main");
  write(root, ours);
  git(root, "commit", "-q", "-am", "ours");
  try {
    git(root, "merge", "--no-ff", "-m", "merge", "feature");
  } catch {
    // The conflict is the point.
  }
  return root;
}

const json = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;
const read = (root: string, file: string) => readFileSync(path.join(root, file), "utf8");
const item = (name: string, description = `${name} item`) => ({
  name,
  type: "registry:ui",
  description,
  files: [{ path: `registry/ui/${name}/${name}.tsx`, type: "registry:ui" }],
});

describe("resolveConflicts", () => {
  it("merges two branches' items appended to one catalog", () => {
    const catalog = (...names: string[]) =>
      json({
        name: "mangacn",
        homepage: "https://www.mangacn.com",
        items: names.map((n) => item(n)),
      });
    const file = "registry/ui/registry.json";
    const root = conflict(
      { [file]: catalog("button", "badge") },
      { [file]: catalog("button", "badge", "kbd") },
      { [file]: catalog("button", "badge", "chart", "sidebar") },
    );
    expect(unmergedFiles(root)).toEqual([file]);

    const outcomes = resolveConflicts(root);

    expect(outcomes).toMatchObject([{ file, resolved: true }]);
    const merged = JSON.parse(read(root, file));
    expect(merged.items.map((i: { name: string }) => i.name)).toEqual([
      "button",
      "badge",
      "kbd",
      "chart",
      "sidebar",
    ]);
    expect(merged.items[2]).toEqual(item("kbd"));
    expect(unmergedFiles(root)).toEqual([]);
  });

  it("merges the parity snapshot's entries by name and keeps the newest fetchedAt", () => {
    const file = "registry/ui/__parity__/base-nova.json";
    const entry = (exports: string[]) => ({ exports, dataSlots: [exports[0].toLowerCase()] });
    const snapshot = (fetchedAt: string, items: Record<string, unknown>) =>
      json({
        $comment: "Generated.",
        source: "https://example.invalid/{name}.json",
        fetchedAt,
        items,
      });
    const root = conflict(
      { [file]: snapshot("2026-11-10", { button: entry(["Button"]) }) },
      { [file]: snapshot("2026-11-12", { button: entry(["Button"]), kbd: entry(["Kbd"]) }) },
      { [file]: snapshot("2026-11-11", { button: entry(["Button"]), chart: entry(["Chart"]) }) },
    );

    expect(resolveConflicts(root)).toMatchObject([{ file, resolved: true }]);
    const merged = JSON.parse(read(root, file));
    expect(merged.fetchedAt).toBe("2026-11-12");
    expect(Object.keys(merged.items)).toEqual(["button", "kbd", "chart"]);
    expect(merged.items.chart).toEqual(entry(["Chart"]));
  });

  it("keeps both sides of the append-only lists: parity.ts, a meta.json, tsconfig.json", () => {
    const parity = (...names: string[]) =>
      `export const PARITY_PRIMITIVES = [\n${names.map((n) => `  "${n}",\n`).join("")}] as const;\n`;
    const meta = (...pages: string[]) => json({ title: "Components", pages });
    const tsconfig = (paths: Record<string, string[]>) =>
      json({ compilerOptions: { strict: true, paths } });
    const alias = (name: string) => ({
      [`@/components/ui/${name}`]: [`./registry/ui/${name}/${name}.tsx`],
    });
    const root = conflict(
      {
        "lib/registry/parity.ts": parity("button", "badge"),
        "content/docs/components/meta.json": meta("---Primitives---", "button", "badge"),
        "tsconfig.json": tsconfig({ "@/*": ["./*"], ...alias("button") }),
      },
      {
        "lib/registry/parity.ts": parity("button", "badge", "kbd"),
        "content/docs/components/meta.json": meta("---Primitives---", "button", "badge", "kbd"),
        "tsconfig.json": tsconfig({ "@/*": ["./*"], ...alias("button"), ...alias("kbd") }),
      },
      {
        "lib/registry/parity.ts": parity("button", "badge", "chart", "sidebar"),
        "content/docs/components/meta.json": meta("---Primitives---", "button", "badge", "chart"),
        "tsconfig.json": tsconfig({ "@/*": ["./*"], ...alias("button"), ...alias("chart") }),
      },
    );
    expect(unmergedFiles(root)).toHaveLength(3);

    const outcomes = resolveConflicts(root);

    expect(outcomes.every((outcome) => outcome.resolved)).toBe(true);
    expect(read(root, "lib/registry/parity.ts")).toBe(
      parity("button", "badge", "kbd", "chart", "sidebar"),
    );
    expect(JSON.parse(read(root, "content/docs/components/meta.json")).pages).toEqual([
      "---Primitives---",
      "button",
      "badge",
      "kbd",
      "chart",
    ]);
    expect(Object.keys(JSON.parse(read(root, "tsconfig.json")).compilerOptions.paths)).toEqual([
      "@/*",
      "@/components/ui/button",
      "@/components/ui/kbd",
      "@/components/ui/chart",
    ]);
    expect(unmergedFiles(root)).toEqual([]);
  });

  it("writes an alias both sides added once", () => {
    const parity = (...names: string[]) =>
      `export const PARITY_PRIMITIVES = [\n${names.map((n) => `  "${n}",\n`).join("")}] as const;\n`;
    const paths = (...names: string[]) =>
      json({
        compilerOptions: {
          paths: Object.fromEntries(names.map((n) => [`@/components/ui/${n}`, [`./${n}.tsx`]])),
        },
      });
    const root = conflict(
      { "lib/registry/parity.ts": parity("button"), "tsconfig.json": paths("button") },
      {
        "lib/registry/parity.ts": parity("button", "kbd", "label"),
        "tsconfig.json": paths("button", "kbd", "label"),
      },
      {
        "lib/registry/parity.ts": parity("button", "kbd", "chart"),
        "tsconfig.json": paths("button", "kbd", "chart"),
      },
    );

    resolveConflicts(root);

    expect(read(root, "lib/registry/parity.ts")).toBe(parity("button", "kbd", "label", "chart"));
    expect(Object.keys(JSON.parse(read(root, "tsconfig.json")).compilerOptions.paths)).toEqual([
      "@/components/ui/button",
      "@/components/ui/kbd",
      "@/components/ui/label",
      "@/components/ui/chart",
    ]);
  });

  it("keeps a multi-line vitest alias whole when the hunk boundary cuts it", () => {
    // Both sides append a `{ find, replacement }` block in the same place. Git's own conflict
    // shares the blocks' first and last lines, so taking both sides of its hunk would leave one
    // object with two `find` keys and lose an alias.
    const block = (name: string) =>
      [
        "      {",
        `        find: /^@\\/components\\/ui\\/${name}$/,`,
        `        replacement: fileURLToPath(new URL("./registry/ui/${name}/${name}.tsx", import.meta.url)),`,
        "      },",
      ].join("\n");
    const config = (...names: string[]) =>
      [
        'import { fileURLToPath } from "node:url";',
        'import { defineConfig } from "vitest/config";',
        "",
        "export default defineConfig({",
        "  resolve: {",
        "    alias: [",
        ...names.map(block),
        '      { find: "@", replacement: fileURLToPath(new URL("./", import.meta.url)) },',
        "    ],",
        "  },",
        "});",
        "",
      ].join("\n");
    const file = "vitest.config.mts";
    const root = conflict(
      { [file]: config("button") },
      { [file]: config("button", "kbd") },
      { [file]: config("button", "chart") },
    );
    // The premise: git's hunk starts inside the block.
    expect(read(root, file)).toMatch(/ {6}\{\n<<<<<<< /);

    expect(resolveConflicts(root)).toMatchObject([{ file, resolved: true }]);

    const text = read(root, file);
    expect(text).toBe(config("button", "kbd", "chart"));
    const { diagnostics } = ts.transpileModule(text, {
      reportDiagnostics: true,
      compilerOptions: { module: ts.ModuleKind.ESNext },
    });
    expect(diagnostics).toEqual([]);
  });

  it("reports an unknown file and leaves it as git left it", () => {
    const root = conflict(
      { "README.md": "# mangacn\n\nOne line.\n", "lib/registry/parity.ts": '[\n  "a",\n]\n' },
      { "README.md": "# mangacn\n\nOurs.\n", "lib/registry/parity.ts": '[\n  "a",\n  "b",\n]\n' },
      { "README.md": "# mangacn\n\nTheirs.\n", "lib/registry/parity.ts": '[\n  "a",\n  "c",\n]\n' },
    );
    const before = read(root, "README.md");

    const outcomes = resolveConflicts(root);

    expect(outcomes).toEqual([
      { file: "README.md", resolved: false, why: "not a catalog or list" },
      expect.objectContaining({ file: "lib/registry/parity.ts", resolved: true }),
    ]);
    expect(read(root, "README.md")).toBe(before);
    expect(before).toContain("<<<<<<< ");
    expect(unmergedFiles(root)).toEqual(["README.md"]);
  });

  it("takes ours for a generated file and names its generator", () => {
    const file = "skills/mangacn/references/catalog.md";
    const root = conflict(
      { [file]: "- button\n" },
      { [file]: "- button\n- kbd\n" },
      { [file]: "- button\n- chart\n" },
    );

    expect(resolveConflicts(root)).toEqual([
      expect.objectContaining({ file, resolved: true, regenerate: "gen:skill" }),
    ]);
    expect(read(root, file)).toBe("- button\n- kbd\n");
  });

  it("leaves a catalog alone when both sides changed one item differently", () => {
    const file = "registry/ui/registry.json";
    const root = conflict(
      { [file]: json({ items: [item("button")] }) },
      { [file]: json({ items: [item("button", "Ours.")] }) },
      { [file]: json({ items: [item("button", "Theirs.")] }) },
    );

    expect(resolveConflicts(root)).toEqual([
      { file, resolved: false, why: "$.items[button].description: both sides changed it" },
    ]);
    expect(unmergedFiles(root)).toEqual([file]);
  });
});

describe("the pieces", () => {
  it("classifies files", () => {
    expect(kindOf("registry/blocks/registry.json")).toBe("json");
    expect(kindOf("content/docs/blocks/meta.json")).toBe("json");
    expect(kindOf("vitest.config.mts")).toBe("text");
    expect(kindOf("lib/docs/props.generated.json")).toBe("generated");
    expect(kindOf("package.json")).toBe("unknown");
  });

  it("groups a bracketed block into one entry", () => {
    expect(entries(["  {", "    a: 1,", "  },", '  "b",'])).toEqual([
      ["  {", "    a: 1,", "  },"],
      ['  "b",'],
    ]);
    // Brackets inside strings and regular expressions written as strings do not count.
    expect(entries(['  "a(",', '  "b",'])).toEqual([['  "a(",'], ['  "b",']]);
  });

  it("refuses a malformed conflict", () => {
    expect(resolveDiff3("<<<<<<< ours\na\n=======\nb\n>>>>>>> theirs\n")).toBeUndefined();
    expect(resolveDiff3("no conflict\n")).toBeUndefined();
  });

  it("throws on two different changes to one value", () => {
    expect(() => mergeJson({ a: 1 }, { a: 2 }, { a: 3 })).toThrow(MergeConflict);
    expect(mergeJson({ a: 1 }, { a: 2 }, { a: 2 })).toEqual({ a: 2 });
    expect(mergeJson([1, 2], [1, 2, 3], [2, 4])).toEqual([2, 3, 4]);
  });
});
