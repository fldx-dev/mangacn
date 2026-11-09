import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { expectDemosAccessible } from "@/lib/test/axe";
import { stubResizeObserver } from "@/lib/test/resize-observer";
import { Input } from "./input";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("Input", () => {
  it("renders an input with data-slot, type and a forwarded className", () => {
    render(<Input type="email" className="custom-class" aria-label="Email" />);
    const input = screen.getByRole("textbox", { name: "Email" });
    expect(input.getAttribute("data-slot")).toBe("input");
    expect(input.getAttribute("type")).toBe("email");
    expect(input.classList.contains("custom-class")).toBe(true);
  });

  it("sits inside a paper InkFrame instead of drawing a CSS border", () => {
    render(<Input aria-label="Title" />);
    const input = screen.getByRole("textbox");
    for (const name of input.classList) {
      expect(name, name).not.toMatch(/^border$|border-input|(visible|invalid):border-|shadow-/);
    }
    expect(input.classList.contains("border-0")).toBe(true);
    const frame = input.parentElement;
    expect(frame?.getAttribute("data-slot")).toBe("ink-frame");
    expect(frame?.getAttribute("data-fill")).toBe("paper");
  });

  it("inks the frame in spot when invalid", () => {
    render(<Input aria-label="Title" aria-invalid />);
    const frame = screen.getByRole("textbox").parentElement;
    expect(frame?.className).toContain("has-[>[aria-invalid=true]]:[--ink:var(--destructive)]");
  });

  it("screens disabled inputs with halftone at full opacity", () => {
    render(<Input aria-label="Title" disabled />);
    const input = screen.getByRole("textbox");
    expect(input.hasAttribute("disabled")).toBe(true);
    for (const name of [
      "disabled:opacity-100",
      "disabled:halftone-light",
      "disabled:text-muted-foreground",
    ]) {
      expect(input.classList.contains(name), name).toBe(true);
    }
  });

  it("draws once measured", () => {
    const observers = stubResizeObserver();
    render(<Input aria-label="Title" />);
    observers.drawAll(240, 32);
    const frame = screen.getByRole("textbox").parentElement;
    expect(frame?.dataset.inked).toBe("true");
    expect(frame?.querySelectorAll("path").length).toBeGreaterThan(0);
  });

  it("turns its frame off inside a group that sets data-grouped", () => {
    render(
      <div data-grouped="">
        <Input aria-label="Title" />
      </div>,
    );
    const frame = screen.getByRole("textbox").parentElement;
    // The frame stays (it holds the input); its drawing and fallback border hide in a group.
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
