import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { expectDemosAccessible } from "@/lib/test/axe";
import { stubResizeObserver } from "@/lib/test/resize-observer";
import { Textarea } from "./textarea";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("Textarea", () => {
  it("renders a textarea with data-slot and a forwarded className", () => {
    render(<Textarea className="custom-class" aria-label="Script" />);
    const textarea = screen.getByRole("textbox", { name: "Script" });
    expect(textarea.tagName).toBe("TEXTAREA");
    expect(textarea.getAttribute("data-slot")).toBe("textarea");
    expect(textarea.classList.contains("custom-class")).toBe(true);
  });

  it("sits inside a paper InkFrame instead of drawing a CSS border", () => {
    render(<Textarea aria-label="Script" />);
    const textarea = screen.getByRole("textbox");
    for (const name of textarea.classList) {
      expect(name, name).not.toMatch(/^border$|border-input|:border-|shadow-/);
    }
    const frame = textarea.parentElement;
    expect(frame?.getAttribute("data-slot")).toBe("ink-frame");
    expect(frame?.getAttribute("data-fill")).toBe("paper");
    expect(frame?.className).toContain("has-[>[aria-invalid=true]]:[--ink:var(--destructive)]");
  });

  it("screens disabled textareas with halftone at full opacity", () => {
    render(<Textarea aria-label="Script" disabled />);
    const classes = screen.getByRole("textbox").classList;
    for (const name of ["disabled:opacity-100", "disabled:halftone-light"]) {
      expect(classes.contains(name), name).toBe(true);
    }
  });

  it("draws once measured", () => {
    const observers = stubResizeObserver();
    render(<Textarea aria-label="Script" />);
    observers.drawAll(240, 64);
    expect(screen.getByRole("textbox").parentElement?.dataset.inked).toBe("true");
  });

  it("turns its frame off inside a group that sets data-grouped", () => {
    render(
      <div data-grouped="">
        <Textarea aria-label="Notes" />
      </div>,
    );
    const frame = screen.getByRole("textbox").parentElement;
    // The frame stays (it holds the textarea); its drawing and fallback border hide in a group.
    for (const name of [
      "in-data-grouped:border-0",
      "in-data-grouped:bg-transparent",
      "in-data-grouped:[&>svg]:hidden",
    ]) {
      expect(frame?.classList.contains(name), name).toBe(true);
    }
  });

  expectDemosAccessible(import.meta.glob("./demos/*.tsx"));
});
