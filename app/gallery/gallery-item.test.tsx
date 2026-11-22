import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OVERLAY_ITEMS } from "@/components/docs/variant-frame";
import { getVariantLoader, listVariants } from "@/lib/registry/variants";
import { stubResizeObserver } from "@/lib/test/resize-observer";
import { GalleryItem } from "./gallery-item";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

// The first import of a variant module is slow on a busy machine.
vi.setConfig({ testTimeout: 120_000 });

const variantsOf = (item: string) => listVariants().filter((entry) => entry.item === item);

/** The item's variant components by name, as its generated route imports them. */
async function componentsOf(item: string) {
  const entries = await Promise.all(
    variantsOf(item).map(async ({ variant }) => {
      const mod = await getVariantLoader(item, variant)?.();
      if (!mod) throw new Error(`no variant ${item}/${variant}`);
      return [variant, mod.default] as const;
    }),
  );
  return Object.fromEntries(entries);
}

describe("GalleryItem", () => {
  it("frames every variant of each of the docs' overlay items in its stage", async () => {
    // The list grows with every item whose variants open on load; a count here broke on the next merge.
    expect(OVERLAY_ITEMS.size).toBeGreaterThan(0);
    for (const item of OVERLAY_ITEMS) {
      const variants = variantsOf(item);
      expect(variants.length, item).toBeGreaterThan(0);
      render(GalleryItem({ item, variants: await componentsOf(item) }));
      const frames = [...document.querySelectorAll("iframe")];
      expect(
        frames.map((frame) => frame.getAttribute("src")),
        item,
      ).toEqual(variants.map(({ variant }) => `/gallery/${item}/${variant}`));
      // The docs' frame: named by item and variant, 32rem tall, following the page's theme.
      expect(frames[0].getAttribute("title")).toBe(`${item} / ${variants[0].variant}`);
      expect(frames[0].style.height).toBe("32rem");
      cleanup();
    }
  });

  it("renders any other item's variants inline, with no frame", async () => {
    stubResizeObserver();
    render(GalleryItem({ item: "button", variants: await componentsOf("button") }));
    expect(document.querySelectorAll("iframe")).toHaveLength(0);
    expect(screen.getByRole("heading", { level: 1, name: "button" })).toBeTruthy();
    const sections = document.querySelectorAll("section");
    expect(sections).toHaveLength(variantsOf("button").length);
    expect(within(sections[0] as HTMLElement).getAllByRole("button").length).toBeGreaterThan(0);
  });
});
