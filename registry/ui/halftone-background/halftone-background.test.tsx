import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { expectNoA11yViolations } from "@/lib/test/axe";
import HalftoneBackgroundDefaultDemo from "./demos/default";
import { HalftoneBackground } from "./halftone-background";

afterEach(cleanup);

const layerOf = (container: HTMLElement) =>
  container.querySelector<HTMLElement>('[data-slot="halftone-background"]') as HTMLElement;

describe("HalftoneBackground", () => {
  it("renders an aria-hidden layer behind content with a forwarded className", () => {
    const layer = layerOf(render(<HalftoneBackground className="custom-class" />).container);
    expect(layer.getAttribute("aria-hidden")).toBe("true");
    for (const name of ["absolute", "inset-0", "-z-1", "pointer-events-none", "custom-class"]) {
      expect(layer.classList.contains(name), name).toBe(true);
    }
  });

  it.each([
    ["light", "halftone-light"],
    ["mid", "halftone"],
    ["dark", "halftone-dark"],
  ] as const)("uses the theme's %s halftone", (tone, utility) => {
    const layer = layerOf(render(<HalftoneBackground tone={tone} />).container);
    expect(layer.dataset.tone).toBe(tone);
    expect(layer.firstElementChild?.classList.contains(utility)).toBe(true);
  });

  it("defaults to the mid tone at 1.5× the theme screen, no fade", () => {
    const layer = layerOf(render(<HalftoneBackground />).container);
    expect(layer.dataset.tone).toBe("mid");
    expect(layer.dataset.fade).toBe("none");
    expect(layer.className).toContain("[--halftone-bg-size:calc(var(--halftone-size)*1.5)]");
    expect(layer.className).not.toContain("mask-image");
  });

  it.each([
    ["top", "linear-gradient(to_bottom"],
    ["bottom", "linear-gradient(to_top"],
    ["radial", "radial-gradient("],
  ] as const)("fades %s with a mask", (fade, gradient) => {
    const layer = layerOf(render(<HalftoneBackground fade={fade} />).container);
    expect(layer.dataset.fade).toBe(fade);
    expect(layer.className).toContain(`[mask-image:${gradient}`);
  });

  it("scales dots and cells together without a custom-property cycle", () => {
    const layer = layerOf(render(<HalftoneBackground size="lg" />).container);
    expect(layer.className).toContain("[--halftone-bg-size:calc(var(--halftone-size)*2.5)]");
    expect(layer.className).toContain("[--halftone-bg-dot:calc(var(--halftone-dot)*2.5)]");
    const dots = layer.firstElementChild as HTMLElement;
    expect(dots.className).toContain("[--halftone-size:var(--halftone-bg-size)]");
  });

  it("has no axe violations in its default demo", async () => {
    await expectNoA11yViolations(<HalftoneBackgroundDefaultDemo />);
  });
});
