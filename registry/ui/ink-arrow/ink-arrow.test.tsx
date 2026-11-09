import { cleanup, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { expectDemosAccessible } from "@/lib/test/axe";
import { InkArrow } from "./ink-arrow";

// Records the options handed to rough.js, with the real generator still doing the drawing.
const { calls } = vi.hoisted(() => ({
  calls: [] as { shape: string; options: Record<string, unknown> }[],
}));
vi.mock("roughjs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("roughjs")>();
  return {
    default: {
      ...actual.default,
      generator: (...args: Parameters<typeof actual.default.generator>) => {
        const generator = actual.default.generator(...args);
        for (const shape of ["line", "path", "linearPath"] as const) {
          const original = generator[shape].bind(generator) as (...a: unknown[]) => unknown;
          (generator as unknown as Record<string, unknown>)[shape] = (...a: unknown[]) => {
            calls.push({ shape, options: { ...(a.at(-1) as Record<string, unknown>) } });
            return original(...a);
          };
        }
        return generator;
      },
    },
  };
});

const arrowOf = (root: ParentNode) => root.querySelector<HTMLElement>('[data-slot="ink-arrow"]');
const paths = (root: ParentNode) =>
  [...root.querySelectorAll("path")].map((path) => path.getAttribute("d"));
const sizeOf = (root: ParentNode) => {
  const svg = root.querySelector<SVGSVGElement>("svg");
  return [Number.parseFloat(svg?.style.width ?? ""), Number.parseFloat(svg?.style.height ?? "")];
};

beforeEach(() => {
  calls.length = 0;
});

afterEach(cleanup);

describe("InkArrow", () => {
  it("draws on the server render already, with the default pen", () => {
    const html = renderToString(<InkArrow seed={3} />);
    expect(html).toContain('data-slot="ink-arrow"');
    expect(html).toContain("<path");
    expect(html).not.toContain("data-inked");
  });

  it("is decoration without a label: aria-hidden, no role", () => {
    const { container } = render(<InkArrow className="custom-class" />);
    const arrow = arrowOf(container);
    expect(arrow?.getAttribute("aria-hidden")).toBe("true");
    expect(arrow?.getAttribute("role")).toBeNull();
    expect(arrow?.className).toContain("custom-class");
    expect(arrow?.dataset.inked).toBe("true");
    expect(container.querySelector('[data-slot="ink-arrow-label"]')).toBeNull();
    // A shaft and a head, stroked with the current colour at the heavy pen width.
    expect(paths(container)).toHaveLength(2);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("class")).toContain(
      "[&_path]:[stroke-width:var(--outline-width-heavy)]",
    );
    expect(svg?.querySelector("path")?.getAttribute("stroke")).toBe("currentColor");
  });

  it("is an image named by its label, the label shown as real text", () => {
    render(<InkArrow label="Start here" />);
    const arrow = screen.getByRole("img", { name: "Start here" });
    expect(arrow.dataset.slot).toBe("ink-arrow");
    expect(arrow.getAttribute("aria-hidden")).toBeNull();
    expect(arrow.querySelector('[data-slot="ink-arrow-label"]')?.textContent).toBe("Start here");
  });

  it.each([
    ["right", "flex-row-reverse"],
    ["left", "flex-row"],
    ["down", "flex-col-reverse"],
    ["up", "flex-col"],
  ] as const)("points %s with the label at its tail (%s)", (direction, layout) => {
    const arrow = arrowOf(render(<InkArrow direction={direction} label="Here" />).container);
    expect(arrow?.dataset.direction).toBe(direction);
    expect(arrow?.classList.contains(layout)).toBe(true);
  });

  it("is wide when it points sideways and tall when it points up or down", () => {
    const [rightW, rightH] = sizeOf(render(<InkArrow direction="right" />).container);
    cleanup();
    const [downW, downH] = sizeOf(render(<InkArrow direction="down" />).container);
    expect(rightW).toBeGreaterThan(rightH);
    expect(downH).toBeGreaterThan(downW);
    expect([downW, downH]).toEqual([rightH, rightW]);
  });

  it.each([
    ["sm", 40],
    ["md", 72],
    ["lg", 112],
  ] as const)("draws a %s shaft %i px long", (length, shaft) => {
    const arrow = arrowOf(render(<InkArrow length={length} />).container);
    expect(arrow?.dataset.length).toBe(length);
    // The drawing is the shaft plus 6 px of room on each side.
    expect(sizeOf(arrow as HTMLElement)[0]).toBe(shaft + 12);
  });

  it("draws a straight shaft as a line and a bowed one as a path", () => {
    render(<InkArrow />);
    expect(calls.map((call) => call.shape)).toContain("line");
    calls.length = 0;
    cleanup();
    const bowed = render(<InkArrow curve="left" />).container;
    expect(calls.map((call) => call.shape)).toContain("path");
    expect(calls.map((call) => call.shape)).not.toContain("line");
    expect(arrowOf(bowed)?.dataset.curve).toBe("left");
  });

  it("bows to opposite sides for left and right", () => {
    const left = paths(render(<InkArrow curve="left" seed={4} />).container);
    cleanup();
    const right = paths(render(<InkArrow curve="right" seed={4} />).container);
    expect(left).not.toEqual(right);
  });

  it.each([
    ["ink", "text-ink"],
    ["spot", "text-spot"],
  ] as const)("strokes %s in %s", (color, name) => {
    const { container } = render(<InkArrow color={color} />);
    expect(arrowOf(container)?.dataset.color).toBe(color);
    expect(container.querySelector("svg")?.classList.contains(name)).toBe(true);
  });

  it("hands rough.js the seed and the clean pen", () => {
    render(<InkArrow seed={9} />);
    const seeds = calls.map(({ options }) => options.seed);
    expect(seeds).toContain(9);
    expect(seeds).toContain(10);
    for (const { options } of calls) {
      expect(options).toMatchObject({
        disableMultiStroke: true,
        preserveVertices: true,
        roughness: 1.2,
        bowing: 0.8,
        maxRandomnessOffset: 1.5,
      });
    }
  });

  it("draws the same path commands for the same seed", () => {
    const first = paths(render(<InkArrow curve="right" seed={7} />).container);
    cleanup();
    const second = paths(render(<InkArrow curve="right" seed={7} />).container);
    cleanup();
    const other = paths(render(<InkArrow curve="right" seed={8} />).container);
    expect(second).toEqual(first);
    expect(other).not.toEqual(first);
  });

  expectDemosAccessible(import.meta.glob("./demos/*.tsx"));
});
