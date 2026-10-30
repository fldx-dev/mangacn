import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { expectNoA11yViolations } from "@/lib/test/axe";
import EmanataDefaultDemo from "./demos/default";
import { Emanata } from "./emanata";

afterEach(cleanup);

describe("Emanata", () => {
  it.each([
    ["sweat", "Sweat drop"],
    ["anger", "Anger mark"],
    ["sparkle", "Sparkle"],
    ["surprise", "Surprise lines"],
    ["puff", "Puff"],
  ] as const)("draws %s as a labelled inline SVG", (kind, label) => {
    render(<Emanata kind={kind} />);
    const mark = screen.getByRole("img", { name: label });
    expect(mark.tagName.toLowerCase()).toBe("svg");
    expect(mark.dataset.slot).toBe("emanata");
    expect(mark.dataset.kind).toBe(kind);
    expect(mark.querySelector("path")).not.toBeNull();
    expect(mark.querySelector("image, use, foreignObject")).toBeNull();
  });

  it("takes its label from aria-label when given", () => {
    render(<Emanata kind="anger" aria-label="Furious" />);
    expect(screen.getByRole("img", { name: "Furious" }).dataset.kind).toBe("anger");
  });

  it("hides decorative marks from assistive tech", () => {
    const { container } = render(<Emanata kind="sparkle" decorative />);
    const mark = container.querySelector('[data-slot="emanata"]');
    expect(mark?.getAttribute("aria-hidden")).toBe("true");
    expect(mark?.getAttribute("role")).toBeNull();
    expect(mark?.getAttribute("aria-label")).toBeNull();
  });

  it("maps size and color and forwards className", () => {
    render(<Emanata kind="sweat" size="lg" color="spot" className="custom-class" />);
    const mark = screen.getByRole("img");
    for (const name of ["size-12", "text-spot", "custom-class"]) {
      expect(mark.classList.contains(name), name).toBe(true);
    }
  });

  it("strokes at the heavy outline width, unscaled", () => {
    render(<Emanata kind="anger" />);
    const mark = screen.getByRole("img");
    expect(mark.getAttribute("class")).toContain("[&_*]:[stroke-width:var(--outline-width-heavy)]");
    expect(mark.getAttribute("class")).toContain("[&_*]:[vector-effect:non-scaling-stroke]");
  });

  it("has no axe violations in its default demo", async () => {
    await expectNoA11yViolations(<EmanataDefaultDemo />);
  });
});
