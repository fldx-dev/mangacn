import { readFileSync } from "node:fs";
import path from "node:path";
import { type Demo, listDemos } from "@/lib/registry/demos";

// Demos import items by repo path; a reader copies the code into an app where the shadcn CLI
// installed them, so the docs show the install paths instead.
const INSTALL_PATHS: [RegExp, string][] = [
  [/(["'])@\/registry\/ui\/([a-z0-9-]+)\/\2\1/g, "$1@/components/ui/$2$1"],
  // ink-frame installs to its own target (registry:component), manga-motion as a registry:lib.
  [/(["'])@\/registry\/theme\/ink-frame\/ink-frame\1/g, "$1@/components/ink-frame$1"],
  [/(["'])@\/registry\/theme\/manga-motion\/manga-motion\1/g, "$1@/lib/manga-motion$1"],
];

/**
 * Rewrites a demo's repo imports (`@/registry/ui/<x>/<x>`) to install paths
 * (`@/components/ui/<x>`). Demo-local helpers (`./portrait`) are left as they are.
 */
export function rewriteDemoImports(source: string): string {
  return INSTALL_PATHS.reduce(
    (code, [pattern, replacement]) => code.replace(pattern, replacement),
    source,
  );
}

/** The demo map entry for one demo; throws naming the item and demo when there is none. */
export function getDemoEntry(item: string, demo: string): Demo {
  const entry = listDemos().find((d) => d.item === item && d.demo === demo);
  if (!entry) {
    const known = listDemos()
      .filter((d) => d.item === item)
      .map((d) => d.demo);
    throw new Error(
      known.length > 0
        ? `Unknown demo "${demo}" for item "${item}" (demos: ${known.join(", ")}).`
        : `Unknown item "${item}": it has no demos in lib/registry/demos.generated.ts.`,
    );
  }
  return entry;
}

/** A demo's source as the docs show it, read from disk at build time with install imports. */
export function getDemoSource(item: string, demo: string): string {
  const { path: file } = getDemoEntry(item, demo);
  // Every demo lives under registry/; naming the folder keeps the bundler's file tracing to it.
  const relative = path.relative("registry", file);
  return rewriteDemoImports(
    readFileSync(path.join(process.cwd(), "registry", relative), "utf8"),
  ).trimEnd();
}
