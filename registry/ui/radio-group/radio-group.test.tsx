import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import type * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { expectNoA11yViolations } from "@/lib/test/axe";
import { stubResizeObserver } from "@/lib/test/resize-observer";
import RadioGroupDefaultDemo from "./demos/default";
import { RadioGroup, RadioGroupItem } from "./radio-group";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function Directions(props: React.ComponentProps<typeof RadioGroup>) {
  return (
    <RadioGroup aria-label="Direction" defaultValue="rtl" {...props}>
      <RadioGroupItem value="rtl" aria-label="Right to left" />
      <RadioGroupItem value="ltr" aria-label="Left to right" />
      <RadioGroupItem value="vertical" aria-label="Vertical" />
    </RadioGroup>
  );
}

const framesOf = (element: HTMLElement) => [
  ...element.querySelectorAll<HTMLElement>('[data-slot="ink-frame"]'),
];
const fillsOf = (element: HTMLElement) =>
  framesOf(element).map((frame) => frame.getAttribute("data-fill"));

describe("RadioGroup", () => {
  it("renders a radiogroup and items with data-slots and forwarded classNames", () => {
    render(<Directions className="custom-class" />);
    const group = screen.getByRole("radiogroup", { name: "Direction" });
    expect(group.getAttribute("data-slot")).toBe("radio-group");
    expect(group.classList.contains("custom-class")).toBe(true);
    const item = screen.getByRole("radio", { name: "Right to left" });
    expect(item.getAttribute("data-slot")).toBe("radio-group-item");
    expect(item.querySelector('[data-slot="radio-group-indicator"]')).not.toBeNull();
  });

  it("draws each circle as an ellipse InkFrame, filled with ink when checked", () => {
    render(<Directions />);
    const checked = screen.getByRole("radio", { name: "Right to left" });
    const unchecked = screen.getByRole("radio", { name: "Left to right" });
    expect(framesOf(checked).map((frame) => frame.getAttribute("data-shape"))).toEqual([
      "ellipse",
      "ellipse",
    ]);
    expect(fillsOf(checked)).toEqual(["paper", "ink"]);
    expect(fillsOf(unchecked)).toEqual(["paper"]);
  });

  it("uses one wobble for every circle", () => {
    const observers = stubResizeObserver();
    render(<Directions />);
    observers.drawAll(16, 16);
    const [first, second] = screen
      .getAllByRole("radio")
      .map((item) => framesOf(item)[0]?.querySelector("path")?.getAttribute("d"));
    expect(first).toBeTruthy();
    expect(first).toBe(second);
  });

  it("moves the selection with the arrow keys, like stock", async () => {
    render(<Directions />);
    const [rtl, ltr] = screen.getAllByRole("radio");
    act(() => rtl.focus());
    fireEvent.keyDown(rtl, { key: "ArrowDown" });
    await act(async () => {});
    expect(document.activeElement).toBe(ltr);
    expect(ltr.getAttribute("aria-checked")).toBe("true");
    expect(rtl.getAttribute("aria-checked")).toBe("false");
    expect(fillsOf(ltr)).toEqual(["paper", "ink"]);
  });

  it("screens disabled items with halftone through an unfilled outline", () => {
    render(
      <RadioGroup aria-label="Direction">
        <RadioGroupItem value="rtl" aria-label="Right to left" disabled />
      </RadioGroup>,
    );
    const item = screen.getByRole("radio");
    expect(item.classList.contains("data-disabled:halftone-light")).toBe(true);
    expect(fillsOf(item)).toEqual(["none"]);
  });

  it("has no axe violations in its default demo", async () => {
    await expectNoA11yViolations(<RadioGroupDefaultDemo />);
  });
});
