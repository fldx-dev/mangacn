import { readFileSync } from "node:fs";
import path from "node:path";
import type { LoadedRegistry, LoadedRegistryItem } from "./index";

export interface ImportSpecifier {
  specifier: string;
  /** 1-based line of the specifier in the source. */
  line: number;
}

export interface ImportViolation {
  item: string;
  /** Path of the shipped file, relative to the registry root. */
  file: string;
  specifier: string;
  line: number;
  reason: string;
}

/**
 * Blanks comments and masks the inside of string and template literals with `x` (quotes
 * kept, lengths and newlines preserved), so the patterns only match real code while match
 * offsets still point into the original source.
 */
function maskSource(source: string): string {
  let out = "";
  let i = 0;
  while (i < source.length) {
    const char = source[i];
    const next = source[i + 1];
    if (char === "/" && (next === "/" || next === "*")) {
      const end = next === "/" ? source.indexOf("\n", i) : source.indexOf("*/", i + 2);
      const stop = end === -1 ? source.length : next === "/" ? end : end + 2;
      out += source.slice(i, stop).replace(/[^\n]/g, " ");
      i = stop;
    } else if (char === '"' || char === "'" || char === "`") {
      // Quoted strings end at a newline too, so an apostrophe in JSX text cannot run on.
      let j = i + 1;
      while (j < source.length && source[j] !== char && (char === "`" || source[j] !== "\n")) {
        j += source[j] === "\\" ? 2 : 1;
      }
      out += char + source.slice(i + 1, j).replace(/[^\n]/g, "x") + (source[j] ?? "");
      i = j + 1;
    } else {
      out += char;
      i += 1;
    }
  }
  return out;
}

const PATTERNS = [
  // import x from "a"; import { x } from "a"; import type X from "a"; export { x } from "a"; export * from "a"
  /\b(?:import|export)\s+(?:type\s+)?[\w*{}\s,$]*?\bfrom\s*(["'])(x+)\1/g,
  // import "a" (side effect)
  /\bimport\s*(["'])(x+)\1/g,
  // import("a"), require("a")
  /\b(?:import|require)\s*\(\s*(["'`])(x+)\1\s*\)/g,
];

/** Every import specifier in a module (static, re-export, dynamic, require), in source order. */
export function extractImports(source: string): ImportSpecifier[] {
  const masked = maskSource(source);
  const found: number[][] = [];
  for (const pattern of PATTERNS) {
    for (const match of masked.matchAll(pattern)) {
      // The masked specifier is the last run of `x` in the match.
      const start = (match.index ?? 0) + match[0].lastIndexOf(match[2]);
      found.push([start, start + match[2].length]);
    }
  }
  return found
    .sort((a, b) => a[0] - b[0])
    .map(([start, end]) => ({
      specifier: source.slice(start, end),
      line: source.slice(0, start).split("\n").length,
    }));
}

/** `@scope/pkg/sub` → `@scope/pkg`, `pkg/sub` → `pkg`, `motion@14` → `motion`. */
export function packageName(specifier: string): string {
  const parts = specifier.split("/");
  const name = specifier.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0];
  return name.replace(/(.)@.*$/, "$1");
}

/**
 * mangacn components that items import without declaring them, because users install them
 * explicitly first (SPEC-components §4.4: a bare registryDependency would resolve to shadcn's
 * registry and a namespaced one breaks URL installs). The registry smoke test installs them
 * before every other item.
 */
export const EXPLICIT_INSTALL_IMPORTS = ["@/components/ink-frame"];

/** Install folders (shadcn aliases) that a declared registry dependency can be imported from. */
const REGISTRY_DEPENDENCY_PREFIXES = ["@/components/ui/", "@/components/", "@/lib/", "@/hooks/"];

/**
 * Why `specifier` may not appear in a file shipped by `item`, or `null` when it is allowed.
 * Allowed (SPEC-registry-core §6.5): `react`, `react-dom`, packages in the item's
 * `dependencies`, `@/lib/utils`, `@/components/ink-frame` (installed explicitly), and
 * `@/components/ui/<x>` (or the lib/component/hook alias) where `x` is in the item's
 * `registryDependencies`; relative imports only to another file of the same item.
 */
export function importViolation(
  specifier: string,
  item: Pick<LoadedRegistryItem, "dependencies" | "registryDependencies" | "files">,
  file: string,
): string | null {
  if (specifier.startsWith(".")) {
    const target = path.posix.normalize(path.posix.join(path.posix.dirname(file), specifier));
    const own = item.files.some((entry) => entry.path.replace(/\.[jt]sx?$/, "") === target);
    return own ? null : "relative import outside this item (declare a registryDependency)";
  }

  if (specifier.startsWith("@/")) {
    if (specifier === "@/lib/utils" || EXPLICIT_INSTALL_IMPORTS.includes(specifier)) return null;
    const declared = (item.registryDependencies ?? []).map((dep) => dep.split("/").pop());
    for (const prefix of REGISTRY_DEPENDENCY_PREFIXES) {
      if (!specifier.startsWith(prefix)) continue;
      const name = specifier.slice(prefix.length);
      if (!name.includes("/") && declared.includes(name)) return null;
    }
    return "alias import that is not @/lib/utils or a declared registryDependency";
  }

  const pkg = packageName(specifier);
  if (pkg === "react" || pkg === "react-dom") return null;
  if ((item.dependencies ?? []).map(packageName).includes(pkg)) return null;
  return `package "${pkg}" is not in this item's dependencies`;
}

/** Checks every file in every item's `files[]` against the allow-list. */
export function findImportViolations(
  registry: LoadedRegistry,
  rootDir = process.cwd(),
): ImportViolation[] {
  const violations: ImportViolation[] = [];
  for (const item of registry.items) {
    for (const entry of item.files) {
      const source = readFileSync(path.resolve(rootDir, entry.path), "utf8");
      for (const { specifier, line } of extractImports(source)) {
        const reason = importViolation(specifier, item, entry.path);
        if (reason) violations.push({ item: item.name, file: entry.path, specifier, line, reason });
      }
    }
  }
  return violations;
}

/** One line per violation: `file:line imports "specifier" (item): reason`. */
export function formatImportViolations(violations: ImportViolation[]): string {
  return violations
    .map((v) => `${v.file}:${v.line} imports "${v.specifier}" (${v.item}): ${v.reason}`)
    .join("\n");
}
