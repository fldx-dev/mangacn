import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
// The install path a dependent imports (tsconfig.json and vitest.config.mts map it here).
import { useIsMobile } from "@/hooks/use-mobile";

// jsdom has no matchMedia: a stub that records the query and its listeners, and fires `change`
// the way a browser does when the viewport crosses the breakpoint.
function stubViewport(width: number) {
  const listeners = new Set<() => void>();
  const queries: string[] = [];
  vi.stubGlobal("innerWidth", width);
  vi.stubGlobal("matchMedia", (query: string) => {
    queries.push(query);
    return {
      media: query,
      get matches() {
        return window.innerWidth < 768;
      },
      addEventListener: (type: string, listener: () => void) => {
        if (type === "change") listeners.add(listener);
      },
      removeEventListener: (type: string, listener: () => void) => {
        if (type === "change") listeners.delete(listener);
      },
    };
  });
  return {
    queries,
    listeners,
    resize(to: number) {
      vi.stubGlobal("innerWidth", to);
      act(() => {
        for (const listener of listeners) listener();
      });
    },
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useIsMobile", () => {
  it("is false at and above the 768 px breakpoint", () => {
    stubViewport(768);
    expect(renderHook(() => useIsMobile()).result.current).toBe(false);
    stubViewport(1280);
    expect(renderHook(() => useIsMobile()).result.current).toBe(false);
  });

  it("is true below the breakpoint, watching the max-width 767px query", () => {
    const viewport = stubViewport(375);
    expect(renderHook(() => useIsMobile()).result.current).toBe(true);
    expect(viewport.queries).toEqual(["(max-width: 767px)"]);
  });

  it("follows a change event both ways", () => {
    const viewport = stubViewport(1024);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
    viewport.resize(500);
    expect(result.current).toBe(true);
    viewport.resize(900);
    expect(result.current).toBe(false);
  });

  it("removes its change listener on unmount", () => {
    const viewport = stubViewport(1024);
    const { unmount } = renderHook(() => useIsMobile());
    expect(viewport.listeners.size).toBe(1);
    unmount();
    expect(viewport.listeners.size).toBe(0);
  });
});
