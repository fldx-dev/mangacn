import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { type ComponentType, Suspense } from "react";
import { STAGE_FOCUS_SCRIPT } from "@/lib/docs/stage-focus";
import { getDemoLoader, listDemos } from "@/lib/registry/demos";
import { DemoMode } from "./demo-mode";

// Demo stage: one demo, centred on paper, no chrome. Playwright drives it now and
// docs-site embeds it later (SPEC-components §2). `?mode=dark` renders the night theme and
// `?theme=<preset>` a theme preset (Task 99).

/**
 * Stages that are not an item's demo: the theme specimen, a dozen items' default demos on one
 * page so one screenshot shows a look. Served here, not by a route of its own, because a static
 * `demo/theme` segment would appear in every stage's route tree and change its HTML.
 */
const EXTRA_STAGES: Record<string, Record<string, () => Promise<{ default: ComponentType }>>> = {
  theme: { specimen: () => import("./theme-specimen") },
};

function stageLoader(item: string, demo: string) {
  const extra = Object.hasOwn(EXTRA_STAGES, item) ? EXTRA_STAGES[item] : undefined;
  return (
    getDemoLoader(item, demo) ?? (extra && Object.hasOwn(extra, demo) ? extra[demo] : undefined)
  );
}

export function generateStaticParams() {
  return [
    ...listDemos().map(({ item, demo }) => ({ item, demo })),
    ...Object.entries(EXTRA_STAGES).flatMap(([item, demos]) =>
      Object.keys(demos).map((demo) => ({ item, demo })),
    ),
  ];
}

// Static on purpose: with Partial Prefetching the App Shell is shared by every demo URL, and a
// `params` read here (or outside the Suspense below) would tie it to one URL.
export const metadata: Metadata = { title: "Demo", robots: { index: false } };

type StageProps = PageProps<"/demo/[item]/[demo]">;

export default function DemoStage({ params }: StageProps) {
  return (
    <main
      data-slot="demo-stage"
      // Named per demo (the label is in DemoMode), so stages embedded in a docs page do not
      // repeat the page's own main.
      aria-labelledby="demo-stage-label"
      className="flex flex-1 items-center justify-center bg-paper p-4 text-ink sm:p-8"
    >
      {/* The URL-dependent part renders inside the boundary; the stage itself is the shell. */}
      <Suspense fallback={null}>
        <Demo params={params} />
        {/* After the demo, so `data-demo-ready` means the demo is on the page too. */}
        <DemoMode />
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

async function Demo({ params }: Pick<StageProps, "params">) {
  const { item, demo } = await params;
  const load = stageLoader(item, demo);
  // Inside the boundary the shell has already streamed, so an unknown demo shows the
  // not-found page with a 200 (`dynamicParams = false` is not allowed with cacheComponents).
  if (!load) notFound();
  const { default: Component } = await load();
  return <Component />;
}
