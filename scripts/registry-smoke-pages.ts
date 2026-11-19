/**
 * The smoke's prerendered pages (SPEC-components-8 §4.1, MANGA-46): `app/smoke/<category>/page.tsx`
 * in the smoke project renders the default demo of every installed item of that catalog
 * category, so `next build` (with `cacheComponents`, as create-next-app sets it) prerenders each
 * item and fails on a clock read during render (`new Date()`, `Date.now()`, `Math.random()`).
 *
 * A demo imports items by repo path (`@/registry/ui/button/button`); its copy in the project
 * imports them by install path (`@/components/ui/button`), as `scripts/registry-rewrite-pages.ts`
 * rewrites a page block's own imports. A variant of a stock family (`login-01` … `login-05`)
 * shares its install paths with its siblings and the next one overwrites them, so its files are
 * copied to `smoke-variants/<name>/` right after its own add and its demo imports the copies.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { PAGE_TYPE } from "../lib/registry/blocks";
import { extractImportOffsets } from "../lib/registry/imports";
import type { LoadedRegistryItem } from "../lib/registry/index";
import { importSpecifier, installTarget } from "../lib/registry/install-target";

/** Where a variant's files are kept in the smoke project, away from its siblings'. */
export const VARIANTS_DIR = "smoke-variants";

/**
 * Items whose default demo cannot render in the smoke project, each with its reason, and the
 * minimal usage rendered in its place when there is one. Every other item renders
 * `<its folder>/demos/default.tsx`.
 */
export const DEMO_EXCEPTIONS: Record<string, { reason: string; usage?: string }> = {
  theme: {
    reason:
      "a theme: CSS variables in globals.css, no component; every smoke page renders under it",
  },
  "theme-sepia": {
    reason: "a theme preset: CSS variables only; every smoke page renders under it",
  },
  "theme-weekly": {
    reason: "a theme preset: CSS variables only; every smoke page renders under it",
  },
  "theme-blueline": {
    reason: "a theme preset: CSS variables only; every smoke page renders under it",
  },
  "font-display": {
    reason: "a font: a next/font loader in app/layout.tsx, which every smoke page prerenders",
  },
  "font-dialogue": {
    reason: "a font: a next/font loader in app/layout.tsx, which every smoke page prerenders",
  },
  "font-dialogue-ja": {
    reason: "a font: a next/font loader in app/layout.tsx, which every smoke page prerenders",
  },
  "use-mobile": {
    reason: "a hook: no demo of its own; a component that calls it",
    usage: `"use client";

import { useIsMobile } from "@/hooks/use-mobile";

export default function UseMobileUsage() {
  const isMobile = useIsMobile();
  return <p>{isMobile ? "Phone layout" : "Wide layout"}</p>;
}
`,
  },
  "use-highlighted-code": {
    reason: "a hook: no demo of its own; a component that calls it",
    usage: `"use client";

import { useHighlightedCode } from "@/hooks/use-highlighted-code";

export default function UseHighlightedCodeUsage() {
  const lines = useHighlightedCode("const ink = 'black';", "ts");
  return (
    <pre>
      {lines.map((line, index) => (
        <span key={String(index)}>{line}</span>
      ))}
    </pre>
  );
}
`,
  },
};

/** An item's default demo in the repo: `registry/ui/button/demos/default.tsx`. */
export function defaultDemoPath(item: Pick<LoadedRegistryItem, "files">): string | undefined {
  const first = item.files[0];
  return first && path.posix.join(path.posix.dirname(first.path), "demos", "default.tsx");
}

/**
 * Repo source path without its extension → the project path it is imported by, also without
 * one: an item's own files at their install targets, a variant's at its copies.
 */
export function installPaths(
  items: readonly Pick<LoadedRegistryItem, "name" | "files">[],
  variants: ReadonlySet<string>,
): Map<string, string> {
  const paths = new Map<string, string>();
  for (const item of items) {
    for (const file of item.files) {
      const target = variants.has(item.name)
        ? variantPath(item.name, installTarget(file))
        : installTarget(file);
      paths.set(stripExtension(file.path), stripExtension(target));
    }
  }
  return paths;
}

/**
 * A demo's source with each `@/registry/…` import at its project path. Throws on a repo import
 * the project lacks (a site-only module, or an item outside the set): such a demo belongs in
 * DEMO_EXCEPTIONS.
 */
export function installDemoSource(
  source: string,
  name: string,
  paths: ReadonlyMap<string, string>,
): string {
  let out = "";
  let from = 0;
  for (const { specifier, start } of extractImportOffsets(source)) {
    if (specifier.startsWith(".")) {
      throw new Error(`${name}: its default demo imports "${specifier}", a file of its own`);
    }
    if (!specifier.startsWith("@/registry/")) continue;
    const target = paths.get(specifier.slice(2));
    if (target === undefined) {
      throw new Error(`${name}: its default demo imports "${specifier}", which is not installed`);
    }
    out += `${source.slice(from, start)}@/${target}`;
    from = start + specifier.length;
  }
  return out + source.slice(from);
}

/**
 * A variant's files as `copyVariant` writes them: every own file but its route, at
 * `smoke-variants/<name>/<install target>`, with imports of its own files pointed at the copies.
 */
export function variantCopies(
  item: Pick<LoadedRegistryItem, "name" | "files">,
  read: (installed: string) => string,
): { file: string; content: string }[] {
  const own = item.files.filter((file) => file.type !== PAGE_TYPE).map(installTarget);
  const specifiers = new Map(
    own.map((target) => [importSpecifier(target), importSpecifier(variantPath(item.name, target))]),
  );
  return own.map((target) => {
    const source = read(target);
    let content = "";
    let from = 0;
    for (const { specifier, start } of extractImportOffsets(source)) {
      const copy = specifiers.get(specifier);
      if (copy === undefined) continue;
      content += source.slice(from, start) + copy;
      from = start + specifier.length;
    }
    return { file: variantPath(item.name, target), content: content + source.slice(from) };
  });
}

/** Copies a just-installed variant's files to `smoke-variants/<name>/` in `project`. */
export function copyVariant(project: string, item: Pick<LoadedRegistryItem, "name" | "files">) {
  for (const { file, content } of variantCopies(item, (installed) =>
    readFileSync(path.join(project, installed), "utf8"),
  )) {
    writeProjectFile(project, file, content);
  }
}

/** One item on a smoke page: its category and the module that renders it. */
export interface SmokeEntry {
  name: string;
  category: string;
  source: string;
}

/**
 * The entry of each item in `rendered` (catalog order), its demo's imports resolved against the
 * `installed` items, and the items left out with their reasons.
 * An item without a default demo that DEMO_EXCEPTIONS does not list is an error, so a new item
 * cannot slip past the prerender.
 */
export function smokeEntries(
  items: readonly LoadedRegistryItem[],
  installed: readonly string[],
  rendered: readonly string[],
  variants: ReadonlySet<string>,
  read: (file: string) => string | undefined,
): { entries: SmokeEntry[]; skipped: { name: string; reason: string }[] } {
  const paths = installPaths(
    items.filter((item) => installed.includes(item.name)),
    variants,
  );
  const entries: SmokeEntry[] = [];
  const skipped: { name: string; reason: string }[] = [];
  for (const item of items) {
    if (!rendered.includes(item.name)) continue;
    const category = item.categories?.[0] ?? "other";
    const exception = DEMO_EXCEPTIONS[item.name];
    if (exception) {
      if (exception.usage) entries.push({ name: item.name, category, source: exception.usage });
      else skipped.push({ name: item.name, reason: exception.reason });
      continue;
    }
    const demo = defaultDemoPath(item);
    const source = demo && read(demo);
    if (source === undefined) {
      throw new Error(`${item.name}: no ${demo ?? "default demo"}; list it in DEMO_EXCEPTIONS`);
    }
    entries.push({
      name: item.name,
      category,
      source: installDemoSource(source, item.name, paths),
    });
  }
  return { entries, skipped };
}

/** `login-01` → `Login01Demo`. */
function componentName(name: string): string {
  const pascal = name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
  return `${pascal}Demo`;
}

/** The project files of the smoke pages: each entry's module, and one page per category. */
export function smokePageFiles(
  entries: readonly SmokeEntry[],
): { file: string; content: string }[] {
  const files: { file: string; content: string }[] = [];
  const categories = [...new Set(entries.map((entry) => entry.category))];
  for (const category of categories) {
    const own = entries.filter((entry) => entry.category === category);
    for (const entry of own) {
      files.push({ file: demoFile(entry), content: entry.source });
    }
    const imports = own
      .map((entry) => `import ${componentName(entry.name)} from "./_demos/${entry.name}";`)
      .join("\n");
    const sections = own
      .map(
        (entry) =>
          `      <section data-item="${entry.name}">\n        <${componentName(entry.name)} />\n      </section>`,
      )
      .join("\n");
    files.push({
      file: `app/smoke/${category}/page.tsx`,
      content: `${imports}\n\n// Generated by scripts/registry-smoke.ts: every ${category} item's default demo, prerendered.\nexport default function Smoke${componentName(category).replace(/Demo$/, "")}Page() {\n  return (\n    <main>\n${sections}\n    </main>\n  );\n}\n`,
    });
  }
  return files;
}

/** Where an entry's module is written: `app/smoke/<category>/_demos/<name>.tsx`. */
export function demoFile(entry: Pick<SmokeEntry, "name" | "category">): string {
  return `app/smoke/${entry.category}/_demos/${entry.name}.tsx`;
}

/** Writes `content` at `file` (POSIX, project-relative), creating its folders. */
export function writeProjectFile(project: string, file: string, content: string) {
  const full = path.join(project, file);
  mkdirSync(path.dirname(full), { recursive: true });
  writeFileSync(full, content);
}

/** A repo file's text, or undefined when it does not exist. */
export function readRepoFile(file: string): string | undefined {
  return existsSync(file) ? readFileSync(file, "utf8") : undefined;
}

function variantPath(name: string, target: string): string {
  return `${VARIANTS_DIR}/${name}/${target}`;
}

function stripExtension(file: string): string {
  return file.replace(/\.(tsx?|jsx?)$/, "");
}
