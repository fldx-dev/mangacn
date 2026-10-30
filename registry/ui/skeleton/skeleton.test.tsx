import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { expectNoA11yViolations } from "@/lib/test/axe";
import SkeletonDefaultDemo from "./demos/default";
import { Skeleton } from "./skeleton";

afterEach(cleanup);

describe("Skeleton", () => {
  it("renders a div with data-slot and a forwarded className", () => {
    render(<Skeleton data-testid="skeleton" className="h-4 w-24" />);
    const skeleton = screen.getByTestId("skeleton");
    expect(skeleton.getAttribute("data-slot")).toBe("skeleton");
    expect(skeleton.classList.contains("w-24")).toBe(true);
  });

  it("pulses a light halftone with no fill and no outline", () => {
    render(<Skeleton data-testid="skeleton" />);
    const skeleton = screen.getByTestId("skeleton");
    for (const name of ["halftone-light", "animate-pulse"]) {
      expect(skeleton.classList.contains(name), name).toBe(true);
    }
    expect(skeleton.className).not.toMatch(/bg-muted|bg-accent|border/);
    expect(skeleton.querySelector('[data-slot="ink-frame"]')).toBeNull();
  });

  it("has no axe violations in its default demo", async () => {
    await expectNoA11yViolations(<SkeletonDefaultDemo />);
  });
});
