import { type DocItem, docItems } from "@/lib/docs/catalog";
import { loadRegistry } from "@/lib/registry";
import { listDemos } from "@/lib/registry/demos";
import { OVERLAY_ITEMS } from "../demo-frame";

/**
 * The twelve items on the landing's component wall, in wall order: four restyled primitives,
 * then manga-native pieces. None is an overlay item, so the wall needs no stage iframe.
 */
export const FEATURED = [
  "button",
  "card",
  "input",
  "table",
  "panel",
  "thought-bubble",
  "sfx-text",
  "vertical-text",
  "speed-lines",
  "halftone-background",
  "emanata",
  "page-turn",
] as const;

export interface LandingCatalog {
  /** Every documented item, in category order. */
  items: DocItem[];
  /** Items in the `primitive` category: the restyled shadcn primitives. */
  primitives: number;
  /** Everything else: the manga-native pieces. */
  native: number;
  /** The wall's items, in `FEATURED` order. */
  featured: DocItem[];
}

/**
 * The counts and items the landing shows, read from the catalog and the demo map at build
 * time. Throws when a featured item is missing or would need an iframe.
 */
export function landingCatalog(): LandingCatalog {
  const items = docItems(loadRegistry(), listDemos());
  const byName = new Map(items.map((item) => [item.name, item]));
  const featured = FEATURED.map((name) => {
    const item = byName.get(name);
    if (!item) throw new Error(`Featured item "${name}" is not a documented catalog item.`);
    if (OVERLAY_ITEMS.has(name)) throw new Error(`Featured item "${name}" is an overlay item.`);
    return item;
  });
  const primitives = items.filter((item) => item.category === "primitive").length;
  return { items, primitives, native: items.length - primitives, featured };
}
