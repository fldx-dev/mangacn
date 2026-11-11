import type { Metadata } from "next";
import { Suspense } from "react";
import { listDemos } from "@/lib/registry/demos";
import { DemoMode } from "./[demo]/demo-mode";
import { GalleryItem } from "./gallery-item";

// Gallery page for one item: every demo inline under its name, with a link to the lone stage.
// `?mode=dark` renders the night theme (DemoMode). Overlay items render each demo in an
// iframe of its stage instead (gallery-item.tsx).

export function generateStaticParams() {
  return [...new Set(listDemos().map(({ item }) => item))].map((item) => ({ item }));
}

export const metadata: Metadata = { title: "mangacn gallery", robots: { index: false } };

type ItemPageProps = PageProps<"/demo/[item]">;

export default function ItemGallery({ params }: ItemPageProps) {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-10 text-ink sm:px-8">
      {/* The URL-dependent part renders inside the boundary (Partial Prefetching). */}
      <Suspense fallback={null}>
        <Item params={params} />
        <DemoMode />
      </Suspense>
    </main>
  );
}

async function Item({ params }: Pick<ItemPageProps, "params">) {
  const { item } = await params;
  return <GalleryItem item={item} />;
}
