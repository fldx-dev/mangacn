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

  it("pulses a hatched tone-outlined frame, rect by default and ellipse on request", () => {
    render(<Skeleton data-testid="skeleton" />);
    const skeleton = screen.getByTestId("skeleton");
    expect(skeleton.classList.contains("animate-pulse")).toBe(true);
    expect(skeleton.className).not.toMatch(/bg-muted|bg-accent|halftone/);
    const frame = skeleton.querySelector('[data-slot="ink-frame"]');
    expect(frame?.getAttribute("data-fill")).toBe("hatch");
    expect(frame?.getAttribute("data-shape")).toBe("rect");
    expect(skeleton.getAttribute("data-shape")).toBe("rect");

    cleanup();
    render(<Skeleton data-testid="skeleton" shape="ellipse" />);
    const round = screen.getByTestId("skeleton");
    expect(round.classList.contains("rounded-full")).toBe(true);
    expect(round.querySelector('[data-slot="ink-frame"]')?.getAttribute("data-shape")).toBe(
      "ellipse",
    );
  });

  it("has no axe violations in its default demo", async () => {
    await expectNoA11yViolations(<SkeletonDefaultDemo />);
  });
});
