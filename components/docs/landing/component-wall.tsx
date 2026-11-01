import Link from "next/link";
import type { ReactNode } from "react";
import { CATEGORY_LABELS, type DocItem, groupByCategory } from "@/lib/docs/catalog";
import { installCommand } from "@/lib/docs/install-command";
import { Card, CardContent, CardTitle } from "@/registry/ui/card/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/registry/ui/tabs/tabs";
import { DemoPreview, OVERLAY_ITEMS } from "../demo-frame";
import type { LandingCatalog } from "./catalog";
import { CopyButton } from "./copy-button";

const FEATURED_TAB = "featured";

/**
 * Section 4: the featured twelve under a "Featured" tab, then one tab per category with every
 * item in it. Only the selected tab's cards are mounted, so ids inside demos never repeat.
 */
export async function ComponentWall({ catalog }: { catalog: LandingCatalog }) {
  const { items, featured, primitives, native } = catalog;
  // Overlay items stay off the landing's demos: their previews are stage iframes.
  const previews = new Map(
    await Promise.all(
      items
        .filter((item) => !OVERLAY_ITEMS.has(item.name))
        .map(
          async (item) =>
            [
              item.name,
              await DemoPreview({
                item: item.name,
                demo: "default",
                // A thumbnail: the demo laid out at twice the room, then drawn at half size.
                className:
                  "h-36 min-h-0 overflow-hidden p-2 *:[zoom:0.5] sm:h-40 sm:p-3 md:*:[zoom:0.6]",
              }),
            ] as const,
        ),
    ),
  );
  const groups = groupByCategory(items);

  return (
    <section data-landing="component-wall" aria-labelledby="landing-wall" className="border-t">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-14 sm:px-6 md:py-20">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div className="flex flex-col gap-2">
            <h2 id="landing-wall" className="font-display text-3xl sm:text-4xl">
              {items.length} items. Two kinds.
            </h2>
            <p className="max-w-xl text-pretty text-muted-foreground">
              {primitives} shadcn primitives restyled in ink, and {native} manga-native pieces:
              panels, bubbles, sound effects, screentones and motion.
            </p>
          </div>
          <Link
            href="/docs/components"
            className="font-medium underline underline-offset-4 hover:text-spot"
          >
            All {items.length} →
          </Link>
        </div>

        <Tabs defaultValue={FEATURED_TAB} className="min-w-0 gap-6">
          <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
            <TabsList variant="line" aria-label="Component categories">
              <TabsTrigger value={FEATURED_TAB}>Featured</TabsTrigger>
              {groups.map(([category, group]) => (
                <TabsTrigger key={category} value={category}>
                  {CATEGORY_LABELS[category]}{" "}
                  <span className="text-xs text-muted-foreground tabular-nums">{group.length}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          <TabsContent value={FEATURED_TAB}>
            <CardGrid items={featured} previews={previews} />
          </TabsContent>
          {groups.map(([category, group]) => (
            <TabsContent key={category} value={category}>
              <CardGrid items={group} previews={previews} />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
}

function CardGrid({ items, previews }: { items: DocItem[]; previews: Map<string, ReactNode> }) {
  return (
    <ul className="grid min-w-0 grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
      {items.map((item) => (
        <li key={item.name} className="flex min-w-0">
          <WallCard item={item} preview={previews.get(item.name)} />
        </li>
      ))}
    </ul>
  );
}

// The demo stays interactive, so only the title links to the page (no card-wide overlay link).
function WallCard({ item, preview }: { item: DocItem; preview: ReactNode }) {
  return (
    <Card data-item={item.name} size="sm" className="w-full min-w-0">
      <CardContent className="flex flex-col gap-3">
        {preview ?? (
          <p className="flex h-36 items-center justify-center rounded-sm border p-3 text-center text-sm text-muted-foreground sm:h-40">
            Opens over the page; the live demo is on its docs page.
          </p>
        )}
        <div className="flex min-w-0 items-center justify-between gap-2">
          <CardTitle className="min-w-0 font-display text-sm uppercase sm:text-base">
            <h3 className="truncate">
              <Link
                href={`/docs/components/${item.name}`}
                className="underline-offset-4 hover:underline focus-visible:underline"
              >
                {item.title}
              </Link>
            </h3>
          </CardTitle>
          <CopyButton
            text={installCommand(item.name, "pnpm")}
            label={`Copy install command for ${item.title}`}
            className="shrink-0"
          />
        </div>
      </CardContent>
    </Card>
  );
}
