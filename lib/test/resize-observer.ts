import { act } from "@testing-library/react";
import { vi } from "vitest";

/**
 * jsdom has no ResizeObserver, so InkFrame never draws there. `stubResizeObserver()` installs
 * one that reports a fixed border box when `drawAll()` is called; undo with
 * `vi.unstubAllGlobals()`.
 */
export function stubResizeObserver() {
  const observers: { callback: ResizeObserverCallback; self: ResizeObserver }[] = [];
  class StubResizeObserver {
    constructor(callback: ResizeObserverCallback) {
      observers.push({ callback, self: this as unknown as ResizeObserver });
    }
    observe() {}
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
    /** Forgets earlier observers (call between renders in one test). */
    reset() {
      observers.length = 0;
    },
  };
}
