import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { mangacnItemName } from "./index";

/**
 * The restyled primitives, by stock base-nova name: the 21 of SPEC-components §4.3, then
 * batch 2 (SPEC-components-2 §4) in build order.
 */
export const PARITY_PRIMITIVES = [
  "button",
  "badge",
  "card",
  "input",
  "textarea",
  "checkbox",
  "radio-group",
  "switch",
  "select",
  "tabs",
  "dialog",
  "sheet",
  "tooltip",
  "popover",
  "accordion",
  "alert",
  "avatar",
  "progress",
  "skeleton",
  "separator",
  "table",
  "slider",
  "toggle",
  "toggle-group",
  "kbd",
  "breadcrumb",
  "pagination",
  "collapsible",
  "dropdown-menu",
  "alert-dialog",
  "hover-card",
  "drawer",
  "sonner",
  "scroll-area",
  "spinner",
  "empty",
  "label",
  "aspect-ratio",
  "native-select",
  "input-group",
  "button-group",
  "context-menu",
  "menubar",
  "field",
  "item",
  "sidebar",
  "navigation-menu",
  "combobox",
  "direction",
  "input-otp",
  "resizable",
  "command",
  "calendar",
  "carousel",
  "chart",
] as const;

/**
 * The blocks mangacn redraws from stock base-nova blocks, by stock name (batch 5): each keeps
 * stock's files, page target, exports and registry dependencies (`compareBlockParity`).
 */
export const PARITY_BLOCKS = ["login-01"] as const;

export const PARITY_SNAPSHOT_PATH = "registry/ui/__parity__/base-nova.json";

export const BLOCK_PARITY_SNAPSHOT_PATH = "registry/blocks/__parity__/base-nova.json";

export const STOCK_ITEM_URL = "https://ui.shadcn.com/r/styles/base-nova/{name}.json";

/** `cva` variable name → variant group → keys, e.g. `{ buttonVariants: { size: ["sm"] } }`. */
export type CvaVariants = Record<string, Record<string, string[]>>;

/** The parts of a primitive that must match stock (SPEC-components §4.1). */
export interface ParityShape {
  exports: string[];
  dataSlots: string[];
  variants: CvaVariants;
  dependencies: string[];
  registryDependencies: string[];
}

export interface ParitySnapshotEntry extends ParityShape {
  /** sha1 of the stock file content, to spot upstream changes on refresh. */
  sha1: string;
}

export interface ParitySnapshot {
  $comment: string;
  source: string;
  fetchedAt: string;
  items: Record<string, ParitySnapshotEntry>;
}

const sorted = (values: Iterable<string>) => [...new Set(values)].sort();

/** Replaces comments with spaces, leaving strings (and so quoted keys and slots) intact. */
export function stripComments(source: string): string {
  let out = "";
  let i = 0;
  while (i < source.length) {
    const char = source[i];
    if (char === "/" && (source[i + 1] === "/" || source[i + 1] === "*")) {
      const block = source[i + 1] === "*";
      const end = block ? source.indexOf("*/", i + 2) : source.indexOf("\n", i);
      const stop = end === -1 ? source.length : block ? end + 2 : end;
      out += source.slice(i, stop).replace(/[^\n]/g, " ");
      i = stop;
    } else if (char === '"' || char === "'" || char === "`") {
      const stop = skipString(source, i);
      out += source.slice(i, stop);
      i = stop;
    } else {
      out += char;
      i += 1;
    }
  }
  return out;
}

/** Runtime named exports (`export { A, b as B }`, `export function`, `export const`); types skipped. */
export function extractExports(input: string): string[] {
  const source = stripComments(input);
  const names: string[] = [];
  for (const match of source.matchAll(/^export\s+\{([^}]*)\}/gm)) {
    for (const part of match[1].split(",")) {
      const spec = part.trim();
      if (!spec || spec.startsWith("type ")) continue;
      names.push(spec.split(/\s+as\s+/).pop() as string);
    }
  }
  for (const match of source.matchAll(
    /^export\s+(?:async\s+)?(?:function\*?|const|let|var|class)\s+([A-Za-z_$][\w$]*)/gm,
  )) {
    names.push(match[1]);
  }
  return sorted(names);
}

/**
 * Literal `data-slot` values: `data-slot="x"`, `data-slot={"x"}`, and Base UI's
 * `useRender({ state: { slot: "x" } })`, which renders as `data-slot="x"`.
 */
export function extractDataSlots(input: string): string[] {
  const source = stripComments(input);
  const attributes = source.matchAll(/data-slot=(?:\{\s*)?(["'])([^"']+)\1/g);
  const states = source.matchAll(/\bstate\s*:\s*\{[^}]*?\bslot\s*:\s*(["'])([^"']+)\1/g);
  return sorted([...attributes, ...states].map((match) => match[2]));
}

/** Index just past the bracket that closes the one at `open`, skipping strings. */
function closingIndex(source: string, open: number): number {
  let depth = 0;
  let i = open;
  while (i < source.length) {
    const char = source[i];
    if (char === '"' || char === "'" || char === "`") {
      i = skipString(source, i);
      continue;
    }
    if (char === "{" || char === "(" || char === "[") {
      depth += 1;
    } else if (char === "}" || char === ")" || char === "]") {
      depth -= 1;
      if (depth === 0) return i + 1;
    }
    i += 1;
  }
  return source.length;
}

/** Top-level `key: value` pairs of the object literal starting at `open` (a `{`). */
function objectEntries(source: string, open: number): { key: string; value: number }[] {
  const end = closingIndex(source, open) - 1;
  const entries: { key: string; value: number }[] = [];
  const key = /\s*(?:"([^"]+)"|'([^']+)'|([A-Za-z_$][\w$-]*))\s*:\s*/y;
  let i = open + 1;
  while (i < end) {
    key.lastIndex = i;
    const match = key.exec(source);
    if (!match) {
      i += 1;
      continue;
    }
    const valueStart = key.lastIndex;
    entries.push({ key: match[1] ?? match[2] ?? match[3], value: valueStart });
    // Skip the value: a nested literal/call, a string, or anything up to the next comma.
    let j = valueStart;
    while (j < end && source[j] !== ",") {
      const char = source[j];
      if ("{([\"'`".includes(char)) {
        j =
          char === "{" || char === "(" || char === "["
            ? closingIndex(source, j)
            : skipString(source, j);
      } else {
        j += 1;
      }
    }
    i = j + 1;
  }
  return entries;
}

function skipString(source: string, start: number): number {
  const quote = source[start];
  let i = start + 1;
  while (i < source.length && source[i] !== quote) i += source[i] === "\\" ? 2 : 1;
  return i + 1;
}

/** Variant groups and their keys for every `const x = cva(base, { variants: { … } })`. */
export function extractCvaVariants(input: string): CvaVariants {
  const source = stripComments(input);
  const result: CvaVariants = {};
  for (const match of source.matchAll(/\bconst\s+([A-Za-z_$][\w$]*)\s*=\s*cva\s*\(/g)) {
    const open = (match.index ?? 0) + match[0].length - 1;
    const call = source.slice(open, closingIndex(source, open));
    const offset = call.search(/\bvariants\s*:\s*\{/);
    const groups: Record<string, string[]> = {};
    if (offset !== -1) {
      const braces = open + offset + call.slice(offset).indexOf("{");
      for (const group of objectEntries(source, braces)) {
        if (source[group.value] !== "{") continue;
        groups[group.key] = objectEntries(source, group.value).map((entry) => entry.key);
      }
    }
    result[match[1]] = groups;
  }
  return result;
}

/** The parity shape of one primitive's source plus its catalog dependency lists. */
export function extractParityShape(
  source: string,
  deps: { dependencies?: string[]; registryDependencies?: string[] } = {},
): ParityShape {
  return {
    exports: extractExports(source),
    dataSlots: extractDataSlots(source),
    variants: extractCvaVariants(source),
    dependencies: sorted(deps.dependencies ?? []),
    registryDependencies: sorted(deps.registryDependencies ?? []),
  };
}

export function sha1(content: string): string {
  return createHash("sha1").update(content).digest("hex");
}

function diffList(label: string, expected: string[], actual: string[]): string[] {
  const missing = expected.filter((value) => !actual.includes(value));
  const extra = actual.filter((value) => !expected.includes(value));
  return [
    ...(missing.length ? [`${label}: missing ${missing.join(", ")}`] : []),
    ...(extra.length ? [`${label}: unexpected ${extra.join(", ")}`] : []),
  ];
}

/**
 * Differences between a restyled primitive and its stock snapshot. Exports and slots must be
 * equal; `dependencies` must include every stock package (an item also declares the base-nova
 * style packages it imports, SPEC-components §4.1); `registryDependencies` must include every
 * stock name and may add only mangacn items by URL (`https://www.mangacn.com/r/ink-frame.json`).
 * A stock name may be replaced, never dropped, by the mangacn URL of the same name: `button`
 * satisfied by `https://www.mangacn.com/r/button.json`, so one `shadcn add` of `dialog` ends
 * with mangacn's button rather than shadcn's. Every stock `cva` group and key must exist, and
 * added groups, keys or `cva` objects are allowed (SPEC-components §4.2: additions only).
 */
export function compareParity(stock: ParityShape, actual: ParityShape): string[] {
  const problems = [
    ...diffList("exports", stock.exports, actual.exports),
    ...diffList("data-slot", stock.dataSlots, actual.dataSlots),
    ...dependencyProblems(stock, actual),
  ];
  for (const [name, groups] of Object.entries(stock.variants)) {
    const restyled = actual.variants[name];
    if (!restyled) {
      problems.push(`cva ${name}: missing`);
      continue;
    }
    for (const [group, keys] of Object.entries(groups)) {
      const missing = keys.filter((key) => !(restyled[group] ?? []).includes(key));
      if (missing.length) problems.push(`cva ${name}.${group}: missing ${missing.join(", ")}`);
    }
  }
  return problems;
}

type DependencyLists = Pick<ParityShape, "dependencies" | "registryDependencies">;

/**
 * `dependencies` must include every stock package; `registryDependencies` every stock name,
 * a mangacn URL of the same name standing in for it, plus only other mangacn URLs.
 */
function dependencyProblems(stock: DependencyLists, actual: DependencyLists): string[] {
  // A URL naming a stock dependency stands in for it; any other mangacn URL is an addition.
  const registryDependencies = actual.registryDependencies.flatMap((dep) => {
    const name = mangacnItemName(dep);
    if (name === null) return [dep];
    return stock.registryDependencies.includes(name) ? [name] : [];
  });
  return [
    ...diffList("dependencies", stock.dependencies, actual.dependencies).filter((problem) =>
      problem.startsWith("dependencies: missing"),
    ),
    ...diffList("registryDependencies", stock.registryDependencies, registryDependencies),
  ];
}

/** One file of a block as parity sees it: its path inside the block's folder, type, exports. */
export interface BlockParityFile {
  /** `page.tsx`, `components/login-form.tsx`. */
  path: string;
  type: string;
  /** A page's route target (`app/login/page.tsx`); other files' targets are mangacn's own. */
  target?: string;
  /** Runtime exports, `default` for a default export. */
  exports: string[];
}

/** The parts of a stock-derived block that must match stock. */
export interface BlockParityShape extends DependencyLists {
  files: BlockParityFile[];
}

export interface BlockParitySnapshotEntry extends BlockParityShape {
  /** sha1 of the stock files' contents in order, to spot upstream changes on refresh. */
  sha1: string;
}

export interface BlockParitySnapshot {
  $comment: string;
  source: string;
  fetchedAt: string;
  items: Record<string, BlockParitySnapshotEntry>;
}

/**
 * A block file's path inside its block folder, for stock and mangacn alike:
 * `registry/base-nova/blocks/login-01/components/login-form.tsx` and
 * `registry/blocks/login-01/components/login-form.tsx` → `components/login-form.tsx`.
 */
export function blockRelativePath(name: string, file: string): string {
  const marker = `blocks/${name}/`;
  const index = file.indexOf(marker);
  return index === -1 ? path.posix.basename(file) : file.slice(index + marker.length);
}

/** `extractExports` plus `default` when the module has a default export (a page). */
export function extractModuleExports(source: string): string[] {
  const names = extractExports(source);
  return /^export\s+default\b/m.test(stripComments(source)) ? sorted([...names, "default"]) : names;
}

/** The parity shape of a block from its files' sources and its catalog dependency lists. */
export function extractBlockParityShape(
  name: string,
  files: readonly { path: string; type: string; target?: string; content: string }[],
  deps: { dependencies?: string[]; registryDependencies?: string[] } = {},
): BlockParityShape {
  return {
    files: files
      .map((file) => ({
        path: blockRelativePath(name, file.path),
        type: file.type,
        ...(file.type === "registry:page" ? { target: file.target } : {}),
        exports: extractModuleExports(file.content),
      }))
      .sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0)),
    dependencies: sorted(deps.dependencies ?? []),
    registryDependencies: sorted(deps.registryDependencies ?? []),
  };
}

/**
 * Differences between a stock-derived block and its stock snapshot: the same files by path and
 * type, the same page target, the same exports per file, and the dependency rules of
 * `compareParity` (stock's packages kept, stock's names kept, by bare name or mangacn URL, and
 * only mangacn items added).
 */
export function compareBlockParity(stock: BlockParityShape, actual: BlockParityShape): string[] {
  const key = (file: BlockParityFile) => `${file.path} (${file.type})`;
  const problems = diffList("files", stock.files.map(key), actual.files.map(key));
  for (const file of stock.files) {
    const own = actual.files.find((candidate) => key(candidate) === key(file));
    if (!own) continue;
    if (file.target !== own.target) {
      problems.push(`${file.path}: target ${own.target}; stock's is ${file.target}`);
    }
    problems.push(...diffList(`${file.path} exports`, file.exports, own.exports));
  }
  return [...problems, ...dependencyProblems(stock, actual)];
}

/** The block parity snapshot, or `undefined` before `pnpm gen:parity` has written one. */
export function loadBlockParitySnapshot(rootDir = process.cwd()): BlockParitySnapshot | undefined {
  const file = path.resolve(rootDir, BLOCK_PARITY_SNAPSHOT_PATH);
  return existsSync(file)
    ? (JSON.parse(readFileSync(file, "utf8")) as BlockParitySnapshot)
    : undefined;
}
