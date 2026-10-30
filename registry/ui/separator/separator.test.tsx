import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { expectNoA11yViolations } from "@/lib/test/axe";
import { stubResizeObserver } from "@/lib/test/resize-observer";
import SeparatorDefaultDemo from "./demos/default";
import { Separator } from "./separator";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("Separator", () => {
  it("renders a horizontal separator with data-slot and a forwarded className", () => {
    render(<Separator className="custom-class" />);
    const separator = screen.getByRole("separator");
    expect(separator.getAttribute("data-slot")).toBe("separator");
    expect(separator.getAttribute("aria-orientation")).toBe("horizontal");
    expect(separator.classList.contains("custom-class")).toBe(true);
  });

  it("is an outline-width box holding one InkFrame line, in both orientations", () => {
    render(<Separator orientation="vertical" />);
    const separator = screen.getByRole("separator");
    expect(separator.getAttribute("aria-orientation")).toBe("vertical");
    for (const name of [
      "bg-border",
      "data-horizontal:h-(--outline-width)",
      "data-vertical:w-(--outline-width)",
      "has-[>[data-inked=true]]:bg-transparent!",
    ]) {
      expect(separator.classList.contains(name), name).toBe(true);
    }
    const frame = separator.querySelector(':scope > [data-slot="ink-frame"]');
    expect(frame?.getAttribute("data-shape")).toBe("line");
    expect(frame?.getAttribute("data-fill")).toBe("none");
  });

  it("draws a single rough stroke once measured", () => {
    const observers = stubResizeObserver();
    render(<Separator />);
    observers.drawAll(240, 1.5);
    const separator = screen.getByRole("separator");
    expect(separator.querySelectorAll("path")).toHaveLength(1);
    expect(separator.querySelector<HTMLElement>("[data-inked]")?.dataset.inked).toBe("true");
  });

  it("has no axe violations in its default demo", async () => {
    await expectNoA11yViolations(<SeparatorDefaultDemo />);
  });
});
