import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OVERLAY_ITEMS } from "@/components/docs/demo-frame";
import { listDemos } from "@/lib/registry/demos";
import { stubResizeObserver } from "@/lib/test/resize-observer";
import { GalleryItem } from "./gallery-item";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

// The first import of a demo module is slow on a busy machine.
vi.setConfig({ testTimeout: 120_000 });

const demosOf = (item: string) => listDemos().filter((entry) => entry.item === item);

describe("GalleryItem", () => {
  it("frames every demo of each of the docs' overlay items in its stage", async () => {
    // The list grows with every item whose demos open on load; a count here broke on the next merge.
    expect(OVERLAY_ITEMS.size).toBeGreaterThan(0);
    for (const item of OVERLAY_ITEMS) {
      const demos = demosOf(item);
      expect(demos.length, item).toBeGreaterThan(0);
      render(await GalleryItem({ item }));
      const frames = [...document.querySelectorAll("iframe")];
      expect(
        frames.map((frame) => frame.getAttribute("src")),
        item,
      ).toEqual(demos.map(({ demo }) => `/demo/${item}/${demo}`));
      // The docs' frame: named by item and demo, 32rem tall, following the page's theme.
      expect(frames[0].getAttribute("title")).toBe(`${item} / ${demos[0].demo}`);
      expect(frames[0].style.height).toBe("32rem");
      cleanup();
    }
  });

  it("renders any other item's demos inline, with no frame", async () => {
    stubResizeObserver();
    render(await GalleryItem({ item: "button" }));
    expect(document.querySelectorAll("iframe")).toHaveLength(0);
    expect(screen.getByRole("heading", { level: 1, name: "button" })).toBeTruthy();
    const sections = document.querySelectorAll("section");
    expect(sections).toHaveLength(demosOf("button").length);
    expect(within(sections[0] as HTMLElement).getAllByRole("button").length).toBeGreaterThan(0);
  });
});
