import type { Metadata } from "next";
import { type ComponentType, Suspense } from "react";
import { STAGE_FOCUS_SCRIPT } from "@/lib/docs/stage-focus";
import { variantDisplayName } from "@/lib/docs/variant-meta";
import { VariantMode } from "./variant-mode";

// Variant stage: one variant, centred on paper, no chrome. Playwright drives it now and
// docs-site embeds it later (SPEC-components §2). `?mode=dark` renders the night theme and
// `?theme=<preset>` a theme preset (Task 99).
//
// Each variant has its own static route, `app/gallery/<item>/<variant>/page.tsx`, written by
// `pnpm gen:variants` (lib/registry/variant-map.ts) and importing only that variant: a dynamic segment
// loading variants through the variant map would give every stage the whole registry's client code
// (MANGA-21). The theme specimen (theme-specimen.tsx) is served the same way, at
// `/gallery/theme/specimen`.

export const STAGE_METADATA: Metadata = { title: "Variant", robots: { index: false } };

export interface VariantStageProps {
  item: string;
  variant: string;
  component: ComponentType;
}

/** The stage of one variant. The tree is the one the dynamic route had: keep it so. */
export function VariantStage({ item, variant, component: Component }: VariantStageProps) {
  return (
    <main
      data-slot="variant-stage"
      // Named per variant (the label is in VariantMode), so stages embedded in a docs page do not
      // repeat the page's own main.
      aria-labelledby="variant-stage-label"
      className="flex flex-1 items-center justify-center bg-paper p-4 text-ink sm:p-8"
    >
      <Suspense fallback={null}>
        <Component />
        {/* After the variant, so `data-variant-ready` means the variant is on the page too. */}
        <VariantMode label={variantDisplayName(item, variant)} />
        {/*
          Embedded in a docs page, a stage does not take the reader's focus until they go there
          (lib/docs/stage-focus.ts). Inline, so it runs as the document is parsed, before the
          variant hydrates and opens anything. Last of the three on purpose: a child anywhere else,
          or a fourth one, would shift the variant's `useId` values, which seed every rough.js
          drawing (run 42834768374: every outline moved).
        */}
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: a constant script of our own */}
        <script dangerouslySetInnerHTML={{ __html: STAGE_FOCUS_SCRIPT }} />
      </Suspense>
    </main>
  );
}
