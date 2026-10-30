import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { expectNoA11yViolations } from "@/lib/test/axe";
import { stubResizeObserver } from "@/lib/test/resize-observer";
import ThoughtBubbleDefaultDemo from "./demos/default";
import { ThoughtBubble } from "./thought-bubble";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const bubbleOf = (container: HTMLElement) => container.firstElementChild as HTMLElement;
const dotsOf = (element: HTMLElement) =>
  element.querySelectorAll('[data-slot="thought-bubble-dots"] > [data-slot="ink-frame"]');

describe("ThoughtBubble", () => {
  it("renders real text with data-slot and a forwarded className", () => {
    const { container } = render(<ThoughtBubble className="custom-class">Hmm</ThoughtBubble>);
    const bubble = bubbleOf(container);
    expect(bubble.dataset.slot).toBe("thought-bubble");
    expect(bubble.classList.contains("custom-class")).toBe(true);
    expect(bubble.classList.contains("font-dialogue")).toBe(true);
    expect(screen.getByText("Hmm")).toBe(bubble);
  });

  it("draws a dashed rough ellipse", () => {
    const observers = stubResizeObserver();
    const { container } = render(<ThoughtBubble>Hmm</ThoughtBubble>);
    const frame = bubbleOf(container).querySelector<HTMLElement>(
      ':scope > [data-slot="ink-frame"]',
    );
    expect(frame?.dataset.shape).toBe("ellipse");
    observers.drawAll(160, 56);
    const dashed = frame?.querySelector(":scope > svg [stroke-dasharray]");
    expect(dashed).not.toBeNull();
  });

  it.each([1, 2, 3] as const)("trails %i rough dots, hidden from assistive tech", (dots) => {
    const { container } = render(<ThoughtBubble dots={dots}>Hmm</ThoughtBubble>);
    const bubble = bubbleOf(container);
    expect(bubble.dataset.dots).toBe(String(dots));
    const trail = dotsOf(bubble);
    expect(trail).toHaveLength(dots);
    for (const dot of trail) expect((dot as HTMLElement).dataset.shape).toBe("ellipse");
    const wrapper = bubble.querySelector('[data-slot="thought-bubble-dots"]');
    expect(wrapper?.getAttribute("aria-hidden")).toBe("true");
  });

  it("trails two dots by default, on the left", () => {
    const { container } = render(<ThoughtBubble>Hmm</ThoughtBubble>);
    const bubble = bubbleOf(container);
    expect(dotsOf(bubble)).toHaveLength(2);
    expect(bubble.dataset.tailSide).toBe("left");
  });

  it("moves the trail to the right", () => {
    const { container } = render(<ThoughtBubble tailSide="right">Hmm</ThoughtBubble>);
    const wrapper = container.querySelector('[data-slot="thought-bubble-dots"]');
    expect(wrapper?.classList.contains("right-[22%]")).toBe(true);
  });

  it("becomes a labelled note when given aria-label", () => {
    render(<ThoughtBubble aria-label="Aiko">Hmm</ThoughtBubble>);
    expect(screen.getByRole("note", { name: "Aiko" })).toBeTruthy();
  });

  it("has no axe violations in its default demo", async () => {
    await expectNoA11yViolations(<ThoughtBubbleDefaultDemo />);
  });
});
