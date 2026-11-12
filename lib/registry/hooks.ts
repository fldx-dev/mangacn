import path from "node:path";
import type { LoadedRegistry, LoadedRegistryItem } from "./index";

// Hooks are stock React hooks that a restyled primitive needs (SPEC-components-4 §4, §7):
// `registry:hook` items in registry/hooks/registry.json, each with its hook file at
// `registry/hooks/<name>.ts`, installed into the user's hooks folder through a
// `@hooks/<name>.ts` target. A hook may ship `registry:lib` companions where stock does
// (use-highlighted-code's `lib/highlighter.tsx`): `registry/hooks/lib/<file>`, installed through
// `@lib/<file>`, the place stock's copy lands. A hook has no docs page and no demo; the item that
// needs it declares it by mangacn URL and imports it from `@/hooks/<name>`.

/** Repo-relative path of the hook catalog, included from the root registry.json. */
export const HOOKS_CATALOG = "registry/hooks/registry.json";

export const HOOK_TYPE = "registry:hook";

export const HOOK_CATEGORY = "hook";

/** Whether an item is a hook (by its type). */
export function isHook(item: Pick<LoadedRegistryItem, "type">): boolean {
  return item.type === HOOK_TYPE;
}

/**
 * The target of a hook's file: `use-mobile` → `@hooks/use-mobile.ts`. `@hooks/` resolves against
 * the user's own `hooks` alias (shadcn 4.23, Task 84's spike); a literal `@/hooks/…` target is
 * written into a folder named `@`. With no target the CLI also picks the hooks folder (by type),
 * but every mangacn file states its target, so the catalog check can pin it.
 */
export function hookTarget(name: string): string {
  return `@hooks/${name}.ts`;
}

export const HOOK_LIB_TYPE = "registry:lib";

/** Repo folder of the hooks' `registry:lib` companions, relative to the hook catalog's folder. */
export const HOOK_LIB_DIR = "lib";

/**
 * The target of a hook's companion lib file: `lib/highlighter.tsx` → `@lib/highlighter.tsx`, so it
 * lands in the user's lib folder where stock's copy does and the hook's `@/lib/highlighter`
 * import resolves.
 */
export function hookLibTarget(path: string): string {
  return `@lib/${path.slice(HOOK_LIB_DIR.length + 1)}`;
}

/**
 * The `@/lib/<stem>` import specifiers of a hook's companion lib files
 * (`registry/hooks/lib/highlighter.tsx` → `@/lib/highlighter`): the only registry files its hook
 * file may import.
 */
export function hookLibSpecifiers(item: Pick<LoadedRegistryItem, "files">): string[] {
  return item.files
    .filter((file) => file.type === HOOK_LIB_TYPE && file.target?.startsWith("@lib/"))
    .map((file) => `@/lib/${(file.target ?? "").slice(5).replace(/\.(tsx?|jsx?)$/, "")}`);
}

/**
 * What is wrong with the hook catalog, one `name: problem` line each: a hook is a
 * `registry:hook` in category `hook`, ships its hook file first, `registry/hooks/<name>.ts`, of
 * type `registry:hook` with the `@hooks/<name>.ts` target, then only `registry:lib` companions at
 * `registry/hooks/lib/<file>` with the `@lib/<file>` target, and depends on no registry item.
 * Items of other types in the hook catalog, and hooks outside it, are problems too.
 */
export function findHookProblems(registry: LoadedRegistry): string[] {
  const problems: string[] = [];
  const dir = path.posix.dirname(HOOKS_CATALOG);
  for (const item of registry.items) {
    if (item.source !== HOOKS_CATALOG) {
      if (isHook(item)) problems.push(`${item.name}: hooks belong in ${HOOKS_CATALOG}`);
      continue;
    }
    const at = (problem: string) => problems.push(`${item.name}: ${problem}`);
    if (!isHook(item)) at(`type is "${item.type}"; expected "${HOOK_TYPE}"`);
    if (item.categories?.[0] !== HOOK_CATEGORY) {
      at(`first category is "${item.categories?.[0]}"; expected "${HOOK_CATEGORY}"`);
    }
    const file = `${dir}/${item.name}.ts`;
    const [first, ...rest] = item.files;
    if (!first) at(`ships no file; expected ${file} first`);
    if (first) {
      if (first.path !== file) at(`ships ${first.path} first; expected ${file}`);
      if (first.type !== HOOK_TYPE) at(`${first.path} has type "${first.type}"`);
      const target = hookTarget(item.name);
      if (first.target !== target) {
        at(`${first.path} has target ${JSON.stringify(first.target)}; expected "${target}"`);
      }
    }
    for (const entry of rest) {
      const libDir = `${dir}/${HOOK_LIB_DIR}/`;
      if (entry.type !== HOOK_LIB_TYPE || !entry.path.startsWith(libDir)) {
        at(`${entry.path} (${entry.type}) is not a ${HOOK_LIB_TYPE} companion in ${libDir}`);
        continue;
      }
      const target = hookLibTarget(entry.path.slice(dir.length + 1));
      if (entry.target !== target) {
        at(`${entry.path} has target ${JSON.stringify(entry.target)}; expected "${target}"`);
      }
    }
    for (const dependency of item.registryDependencies ?? []) {
      at(`depends on "${dependency}" (a hook imports React, its packages and its own lib only)`);
    }
  }
  return problems;
}
