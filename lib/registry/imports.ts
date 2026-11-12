import { readFileSync } from "node:fs";
import path from "node:path";
import { isBlock } from "./blocks";
import { HOOKS_CATALOG, isHook } from "./hooks";
import {
  type LoadedRegistry,
  type LoadedRegistryItem,
  mangacnItemName,
  type RegistryFile,
  registryItemUrl,
} from "./index";
import { importSpecifier, installTarget } from "./install-target";
import { loadBlockParitySnapshot, PARITY_PRIMITIVES } from "./parity";

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

/** Install folders (shadcn aliases) that a declared registry dependency can be imported from. */
const REGISTRY_DEPENDENCY_PREFIXES = ["@/components/ui/", "@/components/", "@/lib/", "@/hooks/"];

/** `@/components/ui/button` → `button`; `null` for anything not directly in an install folder. */
function aliasedItemName(specifier: string): string | null {
  for (const prefix of REGISTRY_DEPENDENCY_PREFIXES) {
    if (!specifier.startsWith(prefix)) continue;
    const name = specifier.slice(prefix.length);
    if (!name.includes("/")) return name;
  }
  return null;
}

/** The block a `@/components/blocks/<name>/<file>` specifier imports from, or `null`. */
export function aliasedBlockName(specifier: string): string | null {
  return /^@\/components\/blocks\/([^/]+)\/[^/]+$/.exec(specifier)?.[1] ?? null;
}

/**
 * Why `specifier` may not appear in a file shipped by `item`, or `null` when it is allowed.
 * Allowed (SPEC-registry-core §6.5): `react`, `react-dom`, packages in the item's
 * `dependencies`, `@/lib/utils`, and `@/components/ui/<x>` (or the lib or component alias)
 * where `x` is in the item's `registryDependencies`, as a bare stock name or a
 * `https://www.mangacn.com/r/<x>.json` URL; `@/hooks/<x>` only by that URL (SPEC-components-4
 * §7); relative imports only to another file of the same item.
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

  if (specifier.startsWith("@/hooks/")) {
    // A hook is mangacn's by URL only: a bare `use-mobile` would install shadcn's own copy.
    const name = aliasedItemName(specifier);
    const byUrl = (item.registryDependencies ?? []).some((dep) => mangacnItemName(dep) === name);
    return name && byUrl
      ? null
      : "hook import that is not a hook this item declares by mangacn URL";
  }

  if (specifier.startsWith("@/")) {
    if (specifier === "@/lib/utils") return null;
    const declared = (item.registryDependencies ?? []).map((dep) => mangacnItemName(dep) ?? dep);
    const name = aliasedItemName(specifier);
    if (name && declared.includes(name)) return null;
    return "alias import that is not @/lib/utils or a declared registryDependency";
  }

  const pkg = packageName(specifier);
  if (pkg === "react" || pkg === "react-dom") return null;
  if ((item.dependencies ?? []).map(packageName).includes(pkg)) return null;
  return `package "${pkg}" is not in this item's dependencies`;
}

/**
 * The `@/` specifiers a block may import: the install path of every file of every item it
 * declares by mangacn URL (`@/components/ui/separator`, `@/components/stamp`,
 * `@/components/ink-frame`), as `shadcn add` writes them at the default aliases. A block it
 * declares counts as an item (SPEC-components-4 §3): `reader` declares `spread-viewer` and may
 * import `@/components/blocks/spread-viewer/spread-viewer`.
 */
export function blockImportPaths(
  item: Pick<LoadedRegistryItem, "registryDependencies">,
  catalog: ReadonlyMap<string, Pick<LoadedRegistryItem, "files">>,
): Set<string> {
  const paths = new Set<string>();
  for (const dependency of item.registryDependencies ?? []) {
    const name = mangacnItemName(dependency);
    for (const file of (name && catalog.get(name)?.files) || []) {
      paths.add(importSpecifier(installTarget(file)));
    }
  }
  return paths;
}

/**
 * Why `specifier` may not appear in a file shipped by a block (SPEC-components-3 §3, §10), or
 * `null`: a block composes items, so beyond React, its declared packages, `@/lib/utils` and its
 * own part files (relatively), it imports only the install paths of the items it declares by
 * mangacn URL (`blockImportPaths`), a declared block among them. No bare stock names, no
 * `@/lib/<x>` or `@/hooks/<x>` it did not declare, no undeclared block's files, no
 * `@/components/blocks/…` path to its own parts. Own files are imported relatively where the
 * relative path holds after install too, and by install path only where it does not: a page
 * block's `page.tsx` (installed to `app/<route>/`) imports `@/components/login-form`.
 */
export function blockImportViolation(
  specifier: string,
  item: Pick<LoadedRegistryItem, "dependencies" | "files">,
  file: string,
  allowed: ReadonlySet<string>,
): string | null {
  const self = item.files.find((entry) => entry.path === file);
  if (specifier.startsWith(".")) {
    if (importViolation(specifier, { ...item, registryDependencies: [] }, file)) {
      return "relative import outside this block (import its own part files only)";
    }
    const own = ownFile(specifier, item.files, file);
    // A page block's route lands in app/, away from its components: the path must hold there too.
    if (self && own && !relativeSurvivesInstall(self, own)) {
      return `relative import that misses after install (${own.path} installs to ${installTarget(own)}); import ${importSpecifier(installTarget(own))}`;
    }
    return null;
  }
  if (specifier.startsWith("@/")) {
    if (specifier === "@/lib/utils" || allowed.has(specifier)) return null;
    // An own file by its install path, only where a relative import would not survive install.
    const own = ownFile(specifier, item.files, file);
    if (self && own && own !== self && !relativeSurvivesInstall(self, own)) return null;
    return "alias import that is not @/lib/utils or the install path of an item this block declares by mangacn URL";
  }
  return importViolation(specifier, { ...item, registryDependencies: [] }, file);
}

const withoutExtension = (file: string) => file.replace(/\.[jt]sx?$/, "");

/** The file of `files` a specifier in `file` names, relatively or by its install path. */
function ownFile(
  specifier: string,
  files: readonly RegistryFile[],
  file: string,
): RegistryFile | undefined {
  if (specifier.startsWith(".")) {
    const target = path.posix.normalize(path.posix.join(path.posix.dirname(file), specifier));
    return files.find((entry) => withoutExtension(entry.path) === target);
  }
  return files.find((entry) => importSpecifier(installTarget(entry)) === specifier);
}

/**
 * Whether one relative path from `from` to `to` holds both in this repo and once `shadcn add`
 * has written them: two part files of a block, or two components of a page block, land side
 * by side; a page block's route (`app/login/page.tsx`) and its components do not.
 */
function relativeSurvivesInstall(from: RegistryFile, to: RegistryFile): boolean {
  const relative = (a: string, b: string) => path.posix.relative(path.posix.dirname(a), b);
  return relative(from.path, to.path) === relative(installTarget(from), installTarget(to));
}

/**
 * Why `specifier` may not appear in a hook's file (SPEC-components-4 §7), or `null`: a hook
 * imports React and the platform only. No registry item (it sits below every item), no package,
 * no `@/lib/utils`, no other file.
 */
export function hookImportViolation(specifier: string): string | null {
  const local = specifier.startsWith(".") || specifier.startsWith("@/");
  const pkg = local ? null : packageName(specifier);
  return pkg === "react" || pkg === "react-dom"
    ? null
    : "a hook imports React and the platform only (no registry item, package or other file)";
}

/**
 * Checks every file in every item's `files[]` against the allow-list: `importViolation` for
 * items, `blockImportViolation` (stricter) for blocks, `hookImportViolation` (React only) for
 * hooks and anything else in the hook catalog.
 */
export function findImportViolations(
  registry: LoadedRegistry,
  rootDir = process.cwd(),
): ImportViolation[] {
  const catalog = new Map(registry.items.map((item) => [item.name, item]));
  const violations: ImportViolation[] = [];
  for (const item of registry.items) {
    const hook = isHook(item) || item.source === HOOKS_CATALOG;
    const allowed = isBlock(item) ? blockImportPaths(item, catalog) : undefined;
    for (const entry of item.files) {
      const source = readFileSync(path.resolve(rootDir, entry.path), "utf8");
      for (const { specifier, line } of extractImports(source)) {
        const reason = hook
          ? hookImportViolation(specifier)
          : allowed
            ? blockImportViolation(specifier, item, entry.path, allowed)
            : importViolation(specifier, item, entry.path);
        if (reason) violations.push({ item: item.name, file: entry.path, specifier, line, reason });
      }
    }
  }
  return violations;
}

/** Item types whose files land in an install folder, so a dependent must import them. */
const IMPORTED_TYPES = [
  "registry:ui",
  "registry:component",
  "registry:lib",
  "registry:hook",
  "registry:block",
];

/**
 * Checks every item's `registryDependencies` against its shipped imports (SPEC-registry-core
 * §6.5): stock items by bare name, mangacn items only by `https://www.mangacn.com/r/<name>.json`
 * (a bare `ink-frame` would resolve to shadcn's registry, `@mangacn/ink-frame` fails URL and
 * GitHub-mode installs), every imported mangacn item declared, and every declared mangacn
 * component imported. One `item: problem` line each.
 */
export function findRegistryDependencyProblems(
  registry: LoadedRegistry,
  rootDir = process.cwd(),
): string[] {
  const catalog = new Map(registry.items.map((item) => [item.name, item]));
  // Restyled primitives keep stock names, so a bare `button` is shadcn's and stays bare.
  const mangacnOnly = (name: string) =>
    catalog.has(name) && !(PARITY_PRIMITIVES as readonly string[]).includes(name);
  // A stock-derived block keeps every dependency stock declares, imported or not: stock's
  // login-01 declares `label`, which its form reaches only through `field`.
  const blockParity = loadBlockParitySnapshot(rootDir);
  const keptForParity = (item: string, name: string) =>
    blockParity?.items[item]?.registryDependencies.includes(name) ?? false;
  const problems: string[] = [];
  for (const item of registry.items) {
    const imported = new Set<string>();
    for (const entry of item.files) {
      const source = readFileSync(path.resolve(rootDir, entry.path), "utf8");
      for (const { specifier } of extractImports(source)) {
        // A block's own parts are imported relatively; its alias path is refused elsewhere.
        const name = aliasedItemName(specifier) ?? aliasedBlockName(specifier);
        if (name && name !== item.name) imported.add(name);
      }
    }
    const declared = new Set<string>();
    for (const dep of item.registryDependencies ?? []) {
      const name = mangacnItemName(dep);
      if (dep.startsWith("@")) {
        const url = registryItemUrl(dep.split("/").pop() ?? dep);
        problems.push(`${item.name}: "${dep}" is namespaced; declare ${url}`);
      } else if (name === null && dep.includes(":")) {
        problems.push(`${item.name}: "${dep}" is not a stock name or ${registryItemUrl("<name>")}`);
      } else if (name === null) {
        if (mangacnOnly(dep)) {
          problems.push(
            `${item.name}: "${dep}" resolves to shadcn's registry; declare ${registryItemUrl(dep)}`,
          );
        }
      } else if (!catalog.has(name)) {
        problems.push(`${item.name}: "${dep}" names no item in the catalog`);
      } else {
        declared.add(name);
        const type = catalog.get(name)?.type ?? "";
        if (
          IMPORTED_TYPES.includes(type) &&
          !imported.has(name) &&
          !keptForParity(item.name, name)
        ) {
          problems.push(`${item.name}: declares ${dep} but no shipped file imports it`);
        }
      }
    }
    for (const name of imported) {
      if (mangacnOnly(name) && !declared.has(name)) {
        problems.push(`${item.name}: imports ${name} without declaring ${registryItemUrl(name)}`);
      }
    }
  }
  return problems;
}

/** One line per violation: `file:line imports "specifier" (item): reason`. */
export function formatImportViolations(violations: ImportViolation[]): string {
  return violations
    .map((v) => `${v.file}:${v.line} imports "${v.specifier}" (${v.item}): ${v.reason}`)
    .join("\n");
}
