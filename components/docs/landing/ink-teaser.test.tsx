import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { expectNoA11yViolations } from "@/lib/test/axe";
import { stubResizeObserver } from "@/lib/test/resize-observer";
import { InkTeaser } from "./ink-teaser";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

/** Base UI hides thumbs until it measures the track (never, in jsdom); name via the label id. */
const sliderFor = (label: string) => {
  const thumb = screen
    .getAllByRole("slider", { hidden: true })
    .find(
      (input) =>
        document.getElementById(input.getAttribute("aria-labelledby") ?? "")?.textContent === label,
    );
  if (!thumb) throw new Error(`no slider labelled ${label}`);
  return thumb;
};

describe("InkTeaser", () => {
  it("binds two registry sliders to the live frame and redraws it", () => {
    const observer = stubResizeObserver();
    const { container } = render(<InkTeaser />);
    expect(container.querySelectorAll('[data-slot="slider"]')).toHaveLength(2);
    observer.drawAll();
    const frame = () => screen.getByText("東京！");
    const before = frame();
    expect(before.parentElement?.style.getPropertyValue("--outline-width")).toBe("1.5px");

    observer.reset();
    fireEvent.change(sliderFor("Outline width"), { target: { value: "3" } });
    fireEvent.change(sliderFor("Roughness"), { target: { value: "0.4" } });
    expect(frame().parentElement?.style.getPropertyValue("--outline-width")).toBe("3px");
    expect(frame().parentElement?.style.getPropertyValue("--ink-roughness")).toBe("0.4");
    expect(screen.getByText("3px").tagName).toBe("OUTPUT");
    // A new frame, which draws again with the new pen.
    expect(frame()).not.toBe(before);
    observer.drawAll();
    expect(frame().dataset.inked).toBe("true");
  });

  it("has no axe violations", async () => {
    await expectNoA11yViolations(<InkTeaser />);
  });
});
