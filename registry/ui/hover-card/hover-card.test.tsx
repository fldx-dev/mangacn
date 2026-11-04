import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { expectNoA11yViolations } from "@/lib/test/axe";
import { stubResizeObserver } from "@/lib/test/resize-observer";
import HoverCardDefaultDemo from "./demos/default";
import HoverCardProfileDemo from "./demos/profile";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./hover-card";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function Author({ open }: { open?: boolean }) {
  return (
    <HoverCard defaultOpen={open}>
      <HoverCardTrigger href="#author" delay={0} closeDelay={0}>
        Aoi Takahashi
      </HoverCardTrigger>
      <HoverCardContent className="custom-class">Three series, one finished.</HoverCardContent>
    </HoverCard>
  );
}

const frameOf = (element: Element | null) =>
  element?.querySelector<HTMLElement>(':scope > [data-slot="ink-frame"]');

const popup = () => document.querySelector<HTMLElement>('[data-slot="hover-card-content"]');

describe("HoverCard", () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it("renders the trigger as a link with the stock slot, and opens on focus", async () => {
    render(<Author />);
    const trigger = screen.getByRole("link", { name: "Aoi Takahashi" });
    expect(trigger.getAttribute("data-slot")).toBe("hover-card-trigger");
    expect(popup()).toBeNull();
    act(() => trigger.focus());
    fireEvent.focus(trigger);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    expect(popup()?.textContent).toBe("Three series, one finished.");
    expect(popup()?.classList.contains("custom-class")).toBe(true);
  });

  it("draws a round-cornered paper panel at the heavy outline width, with no shadow or ring", () => {
    render(<Author open />);
    const content = popup();
    for (const name of content?.classList ?? []) {
      expect(name, name).not.toMatch(/^ring-|^shadow-/);
    }
    const frame = frameOf(content);
    expect(frame?.getAttribute("data-fill")).toBe("paper");
    expect(frame?.className).toContain("[--outline-width:var(--outline-width-heavy)]");
    expect(frame?.className).toContain("rounded-2xl");
  });

  it("draws its outline through a custom rounded path, not InkFrame's rectangle", () => {
    const observers = stubResizeObserver();
    render(<Author open />);
    observers.drawAll(256, 80);
    const frame = frameOf(popup());
    expect(frame?.getAttribute("data-inked")).toBe("true");
    // A custom outline goes through rough.js `path`, translated into the frame's padding;
    // a plain rectangle is drawn in place, with no transform.
    expect(frame?.querySelector("svg > g")?.getAttribute("transform")).toBe("translate(8 8)");
  });

  it("has no axe violations in its default demo (open)", async () => {
    await expectNoA11yViolations(<HoverCardDefaultDemo />);
  });

  it("has no axe violations in its profile demo (open)", async () => {
    await expectNoA11yViolations(<HoverCardProfileDemo />);
  });
});
