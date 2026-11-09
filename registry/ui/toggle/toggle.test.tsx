import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { expectDemosAccessible } from "@/lib/test/axe";
import { stubResizeObserver } from "@/lib/test/resize-observer";
import { Toggle, toggleVariants } from "./toggle";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const framesOf = (element: HTMLElement) => [
  ...element.querySelectorAll<HTMLElement>(':scope > [data-slot="ink-frame"]'),
];

describe("Toggle", () => {
  it("renders a pressable button with data-slot, size classes and a forwarded className", () => {
    render(
      <Toggle className="custom-class" size="sm">
        Furigana
      </Toggle>,
    );
    const toggle = screen.getByRole("button", { name: "Furigana" });
    expect(toggle.getAttribute("data-slot")).toBe("toggle");
    expect(toggle.getAttribute("aria-pressed")).toBe("false");
    expect(toggle.classList.contains("custom-class")).toBe(true);
    expect(toggle.classList.contains("h-7")).toBe(true);
  });

  it("presses on click and fills with ink under paper text, like a pressed button", () => {
    render(<Toggle>Furigana</Toggle>);
    const toggle = screen.getByRole("button");
    const [fill] = framesOf(toggle);
    expect(fill?.getAttribute("data-fill")).toBe("ink");
    // Shown only while pressed.
    expect(fill?.classList.contains("hidden")).toBe(true);
    expect(fill?.classList.contains("group-aria-pressed/toggle:block")).toBe(true);
    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-pressed")).toBe("true");
    expect(toggle.classList.contains("aria-pressed:bg-primary")).toBe(true);
    expect(toggle.classList.contains("aria-pressed:text-primary-foreground")).toBe(true);
  });

  it("keeps outline: a paper frame under the ink fill, with the same seed", () => {
    const observers = stubResizeObserver();
    render(
      <Toggle variant="outline" defaultPressed>
        Right to left
      </Toggle>,
    );
    observers.drawAll(96, 32);
    const [paper, ink] = framesOf(screen.getByRole("button"));
    expect(paper?.getAttribute("data-fill")).toBe("paper");
    expect(ink?.getAttribute("data-fill")).toBe("ink");
    expect(paper?.dataset.inked).toBe("true");
    expect(ink?.dataset.inked).toBe("true");
    // Same seed, same box: the ink outline lands on the paper one.
    const outline = (frame?: HTMLElement) => frame?.querySelector("path")?.getAttribute("d");
    expect(outline(ink)).toBe(outline(paper));
  });

  it("draws no outline for the default variant", () => {
    render(<Toggle>Furigana</Toggle>);
    expect(framesOf(screen.getByRole("button"))).toHaveLength(1);
  });

  it("screens a disabled outline toggle with halftone through an unfilled outline", () => {
    render(
      <Toggle variant="outline" disabled>
        Colour pages
      </Toggle>,
    );
    const toggle = screen.getByRole("button");
    expect(toggle.classList.contains("disabled:halftone-light")).toBe(true);
    expect(framesOf(toggle)[0]?.getAttribute("data-fill")).toBe("none");
  });

  it("keeps stock's variant and size keys", () => {
    for (const variant of ["default", "outline"] as const) {
      for (const size of ["default", "sm", "lg"] as const) {
        expect(toggleVariants({ variant, size })).toContain("group/toggle");
      }
    }
  });

  expectDemosAccessible(import.meta.glob("./demos/*.tsx"));
});
