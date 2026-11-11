import { readFileSync } from "node:fs";
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { expectDemosAccessible } from "@/lib/test/axe";
import { CHART_TONE_IDS, CHART_TONES, ChartTones, chartToneFill } from "./chart-tones";

afterEach(cleanup);

const source = readFileSync("registry/ui/chart-tones/chart-tones.tsx", "utf8");

const patterns = (container: Element) => [...container.querySelectorAll("pattern")];

describe("ChartTones", () => {
  it("exports stable ids, one per tone", () => {
    expect(CHART_TONE_IDS).toEqual({
      dots1: "tone-dots-1",
      dots2: "tone-dots-2",
      dots3: "tone-dots-3",
      dots4: "tone-dots-4",
      hatch: "tone-hatch",
      crossHatch: "tone-cross-hatch",
    });
    expect(chartToneFill("dots2")).toBe("url(#tone-dots-2)");
    expect(chartToneFill("hatch", "spot-")).toBe("url(#spot-tone-hatch)");
  });

  it("defines one pattern per tone under those ids, the same on every render", () => {
    const first = render(<ChartTones />).container;
    const ids = patterns(first).map((pattern) => pattern.id);
    expect(ids).toEqual(CHART_TONES.map((tone) => CHART_TONE_IDS[tone]));
    cleanup();
    expect(patterns(render(<ChartTones />).container).map((p) => p.id)).toEqual(ids);
  });

  it("prefixes every id for a second set", () => {
    const { container } = render(<ChartTones prefix="spot-" className="text-spot" />);
    expect(patterns(container).map((pattern) => pattern.id)).toEqual(
      CHART_TONES.map((tone) => `spot-${CHART_TONE_IDS[tone]}`),
    );
    expect(container.querySelector("svg")?.getAttribute("class")).toBe("text-spot");
  });

  it("draws in currentColor only", () => {
    const { container } = render(<ChartTones />);
    const painted = container.querySelectorAll("pattern [fill], pattern [stroke]");
    expect(painted.length).toBeGreaterThan(0);
    for (const node of painted) {
      const paint = node.getAttribute("fill") ?? node.getAttribute("stroke");
      expect(paint).toBe("currentColor");
    }
  });

  it("gets denser from dots1 to dots4", () => {
    const { container } = render(<ChartTones />);
    const coverage = ["dots1", "dots2", "dots3", "dots4"].map((tone) => {
      const pattern = container.querySelector(`pattern[data-tone="${tone}"]`) as Element;
      const cell = Number(pattern.getAttribute("width"));
      const dots = [...pattern.querySelectorAll("circle")];
      const ink = dots.reduce((sum, dot) => sum + Math.PI * Number(dot.getAttribute("r")) ** 2, 0);
      return ink / cell ** 2;
    });
    for (let i = 1; i < coverage.length; i++) expect(coverage[i]).toBeGreaterThan(coverage[i - 1]);
  });

  it("hatches at 45°, one set of lines and two", () => {
    const { container } = render(<ChartTones />);
    const hatch = container.querySelector('pattern[data-tone="hatch"]');
    const cross = container.querySelector('pattern[data-tone="crossHatch"]');
    expect(hatch?.getAttribute("patternTransform")).toBe("rotate(45)");
    expect(hatch?.querySelectorAll("line")).toHaveLength(1);
    expect(cross?.querySelectorAll("line")).toHaveLength(2);
  });

  it("is hidden, takes no space and stays displayed", () => {
    const { container } = render(<ChartTones />);
    const svg = container.querySelector("svg") as SVGSVGElement;
    expect(svg.getAttribute("aria-hidden")).toBe("true");
    expect(svg.dataset.slot).toBe("chart-tones");
    expect(svg.getAttribute("width")).toBe("0");
    expect(svg.style.position).toBe("absolute");
    expect(svg.style.display).not.toBe("none");
  });

  it("is a server component with no imports beyond React's types", () => {
    expect(source).not.toMatch(/^["']use client["']/m);
    expect(source.match(/^import .*$/gm)).toEqual(['import type * as React from "react";']);
  });

  expectDemosAccessible(import.meta.glob("./demos/*.tsx"));
});
