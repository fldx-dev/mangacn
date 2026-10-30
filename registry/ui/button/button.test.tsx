import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { expectNoA11yViolations } from "@/lib/test/axe";
import { stubResizeObserver } from "@/lib/test/resize-observer";
import { Button, buttonVariants } from "./button";
import ButtonDefaultDemo from "./demos/default";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const frameOf = (element: HTMLElement) =>
  element.querySelector<HTMLElement>(':scope > [data-slot="ink-frame"]');

describe("Button", () => {
  it("renders a button with data-slot and a forwarded className", () => {
    render(<Button className="custom-class">Go</Button>);
    const button = screen.getByRole("button", { name: "Go" });
    expect(button.getAttribute("data-slot")).toBe("button");
    expect(button.classList.contains("custom-class")).toBe(true);
  });

  it("has no CSS border or shadow; an InkFrame layer draws the outline", () => {
    render(<Button>Go</Button>);
    const button = screen.getByRole("button");
    for (const name of button.classList) {
      expect(name, name).not.toMatch(/ink-shadow|(^|:)shadow-|border-\[length|border-border/);
    }
    for (const name of ["relative", "isolate", "border-0"]) {
      expect(button.classList.contains(name), name).toBe(true);
    }
    const frame = frameOf(button);
    expect(frame?.getAttribute("data-fill")).toBe("ink");
    expect(frame?.className).toContain("absolute inset-0 -z-1");
    expect(button.textContent).toBe("Go");
  });

  it("presses by translating 1 px, with no shadow to collapse", () => {
    const classes = buttonVariants();
    expect(classes).toContain("active:not-aria-[haspopup]:translate-[1px_1px]");
    expect(classes).not.toContain("translate-y-px");
    expect(classes).not.toContain("shadow-none");
  });

  it.each([
    ["default", "ink"],
    ["outline", "paper"],
    ["secondary", "tone"],
    ["destructive", "paper"],
    ["sfx", "paper"],
  ] as const)("draws the %s variant with a %s fill", (variant, fill) => {
    render(<Button variant={variant}>Go</Button>);
    expect(frameOf(screen.getByRole("button"))?.getAttribute("data-fill")).toBe(fill);
  });

  it.each(["ghost", "link"] as const)(
    "draws no frame for %s, like stock's borderless",
    (variant) => {
      render(<Button variant={variant}>Go</Button>);
      expect(frameOf(screen.getByRole("button"))).toBeNull();
    },
  );

  it("inks destructive outlines in spot", () => {
    expect(buttonVariants({ variant: "destructive" })).toContain("[--ink:var(--destructive)]");
  });

  it("screens disabled buttons with halftone through an unfilled outline", () => {
    render(<Button disabled>Go</Button>);
    const button = screen.getByRole("button");
    expect(button.hasAttribute("disabled")).toBe(true);
    for (const name of [
      "disabled:opacity-100",
      "disabled:halftone-light",
      "disabled:text-muted-foreground",
    ]) {
      expect(button.classList.contains(name), name).toBe(true);
    }
    expect(frameOf(button)?.getAttribute("data-fill")).toBe("none");
  });

  it("maps the sfx variant to display type with a paper fill", () => {
    render(<Button variant="sfx">Dokan!</Button>);
    const classes = screen.getByRole("button").classList;
    for (const name of ["font-display", "uppercase", "bg-paper", "text-ink"]) {
      expect(classes.contains(name), name).toBe(true);
    }
  });

  it("draws once measured and clears its CSS fill", () => {
    const observers = stubResizeObserver();
    render(<Button>Go</Button>);
    const button = screen.getByRole("button");
    observers.drawAll(64, 32);
    const frame = frameOf(button);
    expect(frame?.dataset.inked).toBe("true");
    expect(frame?.querySelectorAll("path").length).toBeGreaterThan(0);
    expect(button.classList.contains("has-[>[data-inked=true]]:bg-transparent!")).toBe(true);
  });

  it("keeps the frame when rendered as another element", () => {
    render(
      <Button nativeButton={false} render={<a href="#read" />}>
        Read
      </Button>,
    );
    const link = screen.getByRole("button", { name: "Read" });
    expect(link.tagName).toBe("A");
    expect(frameOf(link)?.getAttribute("data-fill")).toBe("ink");
  });

  it("has no axe violations in its default demo", async () => {
    await expectNoA11yViolations(<ButtonDefaultDemo />);
  });
});
