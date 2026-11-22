import { readFileSync } from "node:fs";
import path from "node:path";
import { type LoadedRegistry, loadRegistry } from "@/lib/registry";
import { importSpecifier, installTarget } from "@/lib/registry/install-target";
import { listVariants, type Variant } from "@/lib/registry/variants";

// Variants import items by repo path; a reader copies the code into an app where the shadcn CLI
// installed them, so the docs show the install paths instead. Each shipped file's install path
// comes from its catalog entry: `registry:ui` items land in `components/ui/`, the manga-native
// `registry:component` items in `components/`, manga-motion (`registry:lib`) in `lib/`.

let installPaths: Map<string, string> | undefined;

/** `@/registry/ui/speech-bubble/speech-bubble` → `@/components/speech-bubble`, for every shipped file. */
export function variantInstallPaths(
  registry: LoadedRegistry = loadRegistry(),
): Map<string, string> {
  return new Map(
    registry.items.flatMap((item) =>
      item.files.map((file) => [importSpecifier(file.path), importSpecifier(installTarget(file))]),
    ),
  );
}

/** The catalog's install paths, read once from disk (server only). */
function catalogInstallPaths(): Map<string, string> {
  installPaths ??= variantInstallPaths();
  return installPaths;
}

const REPO_IMPORT = /(["'])(@\/registry\/[A-Za-z0-9/_-]+)\1/g;

/**
 * Rewrites a variant's repo imports of shipped files (`@/registry/ui/<x>/<x>`) to their install
 * paths (`@/components/ui/button`, `@/components/speech-bubble`). Variant-local helpers
 * (`./portrait`) and repo paths that ship nothing are left as they are.
 */
export function rewriteVariantImports(
  source: string,
  paths: Map<string, string> = catalogInstallPaths(),
): string {
  return source.replace(REPO_IMPORT, (match, quote: string, specifier: string) => {
    const target = paths.get(specifier);
    return target ? `${quote}${target}${quote}` : match;
  });
}

/** The variant map entry for one variant; throws naming the item and variant when there is none. */
export function getVariantEntry(item: string, variant: string): Variant {
  const entry = listVariants().find((d) => d.item === item && d.variant === variant);
  if (!entry) {
    const known = listVariants()
      .filter((d) => d.item === item)
      .map((d) => d.variant);
    throw new Error(
      known.length > 0
        ? `Unknown variant "${variant}" for item "${item}" (variants: ${known.join(", ")}).`
        : `Unknown item "${item}": it has no variants in lib/registry/variants.generated.ts.`,
    );
  }
  return entry;
}

/** A variant's source as the docs show it, read from disk at build time with install imports. */
export function getVariantSource(item: string, variant: string): string {
  const { path: file } = getVariantEntry(item, variant);
  // Every variant lives under registry/; naming the folder keeps the bundler's file tracing to it.
  const relative = path.relative("registry", file);
  return rewriteVariantImports(
    readFileSync(path.join(process.cwd(), "registry", relative), "utf8"),
  ).trimEnd();
}
