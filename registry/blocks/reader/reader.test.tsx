import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { expectDemosAccessible } from "@/lib/test/axe";
import { stubResizeObserver } from "@/lib/test/resize-observer";
import { Reader, useReader } from "./reader";

// motion reads `prefers-reduced-motion` through matchMedia (missing in jsdom): the file runs
// reduced, so every page turn is instant.
beforeAll(() => {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query.includes("reduce"),
    media: query,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
  }));
});

afterAll(() => {
  vi.unstubAllGlobals();
});

afterEach(cleanup);

const pages = Array.from({ length: 24 }, (_, i) => ({
  src: `/pages/${i + 1}.png`,
  alt: `Page ${i + 1} art`,
}));

const chapters = [
  { number: 1, title: "The Ink Well", href: "/c/1", read: true },
  { number: 2, title: "Paper Lanterns", href: "/c/2" },
];

const props = {
  series: "Ink Well",
  chapter: { number: 2, title: "Paper Lanterns" },
  pages,
  chapters,
};

const spread = () => screen.getByRole("region", { name: "Chapter 2" });
const progressText = () => document.querySelector('[data-slot="reader-progress"]')?.textContent;

/** A reader whose page lives in an address string, as the default demo keeps it in the URL. */
function Addressed({ url }: { url: { read: () => string; write: (search: string) => void } }) {
  const reader = useReader({ count: pages.length, url });
  return <Reader {...props} page={reader.page} onPageChange={reader.setPage} />;
}

describe("Reader", () => {
  it("is the page's one main region, named by its heading of series and chapter", () => {
    render(<Reader {...props} className="mx-auto" />);
    const main = screen.getByRole("main");
    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(main.dataset.slot).toBe("reader");
    expect(main.classList.contains("mx-auto")).toBe(true);
    const heading = within(main).getByRole("heading", { level: 1 });
    expect(heading.textContent).toBe("Ink Well Chapter 2: Paper Lanterns");
    expect(main.getAttribute("aria-labelledby")).toBe(heading.id);
  });

  it("is a named section with an h2 inside a page that has its own main", () => {
    render(<Reader {...props} as="section" />);
    expect(screen.queryByRole("main")).toBeNull();
    const region = screen.getByRole("region", { name: "Ink Well Chapter 2: Paper Lanterns" });
    expect(region.tagName).toBe("SECTION");
    expect(within(region).getByRole("heading", { level: 2 })).toBeTruthy();
  });

  it("shows the progress as text and as a progressbar's value text", () => {
    render(<Reader {...props} />);
    expect(progressText()).toBe("Page 1 of 24");
    const bar = screen.getByRole("progressbar");
    expect(bar.getAttribute("aria-valuetext")).toBe("Page 1 of 24");
    expect(bar.getAttribute("aria-valuenow")).toBe("1");
    expect(bar.getAttribute("aria-valuemax")).toBe("24");
  });

  it("turns with the spread's keys, and nothing else takes the arrow keys", () => {
    const onPageChange = vi.fn();
    render(<Reader {...props} onPageChange={onPageChange} />);
    // Arrows on the reader, its header or the drawer's trigger turn nothing.
    for (const target of [
      screen.getByRole("main"),
      screen.getByRole("heading", { level: 1 }),
      screen.getByRole("button", { name: "Chapters" }),
    ]) {
      fireEvent.keyDown(target, { key: "ArrowLeft" });
      fireEvent.keyDown(target, { key: "End" });
    }
    expect(progressText()).toBe("Page 1 of 24");
    expect(onPageChange).not.toHaveBeenCalled();
    // On the spread, Left reads on in rtl.
    fireEvent.keyDown(spread(), { key: "ArrowLeft" });
    expect(progressText()).toBe("Page 3 of 24");
    fireEvent.keyDown(spread(), { key: "End" });
    expect(progressText()).toBe("Page 24 of 24");
    expect(onPageChange.mock.calls).toEqual([[1], [23]]);
  });

  it("reads the page from the address and writes each turn back", () => {
    let search = "?mode=dark&page=10";
    const url = {
      read: () => search,
      write: vi.fn((next: string) => {
        search = next;
      }),
    };
    render(<Addressed url={url} />);
    expect(progressText()).toBe("Page 11 of 24");
    expect(spread().querySelector('[data-slot="spread-viewer-status"]')?.textContent).toBe(
      "Pages 10–11 of 24",
    );
    expect(url.write).not.toHaveBeenCalled();
    fireEvent.keyDown(spread(), { key: "ArrowLeft" });
    expect(search).toBe("?mode=dark&page=12");
    expect(progressText()).toBe("Page 13 of 24");
    fireEvent.click(screen.getByRole("button", { name: "Previous" }));
    expect(search).toBe("?mode=dark&page=10");
  });

  it("opens the chapter drawer and returns focus to its trigger when it closes", async () => {
    stubResizeObserver();
    render(<Reader {...props} />);
    const trigger = screen.getByRole("button", { name: "Chapters" });
    trigger.focus();
    fireEvent.click(trigger);
    // Base UI moves focus into the popup a frame after it opens.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    const dialog = screen.getByRole("dialog");
    expect(dialog.textContent).toContain("Reading Chapter 2, Page 1 of 24");
    const list = within(dialog).getByRole("navigation", { name: "Ink Well chapters" });
    expect(within(list).getAllByRole("link")).toHaveLength(2);
    expect(dialog.contains(document.activeElement)).toBe(true);
    // The arrow keys stay the spread's while the drawer is open, too.
    fireEvent.keyDown(document.activeElement ?? dialog, { key: "ArrowLeft" });
    expect(progressText()).toBe("Page 1 of 24");
    fireEvent.keyDown(document.activeElement ?? dialog, { key: "Escape" });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  expectDemosAccessible(import.meta.glob("./demos/*.tsx"));
});
