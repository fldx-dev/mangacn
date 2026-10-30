import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { expectNoA11yViolations } from "@/lib/test/axe";
import { stubResizeObserver } from "@/lib/test/resize-observer";
import { Checkbox } from "./checkbox";
import CheckboxDefaultDemo from "./demos/default";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const framesOf = (element: HTMLElement) => [
  ...element.querySelectorAll<HTMLElement>('[data-slot="ink-frame"]'),
];
const fillsOf = (element: HTMLElement) =>
  framesOf(element).map((frame) => frame.getAttribute("data-fill"));

describe("Checkbox", () => {
  it("renders a checkbox with data-slot and a forwarded className", () => {
    render(<Checkbox className="custom-class" aria-label="Agree" />);
    const checkbox = screen.getByRole("checkbox", { name: "Agree" });
    expect(checkbox.getAttribute("data-slot")).toBe("checkbox");
    expect(checkbox.classList.contains("custom-class")).toBe(true);
    expect(checkbox.classList.contains("border-0")).toBe(true);
  });

  it("draws a paper box, and an ink fill inside the indicator once checked", () => {
    render(<Checkbox aria-label="Agree" defaultChecked />);
    const checkbox = screen.getByRole("checkbox");
    expect(fillsOf(checkbox)).toEqual(["paper", "ink"]);
    expect(framesOf(checkbox)[1]?.closest('[data-slot="checkbox-indicator"]')).not.toBeNull();
  });

  it("uses one wobble for the box, its fill and every other checkbox", () => {
    const observers = stubResizeObserver();
    render(
      <>
        <Checkbox aria-label="One" defaultChecked />
        <Checkbox aria-label="Two" defaultChecked />
      </>,
    );
    observers.drawAll(16, 16);
    const [one, two] = screen
      .getAllByRole("checkbox")
      .map((checkbox) =>
        framesOf(checkbox).map((frame) => frame.querySelector("path")?.getAttribute("d")),
      );
    expect(one?.[0]).toBeTruthy();
    expect(one).toEqual(two);
  });

  it("toggles with Space, like stock", () => {
    render(<Checkbox aria-label="Agree" />);
    const checkbox = screen.getByRole("checkbox");
    checkbox.focus();
    expect(checkbox.getAttribute("aria-checked")).toBe("false");
    fireEvent.keyDown(checkbox, { key: " " });
    fireEvent.keyUp(checkbox, { key: " " });
    expect(checkbox.getAttribute("aria-checked")).toBe("true");
    expect(fillsOf(checkbox)).toEqual(["paper", "ink"]);
  });

  it("screens disabled boxes with halftone through an unfilled outline", () => {
    render(<Checkbox aria-label="Agree" disabled />);
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox.getAttribute("aria-disabled")).toBe("true");
    for (const name of ["data-disabled:opacity-100", "data-disabled:halftone-light"]) {
      expect(checkbox.classList.contains(name), name).toBe(true);
    }
    expect(fillsOf(checkbox)).toEqual(["none"]);
  });

  it("inks invalid boxes in spot", () => {
    render(<Checkbox aria-label="Agree" aria-invalid />);
    expect(
      screen.getByRole("checkbox").classList.contains("aria-invalid:[--ink:var(--destructive)]"),
    ).toBe(true);
  });

  it("has no axe violations in its default demo", async () => {
    await expectNoA11yViolations(<CheckboxDefaultDemo />);
  });
});
