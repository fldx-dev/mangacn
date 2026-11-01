import Link from "next/link";
import type { ReactNode } from "react";
import { CATEGORY_LABELS, type DocItem, docItems, groupByCategory } from "@/lib/docs/catalog";
import { loadRegistry } from "@/lib/registry";
import { listDemos } from "@/lib/registry/demos";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/registry/ui/card/card";
import { DemoPreview } from "./demo-frame";

/**
 * Every documented item as a card with its default demo, grouped by category in sidebar
 * order. Read from the catalog and the demo map, so a new item shows up without an edit here.
 */
export async function ComponentIndex() {
  const items = docItems(loadRegistry(), listDemos());
  const previews = new Map(
    await Promise.all(
      items.map(
        async (item) =>
          [
            item.name,
            await DemoPreview({
              item: item.name,
              demo: "default",
              height: "20rem",
              className: "min-h-48 p-4 sm:p-4",
            }),
          ] as const,
      ),
    ),
  );

  return (
    <div data-slot="component-index" className="not-prose flex flex-col gap-12">
      {groupByCategory(items).map(([category, group]) => (
        <section
          key={category}
          aria-labelledby={`category-${category}`}
          className="flex min-w-0 flex-col gap-4"
        >
          <h2 id={`category-${category}`} className="font-display text-2xl uppercase">
            {CATEGORY_LABELS[category]}
            <span className="ms-2 align-middle font-sans text-sm text-fd-muted-foreground normal-case">
              {group.length}
            </span>
          </h2>
          <ul className="grid min-w-0 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {group.map((item) => (
              <li key={item.name} className="flex min-w-0">
                <IndexCard item={item} preview={previews.get(item.name)} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

// The demo stays interactive, so only the title links to the page (no card-wide overlay link).
function IndexCard({ item, preview }: { item: DocItem; preview: ReactNode }) {
  return (
    <Card data-item={item.name} className="w-full min-w-0">
      <CardHeader>
        <CardTitle className="font-display text-lg uppercase">
          <Link
            href={`/docs/components/${item.name}`}
            className="underline-offset-4 hover:underline focus-visible:underline"
          >
            {item.title}
          </Link>
        </CardTitle>
        <CardDescription>{item.description}</CardDescription>
      </CardHeader>
      <CardContent className="mt-auto">{preview}</CardContent>
    </Card>
  );
}
