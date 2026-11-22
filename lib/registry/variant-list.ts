import { pageEntries, variantEntries } from "./variant-list.generated";

// The variants and page blocks as data only. The `/view` and `/gallery` routes read this module, not
// lib/registry/variants.ts: that one's loaders `import()` every variant, and Turbopack gives a route the
// client code of every module its server code can reach that way (MANGA-21).

export interface Variant {
  item: string;
  variant: string;
  path: string;
}

/** Every variant, sorted by item then variant name. */
export function listVariants(): readonly Variant[] {
  return variantEntries;
}

/** Every page block's route file (`registry/blocks/login-01/page.tsx`), sorted by block. */
export function listPages(): readonly { block: string; path: string }[] {
  return pageEntries;
}
