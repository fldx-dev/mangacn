import { loadRegistry } from "@/lib/registry";
import {
  buildVariantItems,
  type ComponentVariant,
  listComponentVariants,
} from "@/lib/registry/variant-items";
import { PACKAGE_MANAGERS, type PackageManager, RUNNERS } from "./package-managers";

/** A component variant as the docs show it: its number, label and title, and whether it installs. */
export interface DocVariant extends ComponentVariant {
  /** False for a variant that imports a site-only file (code-block's highlighter). */
  installable: boolean;
}

let variants: Map<string, DocVariant[]> | undefined;

/** Every component's variants by component, read once from disk (server only). */
function variantsByComponent(): Map<string, DocVariant[]> {
  if (!variants) {
    const registry = loadRegistry();
    const list = listComponentVariants(registry);
    const installable = new Set(buildVariantItems(list, registry).items.map((item) => item.name));
    variants = new Map();
    for (const variant of list) {
      const entry = { ...variant, installable: installable.has(variant.name) };
      variants.set(variant.component, [...(variants.get(variant.component) ?? []), entry]);
    }
  }
  return variants;
}

/** A component's variants in number order; empty for a block or an unknown name. */
export function componentVariants(component: string): readonly DocVariant[] {
  return variantsByComponent().get(component) ?? [];
}

/** One variant by its component and file name, or `undefined` (a block's variant). */
export function docVariant(component: string, file: string): DocVariant | undefined {
  return componentVariants(component).find((variant) => variant.file === file);
}

/** Every component variant, by component then number. */
export function allDocVariants(): readonly DocVariant[] {
  return [...variantsByComponent().values()].flat();
}

/** `pnpm dlx shadcn@latest add @mangacn/c-stamp-3 --overwrite` for every package manager. */
export function variantInstallCommands(name: string): Record<PackageManager, string> {
  return Object.fromEntries(
    PACKAGE_MANAGERS.map((manager) => [
      manager,
      `${RUNNERS[manager]} shadcn@latest add @mangacn/${name} --overwrite`,
    ]),
  ) as Record<PackageManager, string>;
}
