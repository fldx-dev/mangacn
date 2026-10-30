import { createHash } from "node:crypto";

/** The 21 restyled primitives, by stock base-nova name (SPEC-components §4.3). */
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
] as const;

export const PARITY_SNAPSHOT_PATH = "registry/ui/__parity__/base-nova.json";

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
 * Differences between a restyled primitive and its stock snapshot. Exports, slots and
 * `registryDependencies` must be equal; `dependencies` must include every stock package (an
 * item also declares the base-nova style packages it imports, SPEC-components §4.1). Every
 * stock `cva` group and key must exist, and added groups, keys or `cva` objects are allowed
 * (SPEC-components §4.2: additions only).
 */
export function compareParity(stock: ParityShape, actual: ParityShape): string[] {
  const problems = [
    ...diffList("exports", stock.exports, actual.exports),
    ...diffList("data-slot", stock.dataSlots, actual.dataSlots),
    ...diffList("dependencies", stock.dependencies, actual.dependencies).filter((problem) =>
      problem.startsWith("dependencies: missing"),
    ),
    ...diffList("registryDependencies", stock.registryDependencies, actual.registryDependencies),
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
