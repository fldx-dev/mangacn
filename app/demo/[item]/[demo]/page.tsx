import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { STAGE_FOCUS_SCRIPT } from "@/lib/docs/stage-focus";
import { getDemoLoader, listDemos } from "@/lib/registry/demos";
import { DemoMode } from "./demo-mode";

// Demo stage: one demo, centred on paper, no chrome. Playwright drives it now and
// docs-site embeds it later (SPEC-components §2). `?mode=dark` renders the night theme.

export function generateStaticParams() {
  return listDemos().map(({ item, demo }) => ({ item, demo }));
}

// Static on purpose: with Partial Prefetching the App Shell is shared by every demo URL, and a
// `params` read here (or outside the Suspense below) would tie it to one URL.
export const metadata: Metadata = { title: "mangacn demo", robots: { index: false } };

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
      {/*
        Embedded in a docs page, a stage does not take the reader's focus until they go there
        (lib/docs/stage-focus.ts). Inline and first, so it runs while the document is parsed,
        before the demo's markup below arrives and long before it hydrates and opens anything.
      */}
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: a constant script of our own */}
      <script dangerouslySetInnerHTML={{ __html: STAGE_FOCUS_SCRIPT }} />
      {/* The URL-dependent part renders inside the boundary; the stage itself is the shell. */}
      <Suspense fallback={null}>
        <Demo params={params} />
        {/* After the demo, so `data-demo-ready` means the demo is on the page too. */}
        <DemoMode />
      </Suspense>
    </main>
  );
}

async function Demo({ params }: Pick<StageProps, "params">) {
  const { item, demo } = await params;
  const load = getDemoLoader(item, demo);
  // Inside the boundary the shell has already streamed, so an unknown demo shows the
  // not-found page with a 200 (`dynamicParams = false` is not allowed with cacheComponents).
  if (!load) notFound();
  const { default: Component } = await load();
  return <Component />;
}
