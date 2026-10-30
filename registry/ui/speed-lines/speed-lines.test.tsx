import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { expectNoA11yViolations } from "@/lib/test/axe";
import SpeedLinesDefaultDemo from "./demos/default";
import { SpeedLines } from "./speed-lines";

afterEach(cleanup);

const linesOf = (container: HTMLElement) =>
  container.querySelector<HTMLElement>('[data-slot="speed-lines"]') as HTMLElement;

describe("SpeedLines", () => {
  it("renders an aria-hidden layer behind content with a forwarded className", () => {
    const lines = linesOf(render(<SpeedLines className="custom-class" />).container);
    expect(lines.getAttribute("aria-hidden")).toBe("true");
    for (const name of ["absolute", "inset-0", "-z-1", "pointer-events-none", "custom-class"]) {
      expect(lines.classList.contains(name), name).toBe(true);
    }
    expect(lines.childElementCount).toBe(0);
  });

  it("draws radial lines around the centre, 50 % by default", () => {
    const lines = linesOf(render(<SpeedLines />).container);
    expect(lines.dataset.direction).toBe("radial");
    expect(lines.className).toContain("repeating-conic-gradient");
    expect(lines.style.getPropertyValue("--speed-x")).toBe("50%");
    expect(lines.style.getPropertyValue("--speed-y")).toBe("50%");
  });

  it("moves the centre", () => {
    const lines = linesOf(render(<SpeedLines center={[20, 75]} />).container);
    expect(lines.style.getPropertyValue("--speed-x")).toBe("20%");
    expect(lines.style.getPropertyValue("--speed-y")).toBe("75%");
  });

  it.each([
    ["left", "to_left"],
    ["right", "to_right"],
  ] as const)("draws horizontal lines fading %s", (direction, fade) => {
    const lines = linesOf(render(<SpeedLines direction={direction} />).container);
    expect(lines.dataset.direction).toBe(direction);
    expect(lines.className).toContain("repeating-linear-gradient");
    expect(lines.className).toContain(`linear-gradient(${fade}`);
  });

  it.each([
    ["sparse", "[--speed-period:10deg]"],
    ["normal", "[--speed-period:6deg]"],
    ["dense", "[--speed-period:3.5deg]"],
  ] as const)("scales the period for %s density", (density, name) => {
    const lines = linesOf(render(<SpeedLines density={density} />).container);
    expect(lines.dataset.density).toBe(density);
    expect(lines.classList.contains(name)).toBe(true);
  });

  it.each([
    ["ink", "[--speed-color:var(--ink)]"],
    ["tone", "[--speed-color:var(--tone-3)]"],
  ] as const)("colours the lines %s", (color, name) => {
    const lines = linesOf(render(<SpeedLines color={color} />).container);
    expect(lines.classList.contains(name)).toBe(true);
  });

  it("has no axe violations in its default demo", async () => {
    await expectNoA11yViolations(<SpeedLinesDefaultDemo />);
  });
});
