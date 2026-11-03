import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import InkMarkRevealDemo from "./demos/reveal";

// motion reads `prefers-reduced-motion` through matchMedia (missing in jsdom) once, on first
// use, and caches it for the module; so this file runs with reduced motion throughout, and
// ink-mark.test.tsx without it.
beforeAll(() => {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query.includes("reduce"),
    media: query,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
  }));
  vi.spyOn(HTMLElement.prototype, "getClientRects").mockImplementation(function (
    this: HTMLElement,
  ) {
    return (this.dataset.slot === "ink-mark"
      ? [{ left: 0, top: 0, right: 80, bottom: 24, width: 80, height: 24 }]
      : []) as unknown as DOMRectList;
  });
});

afterAll(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

afterEach(cleanup);

const strokes = () => [...document.querySelectorAll<SVGPathElement>('[data-slot="ink-mark"] path')];

describe("InkMark under reduced motion", () => {
  it("draws the whole mark at once when show turns on", async () => {
    render(<InkMarkRevealDemo />);
    const toggle = screen.getByRole("switch", { name: "Mark the answer" });
    fireEvent.click(toggle);
    await act(() => new Promise((resolve) => requestAnimationFrame(resolve)));
    for (const path of strokes()) expect(path.style.opacity).toBe("0");

    fireEvent.click(toggle);
    // One frame, far less than the half second a line takes to draw on.
    await act(() => new Promise((resolve) => requestAnimationFrame(resolve)));
    expect(strokes().length).toBeGreaterThan(0);
    for (const path of strokes()) {
      expect(path.style.opacity).toBe("1");
      // motion draws `pathLength` as the dash length (out of 1): the whole stroke.
      expect(Number.parseFloat(path.getAttribute("stroke-dashoffset") ?? "0")).toBe(0);
      expect(Number.parseFloat(path.getAttribute("stroke-dasharray") ?? "")).toBe(1);
    }
  });
});
