import type { Metadata } from "next";
import { type ComponentType, Suspense } from "react";
import { ViewMode } from "./view-mode";

// A page block on its own (`/view/login-01`): the block's page at full width with nothing
// around it, its own `main` and all. The docs page frames it at phone, tablet and desktop widths,
// the Blocks index shows it on a card, and e2e/blocks.spec.ts shoots it. `?mode=dark` renders the
// night theme, as on the demo stage.
//
// Each block has its own static route, `app/view/<block>/page.tsx`, written by `pnpm gen:demos`
// (lib/registry/demo-map.ts) and importing only that block's page: a dynamic segment loading
// pages through the demo map would give every view the whole registry's client code (MANGA-21).

export const VIEW_METADATA: Metadata = { title: "Block view", robots: { index: false } };

/** The view of one page block. The tree is the one the dynamic route had: keep it so. */
export function BlockView({ page: Page }: { page: ComponentType }) {
  return (
    <Suspense fallback={null}>
      <Page />
      {/* After the page, so `data-demo-ready` means the page is on screen too. */}
      <ViewMode />
    </Suspense>
  );
}
