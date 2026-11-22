import { pageLoaders, type VariantLoader, variantLoaders } from "./variants.generated";

export type { Variant } from "./variant-list";
export { listPages, listVariants } from "./variant-list";
export type { VariantLoader, VariantModule } from "./variants.generated";

/** The lazy loader for one variant, or `undefined` when the item or variant does not exist. */
export function getVariantLoader(item: string, variant: string): VariantLoader | undefined {
  if (!Object.hasOwn(variantLoaders, item)) return undefined;
  const variants = variantLoaders[item];
  return Object.hasOwn(variants, variant) ? variants[variant] : undefined;
}

/** The lazy loader of a page block's page (its default export), or `undefined`. */
export function getPageLoader(block: string): VariantLoader | undefined {
  return Object.hasOwn(pageLoaders, block) ? pageLoaders[block] : undefined;
}
