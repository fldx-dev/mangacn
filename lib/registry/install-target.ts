import path from "node:path";
import type { RegistryFile } from "./index";

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

/** A file path as a `@/` import specifier: `components/ui/button.tsx` → `@/components/ui/button`. */
export function importSpecifier(file: string): string {
  return `@/${file.replace(/\.(tsx?|jsx?)$/, "")}`;
}
