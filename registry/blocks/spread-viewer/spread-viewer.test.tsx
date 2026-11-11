import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import * as React from "react";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { expectDemosAccessible } from "@/lib/test/axe";
import { SpreadViewer } from "./spread-viewer";

// motion reads `prefers-reduced-motion` once per module through matchMedia (missing in jsdom):
// the whole file runs reduced, so every turn is instant and the old page leaves at once.
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

const region = () => screen.getByRole("region", { name: "Chapter 1" });
const status = () => region().querySelector('[data-slot="spread-viewer-status"]');
/** The page images on each side, once the turn has finished. */
async function sides() {
  await waitFor(() => {
    expect(region().querySelectorAll('[data-slot="page-turn-page"]')).toHaveLength(
      region().querySelectorAll('[data-slot="spread-viewer-page"]').length,
    );
  });
  const of = (side: string) =>
    region()
      .querySelector(`[data-slot="spread-viewer-page"][data-side="${side}"] img`)
      ?.getAttribute("alt") ?? null;
  return { left: of("left"), right: of("right") };
}

/** A viewer whose page lives in its owner's state, with a button that jumps from outside. */
function Controlled() {
  const [page, setPage] = React.useState(9);
  return (
    <>
      <SpreadViewer pages={pages} page={page} onPageChange={setPage} label="Chapter 1" />
      <button type="button" onClick={() => setPage(2)}>
        Jump
      </button>
    </>
  );
}

describe("SpreadViewer", () => {
  it("is a named region with the spread roledescription, focusable for the keys", () => {
    render(<SpreadViewer pages={pages} label="Chapter 1" className="mx-auto" />);
    const node = region();
    expect(node.getAttribute("aria-roledescription")).toBe("spread");
    expect(node.tabIndex).toBe(0);
    expect(node.dataset.slot).toBe("spread-viewer");
    expect(node.dataset.direction).toBe("rtl");
    expect(node.classList.contains("mx-auto")).toBe(true);
    expect(status()?.getAttribute("aria-live")).toBe("polite");
    expect(status()?.textContent).toBe("Page 1 of 24");
  });

  it("names the region Pages by default", () => {
    render(<SpreadViewer pages={pages} />);
    expect(screen.getByRole("region", { name: "Pages" })).toBeTruthy();
  });

  it("lays out rtl with the earlier page on the right, in frames with folios", async () => {
    render(<SpreadViewer pages={pages} start={3} label="Chapter 1" />);
    expect(await sides()).toEqual({ left: "Page 5 art", right: "Page 4 art" });
    const images = within(region()).getAllByRole("img");
    for (const image of images) {
      expect(image.closest('[data-slot="manga-frame"]')?.getAttribute("data-aspect")).toBe("3/4");
      expect(image.getAttribute("fetchpriority")).toBe("high");
      expect(image.getAttribute("draggable")).toBe("false");
    }
    const folios = region().querySelectorAll('[data-slot="page-number"]');
    expect([...folios].map((folio) => folio.textContent)).toEqual([
      "Page 5 of 245 / 24",
      "Page 4 of 244 / 24",
    ]);
    // Each folio hugs its page's outer corner.
    expect([...folios].map((folio) => folio.getAttribute("data-side"))).toEqual(["left", "right"]);
  });

  it("lays out ltr the other way round", async () => {
    render(<SpreadViewer pages={pages} start={3} direction="ltr" label="Chapter 1" />);
    expect(await sides()).toEqual({ left: "Page 4 art", right: "Page 5 art" });
  });

  it("leaves the side opposite a lone first page blank", async () => {
    render(<SpreadViewer pages={pages} label="Chapter 1" />);
    expect(await sides()).toEqual({ left: "Page 1 art", right: null });
    expect(region().querySelector('[data-slot="spread-viewer-blank"]')).toBeTruthy();
  });

  it("fills the side facing a lone page with blank, plain paper by default", async () => {
    render(
      <SpreadViewer
        pages={pages}
        label="Chapter 1"
        blank={<div data-testid="halftone" className="bg-halftone" />}
      />,
    );
    await sides();
    const blank = region().querySelector('[data-slot="spread-viewer-blank"]');
    expect(blank?.closest('[data-side="right"]')).toBeTruthy();
    expect(within(blank as HTMLElement).getByTestId("halftone")).toBeTruthy();
    // The blank keeps the page's box, so the spread stays two pages wide.
    expect(blank?.classList.contains("aspect-3/4")).toBe(true);
    // A full spread has no blank side, so the fill is not rendered.
    fireEvent.keyDown(region(), { key: "ArrowLeft" });
    await sides();
    expect(screen.queryByTestId("halftone")).toBeNull();
    cleanup();
    render(<SpreadViewer pages={pages} label="Chapter 1" />);
    expect(region().querySelector('[data-slot="spread-viewer-blank"]')?.childElementCount).toBe(0);
  });

  it("pages with the arrow keys in reading order, Home and End, and announces it", async () => {
    const onChange = vi.fn();
    render(<SpreadViewer pages={pages} start={3} onChange={onChange} label="Chapter 1" />);
    fireEvent.keyDown(region(), { key: "ArrowLeft" });
    expect(status()?.textContent).toBe("Pages 6–7 of 24");
    expect(await sides()).toEqual({ left: "Page 7 art", right: "Page 6 art" });
    fireEvent.keyDown(region(), { key: "ArrowRight" });
    expect(status()?.textContent).toBe("Pages 4–5 of 24");
    fireEvent.keyDown(region(), { key: "End" });
    expect(status()?.textContent).toBe("Page 24 of 24");
    fireEvent.keyDown(region(), { key: "Home" });
    expect(status()?.textContent).toBe("Page 1 of 24");
    expect(onChange.mock.calls).toEqual([[5], [3], [23], [0]]);
  });

  it("puts Next on the reading side and disables the buttons at the ends", () => {
    render(<SpreadViewer pages={pages} label="Chapter 1" />);
    const buttons = within(region()).getAllByRole("button");
    expect(buttons.map((button) => button.textContent)).toEqual(["Next", "Previous"]);
    const previous = screen.getByRole("button", { name: "Previous" }) as HTMLButtonElement;
    const next = screen.getByRole("button", { name: "Next" }) as HTMLButtonElement;
    expect(previous.disabled).toBe(true);
    fireEvent.click(next);
    expect(status()?.textContent).toBe("Pages 2–3 of 24");
    expect(previous.disabled).toBe(false);
    fireEvent.keyDown(region(), { key: "End" });
    expect(next.disabled).toBe(true);
    fireEvent.click(previous);
    expect(status()?.textContent).toBe("Pages 22–23 of 24");
  });

  it("puts Previous first in ltr and says which arrow does what", () => {
    render(<SpreadViewer pages={pages} direction="ltr" label="Chapter 1" />);
    const buttons = within(region()).getAllByRole("button");
    expect(buttons.map((button) => button.textContent)).toEqual(["Previous", "Next"]);
    const help = region().querySelector('[data-slot="spread-viewer-help"]');
    expect(help?.textContent).toBe(
      "Right arrow next, Left arrow previous, Home End first and last",
    );
    expect(help?.querySelectorAll('[data-slot="kbd"]')).toHaveLength(4);
  });

  it("hides the key help for a coarse pointer and shows it otherwise", () => {
    render(<SpreadViewer pages={pages} label="Chapter 1" />);
    const help = region().querySelector('[data-slot="spread-viewer-help"]') as HTMLElement;
    // The class is Tailwind's `@media (pointer: coarse)` variant; nothing hides it otherwise.
    expect(help.classList.contains("pointer-coarse:hidden")).toBe(true);
    expect([...help.classList].filter((name) => name.endsWith("hidden"))).toEqual([
      "pointer-coarse:hidden",
    ]);
  });

  it("turns one page at a time with single", async () => {
    render(<SpreadViewer pages={pages} single start={4} label="Chapter 1" />);
    expect(region().dataset.single).toBe("true");
    expect(region().querySelectorAll('[data-slot="spread-viewer-page"]')).toHaveLength(1);
    expect(status()?.textContent).toBe("Page 5 of 24");
    fireEvent.keyDown(region(), { key: "ArrowLeft" });
    expect(status()?.textContent).toBe("Page 6 of 24");
    expect(await sides()).toEqual({ left: "Page 6 art", right: null });
  });

  it("turns on a sideways swipe in reading order and ignores short or vertical ones", () => {
    render(<SpreadViewer pages={pages} start={3} label="Chapter 1" />);
    const surface = region().querySelector('[data-slot="spread-viewer-pages"]') as HTMLElement;
    const swipe = (dx: number, dy = 0) => {
      fireEvent.pointerDown(surface, { pointerId: 1, isPrimary: true, clientX: 200, clientY: 200 });
      fireEvent.pointerUp(surface, { pointerId: 1, clientX: 200 + dx, clientY: 200 + dy });
    };
    // In rtl a finger moving right brings the left-hand (next) page in, as the Left arrow does.
    swipe(120);
    expect(status()?.textContent).toBe("Pages 6–7 of 24");
    swipe(-120);
    expect(status()?.textContent).toBe("Pages 4–5 of 24");
    swipe(20);
    swipe(60, 200);
    expect(status()?.textContent).toBe("Pages 4–5 of 24");
  });

  it("lets the author's onKeyDown take a key first", () => {
    render(
      <SpreadViewer
        pages={pages}
        label="Chapter 1"
        onKeyDown={(event) => {
          if (event.key === "End") event.preventDefault();
        }}
      />,
    );
    fireEvent.keyDown(region(), { key: "End" });
    expect(status()?.textContent).toBe("Page 1 of 24");
  });

  it("takes a controlled page and turns only when the owner passes the new one back", () => {
    render(<Controlled />);
    expect(status()?.textContent).toBe("Pages 10–11 of 24");
    fireEvent.keyDown(region(), { key: "ArrowLeft" });
    expect(status()?.textContent).toBe("Pages 12–13 of 24");
    fireEvent.click(screen.getByRole("button", { name: "Jump" }));
    expect(status()?.textContent).toBe("Pages 2–3 of 24");

    const frozen = vi.fn();
    cleanup();
    render(<SpreadViewer pages={pages} page={3} onPageChange={frozen} label="Chapter 1" />);
    fireEvent.keyDown(region(), { key: "ArrowLeft" });
    expect(frozen).toHaveBeenCalledWith(5);
    expect(status()?.textContent).toBe("Pages 4–5 of 24");
  });

  expectDemosAccessible(import.meta.glob("./demos/*.tsx"));
});
