import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDemoLoader, listDemos } from "@/lib/registry/demos";
import { DemoMode } from "./demo-mode";

// Demo stage: one demo, centred on paper, no chrome. Playwright drives it now and
// docs-site embeds it later (SPEC-components §2). `?mode=dark` renders the night theme.

export function generateStaticParams() {
  return listDemos().map(({ item, demo }) => ({ item, demo }));
}

export async function generateMetadata({
  params,
}: PageProps<"/demo/[item]/[demo]">): Promise<Metadata> {
  const { item, demo } = await params;
  return { title: `${item} / ${demo} · mangacn demo`, robots: { index: false } };
}

export default async function DemoStage({ params }: PageProps<"/demo/[item]/[demo]">) {
  const { item, demo } = await params;
  const load = getDemoLoader(item, demo);
  if (!load) notFound();
  const { default: Demo } = await load();

  return (
    <main
      data-slot="demo-stage"
      className="flex flex-1 items-center justify-center bg-paper p-4 text-ink sm:p-8"
    >
      <DemoMode />
      <Demo />
    </main>
  );
}
