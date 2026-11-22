import Link from "next/link";
import { notFound } from "next/navigation";
import type { ComponentType } from "react";
import { StageFrame } from "@/components/docs/stage-frame";
import { OVERLAY_ITEMS } from "@/components/docs/variant-frame";
import { loadRegistry } from "@/lib/registry";
import { listVariants } from "@/lib/registry/variant-list";

// Overlay items render each variant in an iframe of its stage, so two open sheets or dialogs never
// stack on one page: the docs' list and the docs' frame, which follows `.dark` on <html>
// (VariantMode sets it on this page).

/** One item's gallery: its header and every variant, an overlay item's each in a stage frame. */
export function GalleryItem({
  item,
  variants: components,
}: {
  item: string;
  /** The item's variants by name (its route imports them). */
  variants: Record<string, ComponentType>;
}) {
  const variants = listVariants().filter((d) => d.item === item);
  if (variants.length === 0) notFound();

  // Catalog order, items with variants only, for the description and the previous/next links.
  const withVariants = new Set(listVariants().map((d) => d.item));
  const items = loadRegistry().items.filter((entry) => withVariants.has(entry.name));
  const index = items.findIndex((entry) => entry.name === item);
  const entry = items[index];
  const previous = items[index - 1]?.name;
  const next = items[index + 1]?.name;

  const rendered = variants.map(({ variant }) => ({
    variant,
    Variant: Object.hasOwn(components, variant) ? components[variant] : null,
  }));

  return (
    <>
      <header className="flex flex-col gap-3">
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <Link href="/gallery" className="underline underline-offset-4 hover:text-spot">
            ← Gallery
          </Link>
          <span className="flex gap-2">
            {/* Plain anchors: VariantMode reads `?mode` on the client, so a full load is wanted. */}
            <a href="?" className="underline underline-offset-4 hover:text-spot">
              light
            </a>
            <a href="?mode=dark" className="underline underline-offset-4 hover:text-spot">
              dark
            </a>
          </span>
          <span className="ml-auto flex gap-4">
            {previous && (
              <Link href={`/gallery/${previous}`} className="hover:text-spot">
                ← {previous}
              </Link>
            )}
            {next && (
              <Link href={`/gallery/${next}`} className="hover:text-spot">
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
      {rendered.map(({ variant, Variant }) => (
        <section key={variant} className="flex flex-col gap-3">
          <h2 className="flex flex-wrap items-baseline gap-x-3 font-display text-xl">
            {variant}
            <Link
              href={`/gallery/${item}/${variant}`}
              className="font-sans text-sm font-normal text-muted-foreground underline underline-offset-4 hover:text-spot"
            >
              open stage
            </Link>
          </h2>
          {OVERLAY_ITEMS.has(item) ? (
            <StageFrame
              src={`/gallery/${item}/${variant}`}
              title={`${item} / ${variant}`}
              height="32rem"
            />
          ) : (
            <div className="ink-border flex min-w-0 items-center justify-center overflow-x-auto rounded-[var(--radius)] bg-paper p-4 sm:p-8">
              {Variant && <Variant />}
            </div>
          )}
        </section>
      ))}
    </>
  );
}
