/**
 * Resolves the append-only conflicts of a merge in progress (the fast loop's land step).
 *
 * - JSON catalogs and lists (registry catalogs, the parity snapshot, docs `meta.json`,
 *   `tsconfig.json`): a three-way merge of the parsed files. Arrays of named entries merge by
 *   `name`, other arrays keep ours and append what theirs added, objects merge key by key, and
 *   `fetchedAt` takes the newer date. Two different changes to one value are a real conflict.
 * - Text lists (`lib/registry/parity.ts`, `vitest.config.mts`, the DemoFrame overlay set): each
 *   conflict, re-merged without git's trimming of shared lines, keeps ours and then the entries
 *   theirs added that ours does not have. An entry is a line, or a bracketed block of lines
 *   (a `{ find, replacement }` alias), so a hunk boundary never splits one.
 * - Generated files (the skill catalog, the props tables): taken from ours here, then rewritten
 *   by their generator (`regenerate` in the result).
 * - Anything else is reported and left as git left it.
 *
 * CLI: `pnpm exec tsx scripts/loop/resolve-catalogs.ts` in a checkout with a merge in progress;
 * exits 1 when a file is left unresolved.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

/** Files resolved by a structural JSON merge. */
const JSON_FILES = [
  /^registry\/(ui|blocks|hooks)\/registry\.json$/,
  /^registry\.json$/,
  /^registry\/ui\/__parity__\/base-nova\.json$/,
  /^content\/docs\/(.+\/)?meta\.json$/,
  /^tsconfig\.json$/,
];

/** Files resolved by keeping both sides' entries. */
const TEXT_LISTS = new Set([
  "lib/registry/parity.ts",
  "vitest.config.mts",
  "components/docs/demo-frame.tsx",
]);

/** Generated files: any side will do, the generator rewrites them after the merge. */
export const GENERATED: Record<string, string> = {
  "skills/mangacn/references/catalog.md": "gen:skill",
  "lib/docs/props.generated.json": "gen:props",
};

export type FileKind = "json" | "text" | "generated" | "unknown";

export function kindOf(file: string): FileKind {
  if (file in GENERATED) return "generated";
  if (JSON_FILES.some((pattern) => pattern.test(file))) return "json";
  if (TEXT_LISTS.has(file)) return "text";
  return "unknown";
}

// ---------------------------------------------------------------------------------------------
// JSON

export class MergeConflict extends Error {}

const same = (a: Json | undefined, b: Json | undefined) => JSON.stringify(a) === JSON.stringify(b);
const isObject = (value: Json | undefined): value is { [key: string]: Json } =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const named = (value: Json[]): value is { name: string; [key: string]: Json }[] =>
  value.length > 0 && value.every((entry) => isObject(entry) && typeof entry.name === "string");

/** A three-way merge of two JSON values; throws `MergeConflict` where both changed one value. */
export function mergeJson(
  base: Json | undefined,
  ours: Json | undefined,
  theirs: Json | undefined,
  at = "$",
): Json | undefined {
  if (same(ours, theirs)) return ours;
  if (same(base, ours)) return theirs;
  if (same(base, theirs)) return ours;
  if (isObject(ours) && isObject(theirs)) {
    const from = isObject(base) ? base : {};
    const out: { [key: string]: Json } = {};
    for (const key of new Set([...Object.keys(ours), ...Object.keys(theirs)])) {
      const value =
        key === "fetchedAt" && typeof ours[key] === "string" && typeof theirs[key] === "string"
          ? [ours[key], theirs[key]].sort().at(-1)
          : mergeJson(from[key], ours[key], theirs[key], `${at}.${key}`);
      if (value !== undefined) out[key] = value;
    }
    return out;
  }
  if (Array.isArray(ours) && Array.isArray(theirs)) {
    const from = Array.isArray(base) ? base : [];
    return named(ours) && named(theirs) && (from.length === 0 || named(from))
      ? mergeNamed(from as { name: string }[], ours, theirs, at)
      : mergeList(from, ours, theirs);
  }
  throw new MergeConflict(`${at}: both sides changed it`);
}

/** Entries by `name`: ours in order (each merged with theirs), then the names theirs added. */
function mergeNamed(base: Json[], ours: Json[], theirs: Json[], at: string): Json[] {
  const key = (entry: Json) => (entry as { name: string }).name;
  const baseBy = new Map(base.map((entry) => [key(entry), entry]));
  const theirsBy = new Map(theirs.map((entry) => [key(entry), entry]));
  const oursNames = new Set(ours.map(key));
  const out: Json[] = [];
  for (const entry of ours) {
    const name = key(entry);
    // Theirs removed an entry ours left alone: drop it.
    if (!theirsBy.has(name) && baseBy.has(name) && same(baseBy.get(name), entry)) continue;
    const merged = mergeJson(
      baseBy.get(name),
      entry,
      theirsBy.get(name) ?? entry,
      `${at}[${name}]`,
    );
    if (merged !== undefined) out.push(merged);
  }
  for (const entry of theirs) {
    if (!oursNames.has(key(entry)) && !baseBy.has(key(entry))) out.push(entry);
  }
  return out;
}

/** Plain values: ours, less what theirs removed, then what theirs added that ours lacks. */
function mergeList(base: Json[], ours: Json[], theirs: Json[]): Json[] {
  const has = (list: Json[], value: Json) => list.some((entry) => same(entry, value));
  const kept = ours.filter((value) => has(theirs, value) || !has(base, value));
  const added = theirs.filter((value) => !has(base, value) && !has(ours, value));
  return [...kept, ...added];
}

export function resolveJson(base: string | undefined, ours: string, theirs: string): string {
  const merged = mergeJson(
    base === undefined ? undefined : (JSON.parse(base) as Json),
    JSON.parse(ours) as Json,
    JSON.parse(theirs) as Json,
  );
  return `${JSON.stringify(merged, null, 2)}\n`;
}

// ---------------------------------------------------------------------------------------------
// Text lists

const OPEN = /[[{(]/g;
const CLOSE = /[\]})]/g;

/** Bracket depth change of a line, ignoring brackets inside quotes. */
function depth(line: string): number {
  const code = line.replace(/(["'`])(?:\\.|(?!\1).)*\1/g, '""');
  return (code.match(OPEN)?.length ?? 0) - (code.match(CLOSE)?.length ?? 0);
}

/**
 * The entries of a run of lines: a line that opens more brackets than it closes runs on until
 * they close, so a multi-line `{ … },` is one entry. Blank lines belong to the next entry.
 */
export function entries(lines: string[]): string[][] {
  const out: string[][] = [];
  let current: string[] = [];
  let open = 0;
  for (const line of lines) {
    current.push(line);
    open += depth(line);
    if (open <= 0 && line.trim() !== "") {
      out.push(current);
      current = [];
      open = 0;
    }
  }
  if (current.length) out.push(current);
  return out;
}

/** Ours, then the entries theirs added (not in base) that ours does not have. */
export function unionSides(base: string[], ours: string[], theirs: string[]): string[] {
  const text = (entry: string[]) => entry.map((line) => line.trim()).join("\n");
  const baseSet = new Set(entries(base).map(text));
  const oursSet = new Set(entries(ours).map(text));
  const added = entries(theirs).filter((entry) => {
    const key = text(entry);
    if (baseSet.has(key) || oursSet.has(key)) return false;
    oursSet.add(key);
    return true;
  });
  return [...ours, ...added.flat()];
}

/**
 * Rewrites every conflict of a diff3-style merge (`<<<<<<<`, `|||||||`, `=======`, `>>>>>>>`)
 * as the union of its sides. Returns `undefined` when there is no conflict or one is malformed.
 */
export function resolveDiff3(merged: string): string | undefined {
  const lines = merged.split("\n");
  const out: string[] = [];
  let hunks = 0;
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].startsWith("<<<<<<< ")) {
      out.push(lines[i]);
      continue;
    }
    const sides: string[][] = [[], [], []];
    let side = 0;
    let closed = false;
    for (i++; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith("||||||| ") && side === 0) side = 1;
      else if (line === "=======" && side === 1) side = 2;
      else if (line.startsWith(">>>>>>> ") && side === 2) {
        closed = true;
        break;
      } else if (/^(<<<<<<<|\|\|\|\|\|\|\||=======|>>>>>>>)( |$)/.test(line)) return undefined;
      else sides[side].push(line);
    }
    if (!closed) return undefined;
    const [ours, base, theirs] = sides;
    out.push(...unionSides(base, ours, theirs));
    hunks++;
  }
  return hunks ? out.join("\n") : undefined;
}

/** A diff3-style merge of three texts with git's own merge (no trimming of shared lines). */
export function mergeFileDiff3(base: string, ours: string, theirs: string): string {
  const dir = mkdtempSync(path.join(tmpdir(), "mangacn-resolve-"));
  try {
    const files = ["ours", "base", "theirs"].map((name) => path.join(dir, name));
    writeFileSync(files[0], ours);
    writeFileSync(files[1], base);
    writeFileSync(files[2], theirs);
    try {
      return execFileSync(
        "git",
        ["merge-file", "-p", "--diff3", "-L", "ours", "-L", "base", "-L", "theirs", ...files],
        { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
      );
    } catch (error) {
      // merge-file exits with the number of conflicts; its output is still the merge.
      const { status, stdout } = error as { status?: number; stdout?: string };
      if (typeof status === "number" && status > 0 && typeof stdout === "string") return stdout;
      throw error;
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

export function resolveText(base: string | undefined, ours: string, theirs: string) {
  const merged = mergeFileDiff3(base ?? "", ours, theirs);
  return merged.includes("<<<<<<< ") ? resolveDiff3(merged) : merged;
}

// ---------------------------------------------------------------------------------------------
// The merge in progress

export interface Stages {
  base?: string;
  ours?: string;
  theirs?: string;
}

export type Outcome =
  | { file: string; resolved: true; how: string; text: string; regenerate?: string }
  | { file: string; resolved: false; why: string };

/** What to write for one conflicted file, from its three index stages. */
export function resolveFile(file: string, { base, ours, theirs }: Stages): Outcome {
  const kind = kindOf(file);
  if (kind === "unknown") return { file, resolved: false, why: "not a catalog or list" };
  if (ours === undefined || theirs === undefined) {
    return { file, resolved: false, why: "deleted on one side" };
  }
  if (kind === "generated") {
    return {
      file,
      resolved: true,
      how: `ours, then pnpm ${GENERATED[file]}`,
      text: ours,
      regenerate: GENERATED[file],
    };
  }
  try {
    if (kind === "json") {
      return { file, resolved: true, how: "merged JSON", text: resolveJson(base, ours, theirs) };
    }
    const text = resolveText(base, ours, theirs);
    if (text === undefined) return { file, resolved: false, why: "malformed conflict" };
    return { file, resolved: true, how: "kept both sides' entries", text };
  } catch (error) {
    return { file, resolved: false, why: (error as Error).message };
  }
}

function git(root: string, args: string[]): string {
  return execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 64 * 1024 * 1024,
  });
}

function stage(root: string, n: 1 | 2 | 3, file: string): string | undefined {
  try {
    return git(root, ["show", `:${n}:${file}`]);
  } catch {
    return undefined;
  }
}

export function unmergedFiles(root: string): string[] {
  return git(root, ["diff", "--name-only", "--diff-filter=U"]).split(/\r?\n/).filter(Boolean);
}

/**
 * Resolves the merge in progress in `root`: writes and stages every file it can, and leaves the
 * rest. Returns one outcome per unmerged file.
 */
/**
 * Writes a resolved file, trying again when Windows refuses the open: a file git has just
 * rewritten with conflict markers is often still held by an indexer or a virus scanner for a
 * moment (seen landing Task 103 of batch 5, and with the script this one replaced).
 */
export function writeResolved(file: string, text: string, attempts = 5): void {
  for (let attempt = 1; ; attempt++) {
    try {
      writeFileSync(file, text);
      return;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code ?? "";
      if (attempt >= attempts || !["EBUSY", "EPERM", "EACCES", "UNKNOWN"].includes(code))
        throw error;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 200 * attempt);
    }
  }
}

export function resolveConflicts(root: string): Outcome[] {
  const outcomes = unmergedFiles(root).map((file) =>
    resolveFile(file, {
      base: stage(root, 1, file),
      ours: stage(root, 2, file),
      theirs: stage(root, 3, file),
    }),
  );
  for (const outcome of outcomes) {
    if (!outcome.resolved) continue;
    writeResolved(path.join(root, outcome.file), outcome.text);
    git(root, ["add", "--", outcome.file]);
  }
  return outcomes;
}

export function report(outcomes: Outcome[]): string[] {
  return outcomes.map((outcome) =>
    outcome.resolved
      ? `  resolved ${outcome.file}: ${outcome.how}`
      : `  NOT RESOLVED ${outcome.file}: ${outcome.why}`,
  );
}

const invoked = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename);
if (invoked) {
  const root = git(process.cwd(), ["rev-parse", "--show-toplevel"]).trim();
  const outcomes = resolveConflicts(root);
  if (outcomes.length === 0) console.log("no unmerged files");
  for (const line of report(outcomes)) console.log(line);
  process.exit(outcomes.every((outcome) => outcome.resolved) ? 0 : 1);
}
