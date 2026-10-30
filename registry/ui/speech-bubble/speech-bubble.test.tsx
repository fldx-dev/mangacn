import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { expectNoA11yViolations } from "@/lib/test/axe";
import { stubResizeObserver } from "@/lib/test/resize-observer";
import SpeechBubbleDefaultDemo from "./demos/default";
import { SpeechBubble } from "./speech-bubble";

let observers: ReturnType<typeof stubResizeObserver>;

beforeEach(() => {
  observers = stubResizeObserver();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const bubbleOf = (container: HTMLElement) => container.firstElementChild as HTMLElement;
const frameOf = (element: HTMLElement) =>
  element.querySelector<HTMLElement>(':scope > [data-slot="ink-frame"]');
/** The drawn outline: rough.js `path` output, translated into the frame's padding. */
const outlineOf = (element: HTMLElement) => frameOf(element)?.querySelector("svg > g");

const TAILS = [
  "bottom-left",
  "bottom-right",
  "top-left",
  "top-right",
  "left",
  "right",
  "none",
] as const;

describe("SpeechBubble", () => {
  it("renders real text with data-slot, defaults and a forwarded className", () => {
    const { container } = render(<SpeechBubble className="custom-class">Hello there</SpeechBubble>);
    const bubble = bubbleOf(container);
    expect(bubble.dataset.slot).toBe("speech-bubble");
    expect(bubble.dataset.shape).toBe("round");
    expect(bubble.dataset.tail).toBe("bottom-left");
    expect(bubble.classList.contains("custom-class")).toBe(true);
    expect(bubble.classList.contains("font-dialogue")).toBe(true);
    expect(screen.getByText("Hello there")).toBe(bubble);
    expect(bubble.getAttribute("role")).toBeNull();
  });

  it("becomes a labelled note when given aria-label", () => {
    render(<SpeechBubble aria-label="Kenji">Run!</SpeechBubble>);
    expect(screen.getByRole("note", { name: "Kenji" }).textContent).toBe("Run!");
  });

  it("draws its outline with InkFrame, not a CSS border", () => {
    const { container } = render(<SpeechBubble>Hi</SpeechBubble>);
    const bubble = bubbleOf(container);
    for (const name of bubble.classList) expect(name, name).not.toMatch(/^border|shadow|rounded/);
    observers.drawAll(160, 56);
    const frame = frameOf(bubble);
    expect(frame?.dataset.inked).toBe("true");
    expect(frame?.dataset.shape).toBe("ellipse");
    expect(outlineOf(bubble)?.getAttribute("transform")).toBe("translate(8 8)");
  });

  it.each(TAILS)("draws a %s tail and leaves room for it", (tail) => {
    const { container } = render(<SpeechBubble tail={tail}>Hi</SpeechBubble>);
    const bubble = bubbleOf(container);
    expect(bubble.dataset.tail).toBe(tail);
    observers.drawAll(160, 56);
    // The tail tip is the only point outside the box; `none` stays inside it.
    const d = [...(outlineOf(bubble)?.querySelectorAll("path") ?? [])]
      .map((path) => path.getAttribute("d") ?? "")
      .join(" ");
    const numbers = d.match(/-?\d+(\.\d+)?/g)?.map(Number) ?? [];
    const outside = numbers.some((n) => n < -10 || n > 170);
    expect(outside).toBe(tail !== "none");
    const room = {
      "bottom-left": "mb-5",
      "bottom-right": "mb-5",
      "top-left": "mt-5",
      "top-right": "mt-5",
      left: "ml-5",
      right: "mr-5",
      none: undefined,
    }[tail];
    if (room) expect(bubble.classList.contains(room)).toBe(true);
  });

  it.each([
    ["round", "ellipse", false],
    ["square", "rect", false],
    ["shout", "ellipse", false],
    ["whisper", "ellipse", true],
  ] as const)("draws the %s shape (fallback %s, dashed %s)", (shape, fallback, dashed) => {
    const { container } = render(<SpeechBubble shape={shape}>Hi</SpeechBubble>);
    const bubble = bubbleOf(container);
    expect(bubble.dataset.shape).toBe(shape);
    expect(frameOf(bubble)?.dataset.shape).toBe(fallback);
    observers.drawAll(160, 56);
    const stroke = [...(outlineOf(bubble)?.querySelectorAll("path") ?? [])].find(
      (path) => path.style.stroke === "var(--ink)",
    );
    expect(stroke?.hasAttribute("stroke-dasharray")).toBe(dashed);
  });

  it("shouts in heavy weight with a heavy outline", () => {
    const { container } = render(<SpeechBubble shape="shout">Behind you!!</SpeechBubble>);
    const bubble = bubbleOf(container);
    for (const name of ["font-extrabold", "uppercase"]) {
      expect(bubble.classList.contains(name), name).toBe(true);
    }
    expect(frameOf(bubble)?.className).toContain("[--outline-width:var(--outline-width-heavy)]");
  });

  it("fills a light tone and can inherit the font", () => {
    const { container } = render(
      <SpeechBubble tone="light" font="inherit">
        Hi
      </SpeechBubble>,
    );
    const bubble = bubbleOf(container);
    expect(bubble.dataset.tone).toBe("light");
    expect(frameOf(bubble)?.dataset.fill).toBe("tone");
    expect(bubble.classList.contains("font-dialogue")).toBe(false);
  });

  it("has no axe violations in its default demo", async () => {
    await expectNoA11yViolations(<SpeechBubbleDefaultDemo />);
  });
});
