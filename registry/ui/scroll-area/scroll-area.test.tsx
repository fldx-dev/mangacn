import { cleanup, render, screen } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { stubGetAnimations } from "@/lib/test/animations";
import { expectDemosAccessible } from "@/lib/test/axe";
import { stubResizeObserver } from "@/lib/test/resize-observer";
import { ScrollArea, ScrollBar } from "./scroll-area";

// Base UI's viewport asks for running animations after it mounts; jsdom has none.
let restoreAnimations = () => {};
beforeAll(() => {
  restoreAnimations = stubGetAnimations();
});
afterAll(() => restoreAnimations());

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

/** jsdom never measures an overflow, so Base UI hides scrollbars unless they stay mounted. */
function Pages({ label }: { label?: string }) {
  return (
    <ScrollArea label={label} className="custom-class h-40">
      <p>Page one</p>
      <ScrollBar orientation="horizontal" keepMounted className="bar-class" />
    </ScrollArea>
  );
}

const slot = (name: string) => document.querySelector<HTMLElement>(`[data-slot="${name}"]`);

describe("ScrollArea", () => {
  it("renders the root and viewport with their data-slots and a forwarded className", () => {
    render(<Pages />);
    const root = slot("scroll-area");
    expect(root?.classList.contains("custom-class")).toBe(true);
    expect(root?.classList.contains("relative")).toBe(true);
    const viewport = slot("scroll-area-viewport");
    expect(viewport?.parentElement).toBe(root);
    expect(viewport?.textContent).toContain("Page one");
  });

  it("names the viewport as a region, by default and by the label prop", () => {
    render(<Pages />);
    const region = screen.getByRole("region", { name: "Scrollable content" });
    expect(region.dataset.slot).toBe("scroll-area-viewport");
    cleanup();
    render(<Pages label="Chapter 12" />);
    expect(screen.getByRole("region", { name: "Chapter 12" }).dataset.slot).toBe(
      "scroll-area-viewport",
    );
    expect(slot("scroll-area")?.hasAttribute("aria-label")).toBe(false);
  });

  it("leaves the tab stop to Base UI: out of the tab order while nothing scrolls", () => {
    render(<Pages />);
    // jsdom measures no overflow, so Base UI keeps the viewport out of the tab order; a
    // viewport that scrolls gets tabIndex 0 from Base UI itself.
    expect(slot("scroll-area-viewport")?.tabIndex).toBe(-1);
  });

  it("draws the track as a thin tone rule and the thumb as an ink bar", () => {
    render(<Pages />);
    const bar = slot("scroll-area-scrollbar");
    expect(bar?.dataset.orientation).toBe("horizontal");
    expect(bar?.classList.contains("bar-class")).toBe(true);
    const track = bar?.querySelector<HTMLElement>(':scope > [data-slot="ink-frame"]');
    expect(track?.dataset.shape).toBe("line");
    expect(track?.dataset.fill).toBe("none");
    expect(track?.className).toContain("[--ink:var(--tone-3)]");
    expect(track?.className).toContain("h-(--outline-width)");
    const thumb = slot("scroll-area-thumb");
    expect(thumb?.parentElement).toBe(bar);
    expect(thumb?.classList.contains("bg-border")).toBe(false);
    const frame = thumb?.querySelector<HTMLElement>(':scope > [data-slot="ink-frame"]');
    expect(frame?.dataset.fill).toBe("ink");
    expect(frame?.classList.contains("rounded-full")).toBe(true);
  });

  it("runs a vertical track down the middle of a vertical scrollbar", () => {
    render(
      <ScrollArea>
        <p>Page one</p>
        <ScrollBar keepMounted />
      </ScrollArea>,
    );
    const bars = document.querySelectorAll<HTMLElement>('[data-slot="scroll-area-scrollbar"]');
    const vertical = [...bars].find((bar) => bar.dataset.orientation === "vertical");
    const track = vertical?.querySelector<HTMLElement>(':scope > [data-slot="ink-frame"]');
    expect(track?.className).toContain("w-(--outline-width)");
  });

  it("draws the thumb with round ends once measured", () => {
    const observers = stubResizeObserver();
    render(<Pages />);
    observers.drawAll(8, 64);
    const frame = slot("scroll-area-thumb")?.querySelector<HTMLElement>('[data-slot="ink-frame"]');
    expect(frame?.dataset.inked).toBe("true");
    expect(frame?.querySelectorAll("path").length).toBeGreaterThan(0);
  });

  expectDemosAccessible(import.meta.glob("./demos/*.tsx"));
});
