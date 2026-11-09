import { cleanup, render, screen } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { expectDemosAccessible } from "@/lib/test/axe";
import { Spinner } from "./spinner";

// The whole file runs as if the reader asked for reduced motion: the spinner must not depend
// on script to stand still (no `motion`, nothing reads matchMedia), only on its CSS variant.
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

describe("Spinner", () => {
  it("is one SVG with role status, stock's Loading label and data-slot", () => {
    render(<Spinner className="custom-class" />);
    const spinner = screen.getByRole("status", { name: "Loading" });
    expect(spinner.tagName.toLowerCase()).toBe("svg");
    expect(spinner.dataset.slot).toBe("spinner");
    expect(spinner.classList.contains("custom-class")).toBe(true);
    expect(spinner.querySelectorAll("svg").length).toBe(0);
  });

  it("draws the ink-splash-loader blot and its droplets in currentColor", () => {
    render(<Spinner />);
    const spinner = screen.getByRole("status");
    expect(spinner.getAttribute("viewBox")).toBe("0 0 48 48");
    expect(spinner.getAttribute("fill")).toBe("currentColor");
    expect(spinner.querySelectorAll("path").length).toBe(1);
    expect(spinner.querySelectorAll("circle").length).toBe(4);
  });

  it("sits at 16 px by default; size-5 and size-6 give 20 and 24 px", () => {
    render(
      <>
        <Spinner />
        <Spinner className="size-5" />
        <Spinner className="size-6" />
      </>,
    );
    const [small, medium, large] = screen.getAllByRole("status");
    expect(small.classList.contains("size-4")).toBe(true);
    expect(medium.classList.contains("size-5")).toBe(true);
    expect(medium.classList.contains("size-4")).toBe(false);
    expect(large.classList.contains("size-6")).toBe(true);
  });

  it("turns with CSS only and stands still under reduced motion", () => {
    expect(window.matchMedia("(prefers-reduced-motion: reduce)").matches).toBe(true);
    render(<Spinner />);
    const spinner = screen.getByRole("status");
    expect(spinner.classList.contains("animate-spin")).toBe(true);
    expect(spinner.classList.contains("motion-reduce:animate-none")).toBe(true);
    for (const node of [spinner, ...spinner.querySelectorAll("*")]) {
      expect(node.getAttribute("style"), node.tagName).toBeNull();
    }
  });

  it("keeps a caller's label", () => {
    render(<Spinner aria-label="Uploading pages" />);
    expect(screen.getByRole("status", { name: "Uploading pages" })).not.toBeNull();
  });

  expectDemosAccessible(import.meta.glob("./demos/*.tsx"));
});
