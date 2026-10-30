import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { expectNoA11yViolations } from "@/lib/test/axe";
import { stubResizeObserver } from "@/lib/test/resize-observer";
import PanelDefaultDemo from "./demos/default";
import { Panel } from "./panel";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const frameOf = (element: HTMLElement) =>
  element.querySelector<HTMLElement>(':scope > [data-slot="ink-frame"]');

describe("Panel", () => {
  it("renders a section with data-slot and a forwarded className", () => {
    const { container } = render(<Panel className="custom-class">Hi</Panel>);
    const panel = container.firstElementChild as HTMLElement;
    expect(panel.tagName).toBe("SECTION");
    expect(panel.dataset.slot).toBe("panel");
    expect(panel.classList.contains("custom-class")).toBe(true);
    expect(panel.textContent).toBe("Hi");
  });

  it("renders the element given by as", () => {
    render(
      <Panel as="article" aria-label="Opening">
        Hi
      </Panel>,
    );
    expect(screen.getByRole("article", { name: "Opening" }).dataset.slot).toBe("panel");
  });

  it("draws a heavy InkFrame on paper instead of a CSS border", () => {
    const observers = stubResizeObserver();
    const { container } = render(<Panel>Hi</Panel>);
    const panel = container.firstElementChild as HTMLElement;
    for (const name of panel.classList) expect(name, name).not.toMatch(/^border|shadow/);
    const frame = frameOf(panel);
    expect(frame?.dataset.fill).toBe("paper");
    expect(frame?.className).toContain("[--outline-width:var(--outline-width-heavy)]");
    observers.drawAll(240, 160);
    expect(frame?.dataset.inked).toBe("true");
    expect(frame?.querySelectorAll("svg > g")).toHaveLength(1);
  });

  it.each([
    ["halftone", "halftone"],
    ["lines", "screentone-lines"],
    ["cross", "screentone-cross"],
  ] as const)("lays the %s tone over the paper", (tone, utility) => {
    const { container } = render(<Panel tone={tone}>Hi</Panel>);
    const panel = container.firstElementChild as HTMLElement;
    expect(panel.dataset.tone).toBe(tone);
    const layer = panel.querySelector('[data-slot="panel-tone"]');
    expect(layer?.classList.contains(utility)).toBe(true);
    expect(layer?.getAttribute("aria-hidden")).toBe("true");
  });

  it("hides the tone layer by default", () => {
    const { container } = render(<Panel>Hi</Panel>);
    expect(container.querySelector('[data-slot="panel-tone"]')?.classList).toContain("hidden");
  });

  it("adds a hatched shadow only when asked", () => {
    const observers = stubResizeObserver();
    const { container } = render(<Panel shadow>Hi</Panel>);
    const panel = container.firstElementChild as HTMLElement;
    expect(panel.dataset.shadow).toBe("true");
    observers.drawAll(240, 160);
    expect(frameOf(panel)?.querySelectorAll("svg > g")).toHaveLength(2);
  });

  it.each([
    ["top-left", "self-start"],
    ["top-right", "self-end"],
    ["bottom-left", "order-last"],
    ["bottom-right", "order-last"],
  ] as const)("puts the caption %s as text", (side, name) => {
    render(
      <Panel caption="Later that night" captionSide={side}>
        Hi
      </Panel>,
    );
    const caption = screen.getByText("Later that night");
    expect(caption.dataset.slot).toBe("panel-caption");
    expect(caption.dataset.side).toBe(side);
    expect(caption.classList.contains(name)).toBe(true);
  });

  it("has no axe violations in its default demo", async () => {
    await expectNoA11yViolations(<PanelDefaultDemo />);
  });
});
