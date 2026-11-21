import type { Metadata } from "next";
import { type ComponentType, Suspense } from "react";
import { STAGE_FOCUS_SCRIPT } from "@/lib/docs/stage-focus";
import { DemoMode } from "./demo-mode";

// Demo stage: one demo, centred on paper, no chrome. Playwright drives it now and
// docs-site embeds it later (SPEC-components §2). `?mode=dark` renders the night theme and
// `?theme=<preset>` a theme preset (Task 99).
//
// Each demo has its own static route, `app/demo/<item>/<demo>/page.tsx`, written by
// `pnpm gen:demos` (lib/registry/demo-map.ts) and importing only that demo: a dynamic segment
// loading demos through the demo map would give every stage the whole registry's client code
// (MANGA-21). The theme specimen (theme-specimen.tsx) is served the same way, at
// `/demo/theme/specimen`.

export const STAGE_METADATA: Metadata = { title: "Demo", robots: { index: false } };

export interface DemoStageProps {
  item: string;
  demo: string;
  component: ComponentType;
}

/** The stage of one demo. The tree is the one the dynamic route had: keep it so. */
export function DemoStage({ item, demo, component: Component }: DemoStageProps) {
  return (
    <main
      data-slot="demo-stage"
      // Named per demo (the label is in DemoMode), so stages embedded in a docs page do not
      // repeat the page's own main.
      aria-labelledby="demo-stage-label"
      className="flex flex-1 items-center justify-center bg-paper p-4 text-ink sm:p-8"
    >
      <Suspense fallback={null}>
        <Component />
        {/* After the demo, so `data-demo-ready` means the demo is on the page too. */}
        <DemoMode item={item} demo={demo} />
        {/*
          Embedded in a docs page, a stage does not take the reader's focus until they go there
          (lib/docs/stage-focus.ts). Inline, so it runs as the document is parsed, before the
          demo hydrates and opens anything. Last of the three on purpose: a child anywhere else,
          or a fourth one, would shift the demo's `useId` values, which seed every rough.js
          drawing (run 42834768374: every outline moved).
        */}
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: a constant script of our own */}
        <script dangerouslySetInnerHTML={{ __html: STAGE_FOCUS_SCRIPT }} />
      </Suspense>
    </main>
  );
}
