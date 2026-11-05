import { act } from "@testing-library/react";
import { vi } from "vitest";

/**
 * jsdom has no ResizeObserver, so InkFrame never draws there. `stubResizeObserver()` installs
 * one that reports a fixed border box when `drawAll()` is called; undo with
 * `vi.unstubAllGlobals()`.
 */
export function stubResizeObserver() {
  const observers: { callback: ResizeObserverCallback; self: ResizeObserver }[] = [];
  const observed = new Set<Element>();
  class StubResizeObserver {
    constructor(callback: ResizeObserverCallback) {
      observers.push({ callback, self: this as unknown as ResizeObserver });
    }
    observe(target: Element) {
      observed.add(target);
    }
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal("ResizeObserver", StubResizeObserver);

  return {
    /** Reports `width` × `height` to every observer created so far. */
    drawAll(width = 120, height = 32) {
      const entry = {
        borderBoxSize: [{ inlineSize: width, blockSize: height }],
        contentRect: { width, height },
      } as unknown as ResizeObserverEntry;
      act(() => {
        for (const { callback, self } of observers) callback([entry], self);
      });
    },
    /**
     * Whether a frame has registered its observer yet. InkFrame does that in a passive effect,
     * so a frame that a library mounted from its own timers (sonner's toasts) can be on the page
     * before `drawAll()` would reach it; wait on this, not on the DOM.
     */
    observes(target: Element | null | undefined) {
      return target !== null && target !== undefined && observed.has(target);
    },
    /** Forgets earlier observers (call between renders in one test). */
    reset() {
      observers.length = 0;
      observed.clear();
    },
  };
}
