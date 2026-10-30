import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { expectNoA11yViolations } from "@/lib/test/axe";
import { stubResizeObserver } from "@/lib/test/resize-observer";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./card";
import CardDefaultDemo from "./demos/default";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const frameOf = (element: Element | null) =>
  element?.querySelector<HTMLElement>(':scope > [data-slot="ink-frame"]');

describe("Card", () => {
  it("renders every part with its data-slot and a forwarded className", () => {
    render(
      <Card className="custom-class" data-testid="card">
        <CardHeader>
          <CardTitle>Title</CardTitle>
        </CardHeader>
        <CardContent>Body</CardContent>
        <CardFooter>Footer</CardFooter>
      </Card>,
    );
    const card = screen.getByTestId("card");
    expect(card.getAttribute("data-slot")).toBe("card");
    expect(card.getAttribute("data-size")).toBe("default");
    expect(card.classList.contains("custom-class")).toBe(true);
    for (const slot of ["card-header", "card-title", "card-content", "card-footer"]) {
      expect(card.querySelector(`[data-slot="${slot}"]`), slot).not.toBeNull();
    }
    expect(screen.getByText("Footer").getAttribute("data-slot")).toBe("card-footer");
  });

  it("draws a paper InkFrame instead of the hairline ring, without clipping it", () => {
    render(<Card data-testid="card" />);
    const card = screen.getByTestId("card");
    for (const name of card.classList) {
      expect(name, name).not.toMatch(/^ring-|^overflow-hidden$|^shadow-/);
    }
    const frame = frameOf(card);
    expect(frame?.getAttribute("data-fill")).toBe("paper");
    expect(frame?.getAttribute("data-shape")).toBe("rect");
    expect(card.classList.contains("has-[>[data-inked=true]]:bg-transparent!")).toBe(true);
  });

  it.each([
    ["none", "none"],
    ["ink", "solid"],
    ["hatch", "hatch"],
  ] as const)("maps shadow=%s to an InkFrame %s shadow", (shadow, drawn) => {
    const observers = stubResizeObserver();
    render(<Card data-testid="card" shadow={shadow} />);
    observers.drawAll(320, 160);
    const card = screen.getByTestId("card");
    expect(card.getAttribute("data-shadow")).toBe(shadow);
    const frame = frameOf(card);
    expect(frame?.dataset.inked).toBe("true");
    // The shadow is drawn as an extra rough.js group behind the outline.
    expect(frame?.querySelectorAll("svg > g").length).toBe(drawn === "none" ? 1 : 2);
  });

  it("rules the footer with a hand-drawn line instead of border-t", () => {
    render(<CardFooter>Footer</CardFooter>);
    const footer = screen.getByText("Footer");
    expect(footer.classList.contains("border-t")).toBe(false);
    expect(frameOf(footer)?.getAttribute("data-shape")).toBe("line");
  });

  it("has no axe violations in its default demo", async () => {
    await expectNoA11yViolations(<CardDefaultDemo />);
  });
});
