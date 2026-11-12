import Link from "next/link";
import type { ReactNode } from "react";
import { BLOCKS_CATALOG, type DocItem, docItems } from "@/lib/docs/catalog";
import { loadRegistry } from "@/lib/registry";
import { listDemos } from "@/lib/registry/demos";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/registry/ui/card/card";
import { ScaledView } from "./block-preview";
import { DemoPreview } from "./demo-frame";
import { LazyDemo } from "./lazy-demo";
import { PREVIEW_WIDTHS } from "./preview-widths";

/**
 * Every card's preview box is this tall, before and after it mounts, so nothing moves when a
 * preview arrives. Blocks are pages in miniature: a preview shows the top of one, clipped.
 */
export const BLOCK_STAGE_HEIGHT = "26rem";

/**
 * Every block as a card with a preview, in catalog order: a page block's whole page from
 * `/view/<name>` (in an inert iframe at a phone's width, scaled to the card), any other
 * block's default demo. Previews are inert: a card is a way to the block's page, which its title
 * links to, not a place to use the block. Read from the catalog and the demo map, so a new block
 * shows up without an edit here.
 */
export async function BlockIndex() {
  const items = docItems(loadRegistry(), listDemos(), BLOCKS_CATALOG);
  const previews = new Map(
    await Promise.all(items.map(async (item) => [item.name, await preview(item)] as const)),
  );

  return (
    <div data-slot="block-index" className="not-prose">
      <ul className="grid min-w-0 gap-6 md:grid-cols-2">
        {items.map((item) => (
          <li key={item.name} className="flex min-w-0">
            <BlockCard item={item} preview={previews.get(item.name)} />
          </li>
        ))}
      </ul>
    </div>
  );
}

async function preview(item: DocItem): Promise<ReactNode> {
  if (item.page) {
    // The page at a phone's width, scaled to the card: never narrower than a real screen.
    return (
      <ScaledView
        item={item.name}
        width={PREVIEW_WIDTHS[0].width}
        title={`${item.title} page`}
        inert
        className="h-full rounded-sm border bg-paper"
      />
    );
  }
  return (
    <div inert className="h-full">
      {
        await DemoPreview({
          item: item.name,
          demo: "default",
          height: "100%",
          className: "h-full items-start overflow-hidden p-4 sm:p-4",
          inert: true,
        })
      }
    </div>
  );
}

function BlockCard({ item, preview }: { item: DocItem; preview: ReactNode }) {
  return (
    <Card data-item={item.name} className="w-full min-w-0">
      <CardHeader>
        <CardTitle className="font-display text-lg uppercase">
          <Link
            href={`/docs/blocks/${item.name}`}
            className="underline-offset-4 hover:underline focus-visible:underline"
          >
            {item.title}
          </Link>
        </CardTitle>
        <CardDescription>{item.description}</CardDescription>
      </CardHeader>
      <CardContent className="mt-auto">
        <LazyDemo height={BLOCK_STAGE_HEIGHT}>{preview}</LazyDemo>
      </CardContent>
    </Card>
  );
}
