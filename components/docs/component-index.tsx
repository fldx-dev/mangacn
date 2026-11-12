import Link from "next/link";
import type { ReactNode } from "react";
import { CATEGORY_LABELS, type DocItem, docItems, groupByCategory } from "@/lib/docs/catalog";
import { loadRegistry } from "@/lib/registry";
import { listDemos } from "@/lib/registry/demos";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/registry/ui/card/card";
import { DemoPreview } from "./demo-frame";
import { LazyDemo } from "./lazy-demo";

/**
 * A card's demo stage (the inline box or the stage iframe) is a fixed height, and so is the
 * placeholder it shows until the demo mounts, so nothing moves when a demo arrives.
 */
const STAGE_HEIGHT = "20rem";

/**
 * Default demos taller than the stage at some width (panel-grid stacks to one column at 360 px,
 * card and panel wrap in the two-column grid at 768 px; two of the chat set are tall by nature). `e2e/site.spec.ts` fails, naming the
 * item, when a demo overflows its stage.
 */
const TALL_STAGES: Readonly<Record<string, string>> = {
  card: "30rem",
  panel: "24rem",
  "panel-grid": "35rem",
  // A thread box of 20rem with its outline (335 px), and a whole question with its answers,
  // progress and buttons, which wraps to its tallest in the narrow two-column cards at 768.
  "message-scroller": "22rem",
  questionnaire: "30rem",
};

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
              height: "100%",
              className: "h-full p-4 sm:p-4",
              // Most overlay defaults open on mount; live, they pull focus and the scroll
              // position into their frame as the card mounts, and a modal traps Tab there.
              inert: true,
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

// Inline demos stay interactive (overlay previews are inert), so only the title links to the
// page (no card-wide overlay link).
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
      <CardContent className="mt-auto">
        <LazyDemo height={TALL_STAGES[item.name] ?? STAGE_HEIGHT}>{preview}</LazyDemo>
      </CardContent>
    </Card>
  );
}
