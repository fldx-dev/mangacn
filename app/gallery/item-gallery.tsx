import type { Metadata } from "next";
import { type ComponentType, Suspense } from "react";
import { GalleryItem } from "./gallery-item";
import { VariantMode } from "./variant-mode";

// Gallery page for one item: every variant inline under its name, with a link to the lone stage.
// `?mode=dark` renders the night theme (VariantMode). Overlay items render each variant in an
// iframe of its stage instead (gallery-item.tsx).
//
// Each item has its own static route, `app/gallery/<item>/page.tsx`, written by `pnpm gen:variants`
// (lib/registry/variant-map.ts) and importing only that item's variants (MANGA-21).

export const GALLERY_METADATA: Metadata = { title: "Gallery", robots: { index: false } };

export interface ItemGalleryProps {
  item: string;
  /** The item's variants by name. */
  variants: Record<string, ComponentType>;
}

/** The gallery of one item. The tree is the one the dynamic route had: keep it so. */
export function ItemGallery({ item, variants }: ItemGalleryProps) {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-10 text-ink sm:px-8">
      <Suspense fallback={null}>
        <GalleryItem item={item} variants={variants} />
        <VariantMode label={item} />
      </Suspense>
    </main>
  );
}
