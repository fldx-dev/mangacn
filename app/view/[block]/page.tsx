import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getPageLoader, listPages } from "@/lib/registry/demos";
import { ViewMode } from "./view-mode";

// A page block on its own (`/view/login-01`): the block's page at full width with nothing
// around it, its own `main` and all. The docs page frames it at phone, tablet and desktop widths,
// the Blocks index shows it on a card, and e2e/blocks.spec.ts shoots it. `?mode=dark` renders the
// night theme, as on the demo stage.

export function generateStaticParams() {
  return listPages().map(({ block }) => ({ block }));
}

// Static on purpose, as on the demo stage: with Partial Prefetching the App Shell is shared by
// every view URL, and a `params` read here (or outside the Suspense below) would tie it to one.
export const metadata: Metadata = { title: "Block view", robots: { index: false } };

type ViewProps = PageProps<"/view/[block]">;

export default function BlockView({ params }: ViewProps) {
  return (
    <Suspense fallback={null}>
      <View params={params} />
      {/* After the page, so `data-demo-ready` means the page is on screen too. */}
      <ViewMode />
    </Suspense>
  );
}

async function View({ params }: Pick<ViewProps, "params">) {
  const { block } = await params;
  const load = getPageLoader(block);
  // Inside the boundary the shell has already streamed, so an unknown block shows the
  // not-found page with a 200 (`dynamicParams = false` is not allowed with cacheComponents).
  if (!load) notFound();
  const { default: Page } = await load();
  return <Page />;
}
