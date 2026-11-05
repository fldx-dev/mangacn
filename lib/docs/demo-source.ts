import { readFileSync } from "node:fs";
import path from "node:path";
import { type LoadedRegistry, loadRegistry } from "@/lib/registry";
import { type Demo, listDemos } from "@/lib/registry/demos";
import { importSpecifier, installTarget } from "@/lib/registry/install-target";

// Demos import items by repo path; a reader copies the code into an app where the shadcn CLI
// installed them, so the docs show the install paths instead. Each shipped file's install path
// comes from its catalog entry: `registry:ui` items land in `components/ui/`, the manga-native
// `registry:component` items in `components/`, manga-motion (`registry:lib`) in `lib/`.

let installPaths: Map<string, string> | undefined;

/** `@/registry/ui/speech-bubble/speech-bubble` → `@/components/speech-bubble`, for every shipped file. */
export function demoInstallPaths(registry: LoadedRegistry = loadRegistry()): Map<string, string> {
  return new Map(
    registry.items.flatMap((item) =>
      item.files.map((file) => [importSpecifier(file.path), importSpecifier(installTarget(file))]),
    ),
  );
}

/** The catalog's install paths, read once from disk (server only). */
function catalogInstallPaths(): Map<string, string> {
  installPaths ??= demoInstallPaths();
  return installPaths;
}

const REPO_IMPORT = /(["'])(@\/registry\/[A-Za-z0-9/_-]+)\1/g;

/**
 * Rewrites a demo's repo imports of shipped files (`@/registry/ui/<x>/<x>`) to their install
 * paths (`@/components/ui/button`, `@/components/speech-bubble`). Demo-local helpers
 * (`./portrait`) and repo paths that ship nothing are left as they are.
 */
export function rewriteDemoImports(
  source: string,
  paths: Map<string, string> = catalogInstallPaths(),
): string {
  return source.replace(REPO_IMPORT, (match, quote: string, specifier: string) => {
    const target = paths.get(specifier);
    return target ? `${quote}${target}${quote}` : match;
  });
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
