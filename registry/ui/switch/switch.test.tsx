import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { expectNoA11yViolations } from "@/lib/test/axe";
import { stubResizeObserver } from "@/lib/test/resize-observer";
import SwitchDefaultDemo from "./demos/default";
import { Switch } from "./switch";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const thumbOf = (element: HTMLElement) =>
  element.querySelector<HTMLElement>('[data-slot="switch-thumb"]');
const frameOf = (element: HTMLElement | null) =>
  element?.querySelector<HTMLElement>(':scope > [data-slot="ink-frame"]');

describe("Switch", () => {
  it("renders a switch with data-slot, size and a forwarded className", () => {
    render(<Switch className="custom-class" size="sm" aria-label="Tone" />);
    const control = screen.getByRole("switch", { name: "Tone" });
    expect(control.getAttribute("data-slot")).toBe("switch");
    expect(control.getAttribute("data-size")).toBe("sm");
    expect(control.classList.contains("custom-class")).toBe(true);
    expect(thumbOf(control)).not.toBeNull();
  });

  it("draws a tone track that turns ink when checked, and a paper disc thumb", () => {
    render(<Switch aria-label="Tone" />);
    const control = screen.getByRole("switch");
    expect(frameOf(control)?.getAttribute("data-fill")).toBe("tone");
    expect(control.classList.contains("data-checked:[--tone-2:var(--ink)]")).toBe(true);
    const thumb = frameOf(thumbOf(control));
    expect(thumb?.getAttribute("data-shape")).toBe("ellipse");
    expect(thumb?.getAttribute("data-fill")).toBe("paper");
    for (const name of control.classList) {
      expect(name, name).not.toMatch(/^border$|border-transparent|:border-/);
    }
  });

  it("toggles with Space, like stock", () => {
    render(<Switch aria-label="Tone" />);
    const control = screen.getByRole("switch");
    control.focus();
    expect(control.getAttribute("aria-checked")).toBe("false");
    fireEvent.keyDown(control, { key: " " });
    fireEvent.keyUp(control, { key: " " });
    expect(control.getAttribute("aria-checked")).toBe("true");
    expect(control.hasAttribute("data-checked")).toBe(true);
  });

  it("screens disabled tracks with halftone through an unfilled outline", () => {
    render(<Switch aria-label="Tone" disabled />);
    const control = screen.getByRole("switch");
    expect(control.classList.contains("data-disabled:halftone-light")).toBe(true);
    expect(frameOf(control)?.getAttribute("data-fill")).toBe("none");
  });

  it("draws track and thumb once measured", () => {
    const observers = stubResizeObserver();
    render(<Switch aria-label="Tone" />);
    observers.drawAll(32, 18);
    const control = screen.getByRole("switch");
    expect(frameOf(control)?.dataset.inked).toBe("true");
    expect(frameOf(thumbOf(control))?.dataset.inked).toBe("true");
  });

  it("has no axe violations in its default demo", async () => {
    await expectNoA11yViolations(<SwitchDefaultDemo />);
  });
});
