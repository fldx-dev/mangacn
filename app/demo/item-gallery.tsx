import type { Metadata } from "next";
import { type ComponentType, Suspense } from "react";
import { DemoMode } from "./demo-mode";
import { GalleryItem } from "./gallery-item";

// Gallery page for one item: every demo inline under its name, with a link to the lone stage.
// `?mode=dark` renders the night theme (DemoMode). Overlay items render each demo in an
// iframe of its stage instead (gallery-item.tsx).
//
// Each item has its own static route, `app/demo/<item>/page.tsx`, written by `pnpm gen:demos`
// (lib/registry/demo-map.ts) and importing only that item's demos (MANGA-21).

export const GALLERY_METADATA: Metadata = { title: "Gallery", robots: { index: false } };

export interface ItemGalleryProps {
  item: string;
  /** The item's demos by name. */
  demos: Record<string, ComponentType>;
}

/** The gallery of one item. The tree is the one the dynamic route had: keep it so. */
export function ItemGallery({ item, demos }: ItemGalleryProps) {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-10 text-ink sm:px-8">
      <Suspense fallback={null}>
        <GalleryItem item={item} demos={demos} />
        <DemoMode item={item} />
      </Suspense>
    </main>
  );
}
