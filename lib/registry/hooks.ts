import path from "node:path";
import type { LoadedRegistry, LoadedRegistryItem } from "./index";

// Hooks are stock React hooks that a restyled primitive needs (SPEC-components-4 §4, §7):
// `registry:hook` items in registry/hooks/registry.json, one file each at
// `registry/hooks/<name>.ts`, installed into the user's hooks folder through a
// `@hooks/<name>.ts` target. A hook has no docs page and no demo; the item that needs it declares
// it by mangacn URL and imports it from `@/hooks/<name>`.

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

/**
 * What is wrong with the hook catalog, one `name: problem` line each: a hook is a
 * `registry:hook` in category `hook`, ships exactly one file, `registry/hooks/<name>.ts`, of type
 * `registry:hook` with the `@hooks/<name>.ts` target, and depends on no registry item. Items of
 * other types in the hook catalog, and hooks outside it, are problems too.
 */
export function findHookProblems(registry: LoadedRegistry): string[] {
  const problems: string[] = [];
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
    const file = `${path.posix.dirname(HOOKS_CATALOG)}/${item.name}.ts`;
    if (item.files.length !== 1) at(`ships ${item.files.length} files; expected one, ${file}`);
    for (const entry of item.files) {
      if (entry.path !== file) at(`ships ${entry.path}; expected ${file}`);
      if (entry.type !== HOOK_TYPE) at(`${entry.path} has type "${entry.type}"`);
      const target = hookTarget(item.name);
      if (entry.target !== target) {
        at(`${entry.path} has target ${JSON.stringify(entry.target)}; expected "${target}"`);
      }
    }
    for (const dependency of item.registryDependencies ?? []) {
      at(`depends on "${dependency}" (a hook imports React and the platform only)`);
    }
  }
  return problems;
}
