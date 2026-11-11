import Link from "next/link";
import { notFound } from "next/navigation";
import { OVERLAY_ITEMS } from "@/components/docs/demo-frame";
import { StageFrame } from "@/components/docs/stage-frame";
import { loadRegistry } from "@/lib/registry";
import { getDemoLoader, listDemos } from "@/lib/registry/demos";

// Overlay items render each demo in an iframe of its stage, so two open sheets or dialogs never
// stack on one page: the docs' list and the docs' frame, which follows `.dark` on <html>
// (DemoMode sets it on this page).

/** One item's gallery: its header and every demo, an overlay item's each in a stage frame. */
export async function GalleryItem({ item }: { item: string }) {
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
            <StageFrame src={`/demo/${item}/${demo}`} title={`${item} / ${demo}`} height="32rem" />
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
