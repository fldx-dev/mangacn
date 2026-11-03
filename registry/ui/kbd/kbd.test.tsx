import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { expectNoA11yViolations } from "@/lib/test/axe";
import { stubResizeObserver } from "@/lib/test/resize-observer";
import KbdDefaultDemo from "./demos/default";
import KbdGroupDemo from "./demos/group";
import KbdSentenceDemo from "./demos/sentence";
import { Kbd, KbdGroup } from "./kbd";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const frameOf = (element: HTMLElement) =>
  element.querySelector<HTMLElement>(':scope > [data-slot="ink-frame"]');

describe("Kbd", () => {
  it("renders a kbd with data-slot and a forwarded className", () => {
    render(<Kbd className="custom-class">Esc</Kbd>);
    const key = screen.getByText("Esc");
    expect(key.tagName).toBe("KBD");
    expect(key.getAttribute("data-slot")).toBe("kbd");
    expect(key.classList.contains("custom-class")).toBe(true);
  });

  it("shares badge's caption-box look on a hand-drawn paper key cap", () => {
    render(<Kbd>Esc</Kbd>);
    const key = screen.getByText("Esc");
    for (const name of [
      "rounded-sm",
      "font-display",
      "text-[11px]",
      "leading-none",
      "tracking-widest",
      "uppercase",
    ]) {
      expect(key.classList.contains(name), name).toBe(true);
    }
    expect(frameOf(key)?.getAttribute("data-fill")).toBe("paper");
    // Phrasing content only: the frame is a span.
    expect(frameOf(key)?.tagName).toBe("SPAN");
  });

  it("inverts inside a tooltip's ink popup", () => {
    render(<Kbd>K</Kbd>);
    expect(screen.getByText("K").className).toContain(
      "in-data-[slot=tooltip-content]:[--ink:var(--background)]",
    );
  });

  it("draws once measured", () => {
    const observers = stubResizeObserver();
    render(<Kbd>Shift</Kbd>);
    observers.drawAll(48, 22);
    expect(frameOf(screen.getByText("Shift"))?.dataset.inked).toBe("true");
  });

  it("keeps KbdGroup as a kbd of keys", () => {
    render(
      <KbdGroup className="custom-class">
        <Kbd>Ctrl</Kbd>
        <Kbd>K</Kbd>
      </KbdGroup>,
    );
    const group = screen.getByText("Ctrl").parentElement;
    expect(group?.tagName).toBe("KBD");
    expect(group?.getAttribute("data-slot")).toBe("kbd-group");
    expect(group?.classList.contains("custom-class")).toBe(true);
  });

  it("has no axe violations in its demos", async () => {
    await expectNoA11yViolations(<KbdDefaultDemo />);
    await expectNoA11yViolations(<KbdGroupDemo />);
    await expectNoA11yViolations(<KbdSentenceDemo />);
  });
});
