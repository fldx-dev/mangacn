import { variantMeta } from "@/lib/registry/variant-meta.generated";
import { PACKAGE_MANAGERS, type PackageManager, RUNNERS } from "./package-managers";

/**
 * A component variant as the docs show it: its install name, number, label and title, and
 * whether it installs. Read from lib/registry/variant-meta.generated.ts, which `pnpm
 * gen:variants` writes from registry/ui/<component>/variants.json: the docs layout and pages
 * read no files, so their server bundles stay small (SPEC-components-10 §4.2).
 */
export interface DocVariant {
  component: string;
  n: number;
  /** The variant file's name without `.tsx`. */
  file: string;
  label: string;
  title: string;
  /** `c-<component>-<n>`. */
  name: string;
  /** False for a variant that imports a file no item ships. */
  installable: boolean;
}

let byComponent: Map<string, DocVariant[]> | undefined;

/** Every component's variants by component, in number order. */
function variantsByComponent(): Map<string, DocVariant[]> {
  if (!byComponent) {
    byComponent = new Map();
    for (const variant of variantMeta) {
      byComponent.set(variant.component, [...(byComponent.get(variant.component) ?? []), variant]);
    }
  }
  return byComponent;
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
  return variantMeta;
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
