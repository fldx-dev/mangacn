import { mangacnItemName } from "./registry/index";

/**
 * The Playwright filter (`E2E_ITEMS`): which demos and specs a change needs. `e2e/playwright.config.ts`
 * and the specs read it; `scripts/changed-e2e.ts` computes it from a diff (Task 64).
 *
 * `E2E_ITEMS` is a comma-separated list of item names (their demos, `e2e/demos.spec.ts`) and the
 * suites below; unset, empty or `all` runs everything; `none` runs nothing.
 */
export const E2E_SUITES = ["site", "mcp", "annotations"] as const;
export type E2eSuite = (typeof E2E_SUITES)[number];

export function isE2eSuite(name: string): name is E2eSuite {
  return (E2E_SUITES as readonly string[]).includes(name);
}

/** `E2E_ITEMS` parsed: `undefined` means everything; an empty set means nothing. */
export function parseE2eItems(value: string | undefined): Set<string> | undefined {
  const raw = value?.trim();
  if (!raw || raw === "all") return undefined;
  if (raw === "none") return new Set();
  return new Set(
    raw
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean),
  );
}

/** The inverse of `parseE2eItems`: items in name order, then the suites. */
export function formatE2eItems(selection: ReadonlySet<string> | undefined): string {
  if (!selection) return "all";
  if (selection.size === 0) return "none";
  const items = [...selection].filter((name) => !isE2eSuite(name)).sort();
  return [...items, ...E2E_SUITES.filter((suite) => selection.has(suite))].join(",");
}

/** The demo items in a selection (`undefined` = every item). */
export function selectedDemoItems(
  selection: ReadonlySet<string> | undefined,
): string[] | undefined {
  return selection && [...selection].filter((name) => !isE2eSuite(name));
}

export interface E2eItem {
  name: string;
  /** Repo-relative POSIX folder of the item's files (`registry/ui/slider`); none for fonts. */
  folder?: string;
  /** Whether `<folder>/demos/default.tsx` exists, i.e. the item has demos to screenshot. */
  hasDemos: boolean;
  /** Catalog items this one renders: its registryDependencies plus what its files import. */
  uses: string[];
}

export interface E2eSources {
  items: E2eItem[];
  /** A file's content at the merge base, `undefined` if it did not exist there. */
  before(path: string): string | undefined;
  /** A file's content now, `undefined` if it was deleted. */
  after(path: string): string | undefined;
}

export interface E2eSelection {
  /** `undefined` = everything. */
  selection: Set<string> | undefined;
  /** One line per path that decided something, for the log. */
  reasons: string[];
}

const EVERYTHING: (string | RegExp)[] = [
  // The suite's own wiring and the readiness wait every snapshot goes through.
  "e2e/playwright.config.ts",
  "e2e/demos.spec.ts",
  "e2e/ready.ts",
  // What every demo stage renders inside: the root layout, its CSS, the stage route.
  "app/globals.css",
  "app/layout.tsx",
  "app/mangacn-theme.css",
  /^app\/demo\//,
  // InkFrame draws almost every outline; the registry library builds the theme CSS and demo map.
  /^registry\/theme\/ink-frame\//,
  "registry.json",
  /^lib\/registry\//,
  "lib/e2e-filter.ts", // these rules themselves
  "lib/utils.ts",
  "scripts/gen-demos.ts",
  "scripts/gen-theme-css.ts",
  // Build and dependency inputs.
  "next.config.ts",
  "tsconfig.json",
  "components.json",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
  ".nvmrc",
  /^postcss\.config\./,
];

/** A path may select several suites: the MCP serves the docs pages and the props tables too. */
const SUITE_RULES: { suite: E2eSuite; paths: (string | RegExp)[] }[] = [
  {
    suite: "mcp",
    paths: [
      /^lib\/mcp\//,
      /^app\/api\/mcp\//,
      "e2e/mcp.spec.ts",
      /^skills\//,
      /^content\//,
      /^lib\/docs\//,
      "scripts/gen-props.ts",
    ],
  },
  { suite: "annotations", paths: ["e2e/annotations.spec.ts"] },
  {
    suite: "site",
    paths: [
      /^app\/(?!api\/mcp\/)/,
      /^components\//,
      /^content\//,
      /^lib\/docs\//,
      "e2e/site.spec.ts",
      "scripts/gen-docs.ts",
      "scripts/gen-props.ts",
      /^source\.config\./,
    ],
  },
];

/** Unit tests and their data, anywhere: checked before every other rule. */
const TEST_ONLY: RegExp[] = [
  /\.test\.(ts|tsx|mts)$/,
  /(^|\/)__snapshots__\//,
  /(^|\/)__fixtures__\//,
];

/** Paths no snapshot or spec depends on. */
const NOTHING: (string | RegExp)[] = [
  /\.md$/,
  /^\.github\//,
  /^\.claude\//,
  /^scripts\//,
  /^lib\/test\//,
  /^tasks\//,
  /^registry\/[^/]+\/[^/]+$/, // README.md, catalog tests (registry.json is handled first)
  /^registry\/ui\/__parity__\//,
  /^e2e\/__screenshots__\//, // baselines that match no demo or page
  /^vitest\./,
  "biome.json",
  ".gitignore",
  ".gitattributes",
  ".editorconfig",
  "LICENSE",
  "font-specimen.html",
];

function matches(path: string, patterns: (string | RegExp)[]): boolean {
  return patterns.some((pattern) =>
    typeof pattern === "string" ? pattern === path : pattern.test(path),
  );
}

function parseJson(text: string | undefined): unknown {
  if (text === undefined) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

/** Whether package.json changed in anything but its scripts (dependencies, engines, …). */
function packageJsonMatters(sources: E2eSources): boolean {
  const strip = (text: string | undefined) => {
    const json = parseJson(text) as Record<string, unknown> | undefined;
    if (!json) return text;
    const { scripts, ...rest } = json;
    const build = scripts as Record<string, string> | undefined;
    return JSON.stringify({ ...rest, build: [build?.prebuild, build?.build, build?.start] });
  };
  return strip(sources.before("package.json")) !== strip(sources.after("package.json"));
}

/**
 * Items whose catalog entry differs between the two versions of a `registry/<cat>/registry.json`,
 * or `undefined` when the change reaches every demo (the theme catalog, or any item's CSS).
 */
function changedCatalogEntries(path: string, sources: E2eSources): string[] | undefined {
  const entries = (text: string | undefined) => {
    const doc = parseJson(text) as { items?: { name: string }[] } | undefined;
    return new Map((doc?.items ?? []).map((item) => [item.name, item as Record<string, unknown>]));
  };
  const before = entries(sources.before(path));
  const after = entries(sources.after(path));
  const changed: string[] = [];
  for (const name of new Set([...before.keys(), ...after.keys()])) {
    const a = before.get(name);
    const b = after.get(name);
    if (JSON.stringify(a) === JSON.stringify(b)) continue;
    if (path === "registry/theme/registry.json") return undefined;
    for (const key of ["css", "cssVars", "tailwind"]) {
      if (JSON.stringify(a?.[key]) !== JSON.stringify(b?.[key])) return undefined;
    }
    changed.push(name);
  }
  return changed;
}

/**
 * The item a path alias names: `@/components/ui/<x>` and `@/components/<x>` name `<x>`,
 * `@/components/blocks/<x>/...` names block `<x>`, `@/hooks/<x>` names the item whose folder
 * holds its target (a hook has no demo of its own). `undefined` for any other alias.
 */
function aliasItem(key: string, target: unknown): string | undefined {
  const named =
    /^@\/components\/ui\/([a-z0-9-]+)$/.exec(key) ??
    /^@\/components\/blocks\/([a-z0-9-]+)(?:\/[^*]+)?$/.exec(key) ??
    /^@\/components\/(?!ui$|blocks$)([a-z0-9-]+)$/.exec(key);
  if (named) return named[1];
  if (/^@\/hooks\/[a-z0-9-]+$/.test(key) && Array.isArray(target) && target.length === 1) {
    return /^\.\/registry\/[^/]+\/([^/]+)\//.exec(String(target[0]))?.[1];
  }
  return undefined;
}

/**
 * The items named by a `tsconfig.json` diff that only adds path aliases, or `undefined` when the
 * diff is anything else: a `compilerOptions` change, a removed, edited or reordered alias, a file
 * that is not plain JSON, an alias that names no catalog item.
 */
function addedAliasItems(sources: E2eSources, names: ReadonlySet<string>): string[] | undefined {
  type Config = { compilerOptions?: { paths?: Record<string, unknown> } };
  const before = parseJson(sources.before("tsconfig.json")) as Config | undefined;
  const after = parseJson(sources.after("tsconfig.json")) as Config | undefined;
  const pathsBefore = before?.compilerOptions?.paths;
  const pathsAfter = after?.compilerOptions?.paths;
  if (!pathsBefore || !pathsAfter) return undefined;
  const without = (config: Config) =>
    JSON.stringify({ ...config, compilerOptions: { ...config.compilerOptions, paths: null } });
  if (without(before) !== without(after)) return undefined;

  // Every alias that was there keeps its value and its order; the rest are new.
  const kept = Object.keys(pathsAfter).filter((key) => key in pathsBefore);
  if (kept.join("\n") !== Object.keys(pathsBefore).join("\n")) return undefined;
  if (kept.some((key) => JSON.stringify(pathsBefore[key]) !== JSON.stringify(pathsAfter[key]))) {
    return undefined;
  }
  const added = Object.keys(pathsAfter).filter((key) => !(key in pathsBefore));
  if (added.length === 0) return undefined;
  const items = added.map((key) => aliasItem(key, pathsAfter[key]));
  if (items.some((name) => name === undefined || !names.has(name))) return undefined;
  return [...new Set(items as string[])];
}

const PARITY_PATH = "lib/registry/parity.ts";
const PARITY_LIST = /(export const PARITY_PRIMITIVES = \[)([^\]]*)(\] as const;)/;

/**
 * The names a `lib/registry/parity.ts` diff appends to `PARITY_PRIMITIVES`, or `undefined` when
 * the diff is anything else (another line of the file, a removed or reordered name).
 */
function appendedParityNames(sources: E2eSources): string[] | undefined {
  const before = sources.before(PARITY_PATH);
  const after = sources.after(PARITY_PATH);
  const listBefore = before && PARITY_LIST.exec(before);
  const listAfter = after && PARITY_LIST.exec(after);
  if (!before || !after || !listBefore || !listAfter) return undefined;
  if (before.replace(PARITY_LIST, "$1$3") !== after.replace(PARITY_LIST, "$1$3")) return undefined;
  const entries = (body: string) =>
    body
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  const namesBefore = entries(listBefore[2]);
  const namesAfter = entries(listAfter[2]);
  // The old entries, untouched and first (only the last may gain the comma it was missing).
  const last = namesBefore.length - 1;
  for (const [index, line] of namesBefore.entries()) {
    const now = namesAfter[index];
    if (now !== line && !(index === last && now === `${line},`)) return undefined;
  }
  const appended = namesAfter.slice(namesBefore.length);
  if (appended.length === 0) return undefined;
  const names = appended.map((line) => /^"([a-z0-9-]+)",?$/.exec(line)?.[1]);
  if (names.some((name) => name === undefined)) return undefined;
  return names as string[];
}

/** The longest item name that `file` (`toggle-group-default-dark`) starts with, plus a dash. */
function itemOfBaseline(file: string, items: E2eItem[]): string | undefined {
  return items
    .filter((item) => item.hasDemos && file.startsWith(`${item.name}-`))
    .sort((a, b) => b.name.length - a.name.length)[0]?.name;
}

/**
 * The filter for a set of changed paths (repo-relative, POSIX):
 *
 * - an item's folder (`registry/<cat>/<item>/`, tests aside) or catalog entry → that item, every
 *   item that uses it (registryDependencies or an import, transitively), and `site`, whose
 *   component index renders every item's default demo; `ink-mark`/`ink-arrow` add `annotations`
 * - a baseline PNG → its item, or `site` for `site-*.png`
 * - `lib/mcp/`, `app/api/mcp/`, `skills/`, the MCP spec → `mcp`; `content/`, `lib/docs/` and the
 *   props generator → `mcp` and `site` (the MCP serves pages and props tables)
 * - other `app/`, `components/`, the site spec → `site`
 * - `tsconfig.json` that only adds path aliases → the items they name and the items that use
 *   them (no `site`); `lib/registry/parity.ts` that only appends names → those items
 * - the suite's config, demo spec or readiness wait, the demo stage, root layout and CSS,
 *   `ink-frame`, any other `tsconfig.json` or `lib/registry/` change, the theme catalog or any
 *   item's CSS, a dependency → everything
 * - tests, Markdown, scripts, CI → nothing; any other path → everything
 */
export function selectE2e(paths: string[], sources: E2eSources): E2eSelection {
  const byName = new Map(sources.items.map((item) => [item.name, item]));
  const usedBy = new Map<string, string[]>();
  for (const item of sources.items) {
    for (const dependency of item.uses) {
      usedBy.set(dependency, [...(usedBy.get(dependency) ?? []), item.name]);
    }
  }

  const selected = new Set<string>();
  const reasons: string[] = [];
  const everything = (path: string, why: string): E2eSelection => ({
    selection: undefined,
    reasons: [...reasons, `${path} → everything (${why})`],
  });
  const addItem = (path: string, name: string, site = true) => {
    const reached = new Set<string>();
    const visit = (current: string) => {
      if (reached.has(current)) return;
      reached.add(current);
      for (const user of usedBy.get(current) ?? []) visit(user);
    };
    visit(name);
    const withDemos = [...reached].filter((item) => byName.get(item)?.hasDemos).sort();
    for (const item of withDemos) selected.add(item);
    if (site) selected.add("site");
    if (reached.has("ink-mark") || reached.has("ink-arrow")) selected.add("annotations");
    const users = withDemos.filter((item) => item !== name);
    reasons.push(
      `${path} → ${name}${users.length > 0 ? ` + users ${users.join(", ")}` : ""}${site ? " + site" : ""}`,
    );
  };

  for (const path of [...new Set(paths)].sort()) {
    if (matches(path, TEST_ONLY)) continue;

    const baseline = /^e2e\/__screenshots__\/linux\/w\d+\/(.+)\.png$/.exec(path);
    if (baseline) {
      const file = baseline[1];
      const owner = file.startsWith("site-") ? "site" : itemOfBaseline(file, sources.items);
      if (owner) {
        selected.add(owner);
        reasons.push(`${path} → ${owner}`);
      }
      continue;
    }

    if (path === "package.json") {
      if (packageJsonMatters(sources)) return everything(path, "dependencies or build scripts");
      continue;
    }

    const catalog = /^registry\/[^/]+\/registry\.json$/.exec(path);
    if (catalog) {
      const names = changedCatalogEntries(path, sources);
      if (names === undefined) return everything(path, "theme catalog or an item's CSS");
      for (const name of names) {
        if (byName.has(name)) addItem(path, name);
      }
      continue;
    }

    // An alias or a parity name reaches only what it names; any other edit falls through to
    // everything below.
    if (path === "tsconfig.json") {
      const named = addedAliasItems(sources, new Set(byName.keys()));
      if (!named) return everything(path, "not only added path aliases");
      for (const name of named) addItem(`${path} alias`, name, false);
      continue;
    }

    if (path === PARITY_PATH) {
      const named = appendedParityNames(sources);
      if (!named || named.some((name) => !byName.has(name))) {
        return everything(path, "not only names appended to PARITY_PRIMITIVES");
      }
      const withDemos = named.filter((name) => byName.get(name)?.hasDemos).sort();
      for (const name of withDemos) selected.add(name);
      reasons.push(`${path} → ${withDemos.join(", ") || "nothing"} (parity names)`);
      continue;
    }

    if (matches(path, EVERYTHING)) return everything(path, "every snapshot depends on it");

    const folder = /^registry\/[^/]+\/([^/]+)\//.exec(path);
    if (folder && byName.has(folder[1])) {
      addItem(path, folder[1]);
      continue;
    }

    const suites = SUITE_RULES.filter((rule) => matches(path, rule.paths)).map(
      (rule) => rule.suite,
    );
    if (suites.length > 0) {
      for (const suite of suites) selected.add(suite);
      reasons.push(`${path} → ${suites.join(", ")}`);
      continue;
    }

    if (matches(path, NOTHING)) continue;
    return everything(path, "unclassified path");
  }

  return { selection: selected, reasons };
}

/** Catalog items a source file imports, by registry path or install path (`@/components/ui/x`, `@/lib/x`). */
export function importedItems(source: string, names: ReadonlySet<string>): string[] {
  const found = new Set<string>();
  const pattern = /["']@\/(?:registry\/[^/"']+|components(?:\/ui)?|lib)\/([a-z0-9-]+)/g;
  for (const match of source.matchAll(pattern)) {
    if (names.has(match[1])) found.add(match[1]);
  }
  return [...found];
}

/** An item's registryDependencies that are catalog items, by URL or bare name. */
export function dependencyItems(
  registryDependencies: string[] | undefined,
  names: ReadonlySet<string>,
): string[] {
  return (registryDependencies ?? [])
    .map((dependency) => mangacnItemName(dependency) ?? dependency)
    .filter((name) => names.has(name));
}
