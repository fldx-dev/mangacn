import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { loadRegistry } from "@/lib/registry";
import { getDemoLoader, listDemos } from "@/lib/registry/demos";
import { DemoMode } from "./[demo]/demo-mode";
import { StageFrame } from "./stage-frame";

// Gallery page for one item: every demo inline under its name, with a link to the lone stage.
// `?mode=dark` renders the night theme (DemoMode). Overlay items render each demo in an
// iframe of its stage instead, so two open sheets or dialogs never stack on one page.

export function generateStaticParams() {
  return [...new Set(listDemos().map(({ item }) => item))].map((item) => ({ item }));
}

export const metadata: Metadata = { title: "mangacn gallery", robots: { index: false } };

const OVERLAY_ITEMS = new Set(["dialog", "sheet", "tooltip", "popover"]);

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
  const demos = listDemos().filter((d) => d.item === item);
  if (demos.length === 0) notFound();

  // Catalog order, items with demos only, for the description and the previous/next links.
  const withDemos = new Set(listDemos().map((d) => d.item));
  const items = loadRegistry().items.filter((entry) => withDemos.has(entry.name));
  const index = items.findIndex((entry) => entry.name === item);
  const entry = items[index];
  const previous = items[index - 1]?.name;
  const next = items[index + 1]?.name;

  const rendered = await Promise.all(
    demos.map(async ({ demo }) => {
      const load = getDemoLoader(item, demo);
      return { demo, Demo: load ? (await load()).default : null };
    }),
  );

  return (
    <>
      <header className="flex flex-col gap-3">
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <Link href="/demo" className="underline underline-offset-4 hover:text-spot">
            ← Gallery
          </Link>
          <span className="flex gap-2">
            {/* Plain anchors: DemoMode reads `?mode` on the client, so a full load is wanted. */}
            <a href="?" className="underline underline-offset-4 hover:text-spot">
              light
            </a>
            <a href="?mode=dark" className="underline underline-offset-4 hover:text-spot">
              dark
            </a>
          </span>
          <span className="ml-auto flex gap-4">
            {previous && (
              <Link href={`/demo/${previous}`} className="hover:text-spot">
                ← {previous}
              </Link>
            )}
            {next && (
              <Link href={`/demo/${next}`} className="hover:text-spot">
                {next} →
              </Link>
            )}
          </span>
        </nav>
        <h1 className="font-display text-4xl sm:text-5xl">{item}</h1>
        {entry?.description && (
          <p className="max-w-2xl font-dialogue text-muted-foreground">{entry.description}</p>
        )}
      </header>
      {rendered.map(({ demo, Demo }) => (
        <section key={demo} className="flex flex-col gap-3">
          <h2 className="flex flex-wrap items-baseline gap-x-3 font-display text-xl">
            {demo}
            <Link
              href={`/demo/${item}/${demo}`}
              className="font-sans text-sm font-normal text-muted-foreground underline underline-offset-4 hover:text-spot"
            >
              open stage
            </Link>
          </h2>
          {OVERLAY_ITEMS.has(item) ? (
            <StageFrame src={`/demo/${item}/${demo}`} title={`${item} / ${demo}`} />
          ) : (
            <div className="ink-border flex min-w-0 items-center justify-center overflow-x-auto rounded-[var(--radius)] bg-paper p-4 sm:p-8">
              {Demo && <Demo />}
            </div>
          )}
        </section>
      ))}
    </>
  );
}
