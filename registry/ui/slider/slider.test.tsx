import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { expectNoA11yViolations } from "@/lib/test/axe";
import { stubResizeObserver } from "@/lib/test/resize-observer";
import SliderDefaultDemo from "./demos/default";
import SliderDisabledDemo from "./demos/disabled";
import SliderRangeDemo from "./demos/range";
import SliderVerticalDemo from "./demos/vertical";
import { Slider } from "./slider";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

// With `thumbAlignment="edge"` Base UI hides the thumbs until it has measured the track, and
// jsdom has no layout, so role queries include hidden elements. Hidden elements have no
// computed name and axe skips them, so the tests check what names them: `aria-labelledby`.
const sliders = (labelledBy?: string) =>
  screen
    .getAllByRole("slider", { hidden: true })
    .filter((thumb) => !labelledBy || thumb.getAttribute("aria-labelledby") === labelledBy);
const slot = (container: HTMLElement, name: string) =>
  container.querySelector<HTMLElement>(`[data-slot="${name}"]`);
const framesOf = (element: HTMLElement | null) => [
  ...(element?.querySelectorAll<HTMLElement>(':scope > [data-slot="ink-frame"]') ?? []),
];

function LabelledSlider(props: React.ComponentProps<typeof Slider>) {
  return (
    <>
      <span id="label">Density</span>
      <Slider aria-labelledby="label" {...props} />
    </>
  );
}

describe("Slider", () => {
  it("renders stock slots, a forwarded className and one named thumb per value", () => {
    const { container } = render(<LabelledSlider className="custom-class" defaultValue={[40]} />);
    expect(slot(container, "slider")?.classList.contains("custom-class")).toBe(true);
    for (const name of ["slider-track", "slider-range", "slider-thumb"]) {
      expect(slot(container, name), name).not.toBeNull();
    }
    const [thumb] = sliders("label");
    expect(sliders()).toHaveLength(1);
    expect(thumb).toHaveProperty("value", "40");
  });

  it("draws the track as one hand-drawn rule, the range in ink and a paper thumb", () => {
    const { container } = render(<LabelledSlider defaultValue={[40]} />);
    const [rule] = framesOf(slot(container, "slider-track"));
    expect(rule?.getAttribute("data-shape")).toBe("line");
    expect(rule?.getAttribute("data-fill")).toBe("none");
    const [range] = framesOf(slot(container, "slider-range"));
    expect(range?.getAttribute("data-fill")).toBe("ink");
    const [thumb] = framesOf(slot(container, "slider-thumb"));
    expect(thumb?.getAttribute("data-shape")).toBe("ellipse");
    expect(thumb?.getAttribute("data-fill")).toBe("paper");
    // The track no longer clips the drawing, which reaches past its box.
    expect(slot(container, "slider-track")?.classList.contains("overflow-hidden")).toBe(false);
  });

  it("renders two thumbs for a range and keeps stock's two-thumb default", () => {
    render(<LabelledSlider defaultValue={[10, 80]} />);
    expect(sliders("label")).toHaveLength(2);
    cleanup();
    render(<LabelledSlider />);
    expect(sliders()).toHaveLength(2);
  });

  it("changes its value from the keyboard and reports it, like stock", () => {
    const onValueChange = vi.fn();
    render(<LabelledSlider defaultValue={[40]} onValueChange={onValueChange} />);
    fireEvent.keyDown(sliders()[0] as HTMLElement, { key: "ArrowRight" });
    expect(onValueChange).toHaveBeenCalled();
    expect(onValueChange.mock.calls[0]?.[0]).toEqual([41]);
  });

  it("keeps the orientation and turns the rule vertical", () => {
    const { container } = render(<LabelledSlider orientation="vertical" defaultValue={[40]} />);
    expect(slot(container, "slider")?.getAttribute("data-orientation")).toBe("vertical");
    expect(sliders()[0]?.getAttribute("aria-orientation")).toBe("vertical");
    expect(framesOf(slot(container, "slider-track"))[0]?.className).toContain(
      "group-data-vertical/slider-track:w-(--outline-width)",
    );
  });

  it("draws a disabled slider in the muted tone", () => {
    const { container } = render(<LabelledSlider defaultValue={[40]} disabled />);
    expect(sliders()[0]).toHaveProperty("disabled", true);
    const control = slot(container, "slider-track")?.parentElement;
    expect(control?.className).toContain("data-disabled:[--ink:var(--muted-foreground)]");
  });

  it("inks the rule, the range and the thumb once measured", () => {
    const observers = stubResizeObserver();
    const { container } = render(<LabelledSlider defaultValue={[40]} />);
    observers.drawAll(200, 6);
    for (const name of ["slider-track", "slider-range", "slider-thumb"]) {
      expect(framesOf(slot(container, name))[0]?.dataset.inked, name).toBe("true");
    }
  });

  it("names every thumb in its demos", () => {
    render(
      <>
        <SliderDefaultDemo />
        <SliderRangeDemo />
        <SliderVerticalDemo />
        <SliderDisabledDemo />
      </>,
    );
    const names = sliders().map((thumb) => thumb.getAttribute("aria-labelledby"));
    expect(names).toHaveLength(7);
    for (const id of names) expect(document.getElementById(id ?? "")?.textContent).toBeTruthy();
  });

  it("has no axe violations in its demos", async () => {
    await expectNoA11yViolations(<SliderDefaultDemo />);
    await expectNoA11yViolations(<SliderRangeDemo />);
    await expectNoA11yViolations(<SliderVerticalDemo />);
    await expectNoA11yViolations(<SliderDisabledDemo />);
  });
});
