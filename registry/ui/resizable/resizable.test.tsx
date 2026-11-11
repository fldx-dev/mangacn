import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { expectDemosAccessible } from "@/lib/test/axe";
import { stubResizeObserver } from "@/lib/test/resize-observer";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "./resizable";

// The library measures its group with ResizeObserver, which jsdom lacks.
let observers: ReturnType<typeof stubResizeObserver>;
beforeEach(() => {
  observers = stubResizeObserver();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/**
 * jsdom lays nothing out, so the library would find a group of width 0 and no layout. Lay a
 * horizontal group out by hand: the group 400 x 200, each panel its share by the flex-grow the
 * library writes, the handle 2 px, side by side in DOM order; and a ResizeObserver that
 * reports every observed element as its own target.
 */
function layOut() {
  const width = (element: HTMLElement): number => {
    switch (element.dataset.slot) {
      case "resizable-panel-group":
        return 400;
      case "resizable-panel":
        return (Number.parseFloat(element.style.flexGrow || "0") / 100) * 398;
      case "resizable-handle":
        return 2;
      default:
        return 0;
    }
  };
  const left = (element: HTMLElement): number => {
    let x = 0;
    for (let sibling = element.previousElementSibling; sibling; ) {
      x += width(sibling as HTMLElement);
      sibling = sibling.previousElementSibling;
    }
    return element.dataset.slot === "resizable-panel-group" ? 0 : x;
  };
  const height = (element: HTMLElement) => (width(element) > 0 ? 200 : 0);
  vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockImplementation(function (
    this: HTMLElement,
  ) {
    return width(this);
  });
  vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockImplementation(function (
    this: HTMLElement,
  ) {
    return height(this);
  });
  vi.spyOn(HTMLElement.prototype, "offsetLeft", "get").mockImplementation(function (
    this: HTMLElement,
  ) {
    return left(this);
  });
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (
    this: HTMLElement,
  ) {
    const x = left(this);
    const w = width(this);
    const h = height(this);
    return { x, y: 0, top: 0, left: x, right: x + w, bottom: h, width: w, height: h } as DOMRect;
  });
  class TargetResizeObserver {
    constructor(private callback: ResizeObserverCallback) {}
    observe(target: HTMLElement) {
      const entry = {
        target,
        borderBoxSize: [{ inlineSize: width(target), blockSize: height(target) }],
        contentRect: { width: width(target), height: height(target) },
      } as unknown as ResizeObserverEntry;
      queueMicrotask(() => this.callback([entry], this as unknown as ResizeObserver));
    }
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal("ResizeObserver", TargetResizeObserver);
}

function Split({ withHandle, orientation }: { withHandle?: boolean; orientation?: "vertical" }) {
  return (
    <ResizablePanelGroup orientation={orientation} className="group-class">
      <ResizablePanel defaultSize="50%">One</ResizablePanel>
      <ResizableHandle withHandle={withHandle} className="handle-class" aria-label="Resize" />
      <ResizablePanel defaultSize="50%">Two</ResizablePanel>
    </ResizablePanelGroup>
  );
}

const slot = (name: string) => document.querySelector<HTMLElement>(`[data-slot="${name}"]`);
const rules = (handle: HTMLElement) => [
  ...handle.querySelectorAll<HTMLElement>(':scope > span[data-slot="ink-frame"]'),
];

describe("Resizable", () => {
  it("keeps stock's slots and forwards className", () => {
    render(<Split />);
    expect(slot("resizable-panel-group")?.classList.contains("group-class")).toBe(true);
    expect(document.querySelectorAll('[data-slot="resizable-panel"]')).toHaveLength(2);
    expect(slot("resizable-handle")?.classList.contains("handle-class")).toBe(true);
  });

  it("draws the handle as separator's rule, with a heavy trace shown only in its live states", () => {
    render(<Split />);
    const handle = slot("resizable-handle") as HTMLElement;
    expect(handle.className).toContain("w-(--outline-width)");
    const [light, heavy] = rules(handle);
    expect(light?.dataset.shape).toBe("line");
    expect(light?.dataset.fill).toBe("none");
    expect(light?.classList.contains("hidden")).toBe(false);
    expect(heavy?.dataset.shape).toBe("line");
    expect(heavy?.classList.contains("hidden")).toBe(true);
    expect(heavy?.className).toContain("[--outline-width:var(--outline-width-heavy)]");
    for (const state of ["hover", "focus", "active"]) {
      expect(heavy?.className).toContain(`group-data-[separator=${state}]/handle:block`);
    }
  });

  it("follows the library's state attribute while the handle has focus", () => {
    render(<Split />);
    const handle = screen.getByRole("separator", { name: "Resize" });
    expect(handle.dataset.separator).toBe("inactive");
    act(() => handle.focus());
    expect(handle.dataset.separator).toBe("focus");
    act(() => handle.blur());
    expect(handle.dataset.separator).toBe("inactive");
  });

  it("resizes the panels from the keyboard", async () => {
    layOut();
    render(<Split />);
    await act(async () => {});
    const handle = screen.getByRole("separator", { name: "Resize" });
    act(() => handle.focus());
    const before = Number(handle.getAttribute("aria-valuenow"));
    fireEvent.keyDown(handle, { key: "ArrowRight" });
    const after = Number(handle.getAttribute("aria-valuenow"));
    expect(after).toBeGreaterThan(before);
    fireEvent.keyDown(handle, { key: "ArrowLeft" });
    fireEvent.keyDown(handle, { key: "ArrowLeft" });
    expect(Number(handle.getAttribute("aria-valuenow"))).toBeLessThan(before);
  });

  it("adds a small outlined paper tab with three ink dots under withHandle", () => {
    render(<Split withHandle />);
    const handle = slot("resizable-handle") as HTMLElement;
    const tab = handle.querySelector<HTMLElement>(':scope > div[data-slot="ink-frame"]');
    expect(tab?.dataset.fill).toBe("paper");
    expect(tab?.querySelectorAll(".bg-ink")).toHaveLength(3);
    cleanup();
    render(<Split />);
    expect(slot("resizable-handle")?.querySelector(":scope > div")).toBeNull();
  });

  it("draws the rule once measured", () => {
    render(<Split />);
    observers.drawAll(2, 120);
    const [light] = rules(slot("resizable-handle") as HTMLElement);
    expect(light?.dataset.inked).toBe("true");
    expect(light?.querySelectorAll("path").length).toBeGreaterThan(0);
  });

  expectDemosAccessible(import.meta.glob("./demos/*.tsx"));
});
