import path from "node:path";
import { type LoadedRegistry, mangacnItemName, type RegistryFile } from "./index";

// Where `shadcn add` writes a registry file in a consumer project with the default
// `components.json` aliases (`@/components`, `@/components/ui`, `@/lib`, `@/hooks`).

const ALIASES: [prefix: string, dir: string][] = [
  ["@ui/", "components/ui/"],
  ["@components/", "components/"],
  ["@lib/", "lib/"],
  ["@hooks/", "hooks/"],
];

const TYPE_DIRS: Record<string, string> = {
  "registry:ui": "components/ui",
  "registry:component": "components",
  "registry:block": "components",
  "registry:lib": "lib",
  "registry:hook": "hooks",
};

/** `@ui/button.tsx` → `components/ui/button.tsx`; no target → the shadcn default for the type. */
export function installTarget(file: RegistryFile): string {
  if (file.target) {
    const alias = ALIASES.find(([prefix]) => file.target?.startsWith(prefix));
    return alias ? alias[1] + file.target.slice(alias[0].length) : file.target;
  }
  return `${TYPE_DIRS[file.type] ?? "components"}/${path.posix.basename(file.path)}`;
}

/**
 * The install targets of every mangacn item `name` depends on, depth first in declaration order,
 * each once: power-gauge → ink-frame's and sfx-text's files. Dependencies outside mangacn
 * (shadcn's own items) are not followed, and the item's own files are left out.
 */
export function dependencyFiles(name: string, registry: LoadedRegistry): string[] {
  const byName = new Map(registry.items.map((item) => [item.name, item]));
  const seen = new Set([name]);
  const files: string[] = [];
  const visit = (itemName: string) => {
    for (const dependency of byName.get(itemName)?.registryDependencies ?? []) {
      const depName = mangacnItemName(dependency);
      if (!depName || seen.has(depName)) continue;
      seen.add(depName);
      const depItem = byName.get(depName);
      if (!depItem) continue;
      files.push(...depItem.files.map(installTarget));
      visit(depName);
    }
  };
  visit(name);
  const own = new Set(byName.get(name)?.files.map(installTarget) ?? []);
  return [...new Set(files)].filter((file) => !own.has(file));
}

/** A file path as a `@/` import specifier: `components/ui/button.tsx` → `@/components/ui/button`. */
export function importSpecifier(file: string): string {
  return `@/${file.replace(/\.(tsx?|jsx?)$/, "")}`;
}
