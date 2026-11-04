import { cleanup, render } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { expectNoA11yViolations } from "@/lib/test/axe";
import InkSplatterBehindSfxDemo from "./demos/behind-sfx";
import InkSplatterDefaultDemo from "./demos/default";
import InkSplatterKindsDemo from "./demos/kinds";
import { InkSplatter } from "./ink-splatter";

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
        for (const shape of ["curve", "ellipse"] as const) {
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

const splatterOf = (root: ParentNode) =>
  root.querySelector<SVGSVGElement>('[data-slot="ink-splatter"]');
const paths = (root: ParentNode) =>
  [...root.querySelectorAll("path")].map((path) => path.getAttribute("d"));

beforeEach(() => {
  calls.length = 0;
});

afterEach(cleanup);

describe("InkSplatter", () => {
  it("draws on the server render already, with the default pen", () => {
    const html = renderToString(<InkSplatter seed={3} />);
    expect(html).toContain('data-slot="ink-splatter"');
    expect(html).toContain("<path");
    expect(html).not.toContain("data-inked");
  });

  it("is decoration: aria-hidden, no role, no pointer events, its own inline-block box", () => {
    const splatter = splatterOf(render(<InkSplatter className="custom-class" />).container);
    expect(splatter?.getAttribute("aria-hidden")).toBe("true");
    expect(splatter?.getAttribute("role")).toBeNull();
    expect(splatter?.getAttribute("focusable")).toBe("false");
    expect(splatter?.dataset.inked).toBe("true");
    for (const name of ["custom-class", "inline-block", "pointer-events-none", "size-28"]) {
      expect(splatter?.classList.contains(name)).toBe(true);
    }
    // No positioning of its own: the consumer places it.
    expect(splatter?.getAttribute("class")).not.toMatch(/\b(absolute|fixed|relative)\b/);
  });

  it("defaults to an ink splat", () => {
    const splatter = splatterOf(render(<InkSplatter />).container);
    expect(splatter?.dataset).toMatchObject({ kind: "splat", size: "md", color: "ink" });
    expect(splatter?.classList.contains("text-ink")).toBe(true);
  });

  it("fills its blots in the current colour, with no outline", () => {
    const { container } = render(<InkSplatter seed={4} />);
    const all = [...container.querySelectorAll("path")];
    expect(all.length).toBeGreaterThan(5);
    for (const path of all) {
      expect(path.getAttribute("fill")).toBe("currentColor");
      expect(path.getAttribute("stroke")).toBeNull();
    }
    // One path per blot: rough.js draws only the fill.
    expect(all).toHaveLength(calls.length / 2);
  });

  it("rounds the path data, so the server render hydrates as it is", () => {
    const { container } = render(<InkSplatter kind="dots" seed={4} />);
    for (const d of paths(container)) {
      for (const number of d?.match(/-?[\d.]+/g) ?? []) {
        expect(number.split(".")[1]?.length ?? 0).toBeLessThanOrEqual(2);
      }
    }
  });

  it.each([
    ["splat", ["curve", "ellipse"]],
    ["drip", ["curve", "ellipse"]],
    ["dots", ["ellipse"]],
  ] as const)("draws a %s from %j", (kind, shapes) => {
    const splatter = splatterOf(render(<InkSplatter kind={kind} seed={2} />).container);
    expect(splatter?.dataset.kind).toBe(kind);
    expect([...new Set(calls.map((call) => call.shape))].sort()).toEqual([...shapes]);
  });

  it("draws a different shape for each kind", () => {
    const shapes = (["splat", "drip", "dots"] as const).map((kind) => {
      const result = paths(render(<InkSplatter kind={kind} seed={6} />).container);
      cleanup();
      return result.join(" ");
    });
    expect(new Set(shapes).size).toBe(3);
  });

  it.each([
    ["sm", "size-16"],
    ["md", "size-28"],
    ["lg", "size-40"],
  ] as const)("is %s in a %s box", (size, name) => {
    const splatter = splatterOf(render(<InkSplatter size={size} />).container);
    expect(splatter?.dataset.size).toBe(size);
    expect(splatter?.classList.contains(name)).toBe(true);
    expect(splatter?.getAttribute("viewBox")).toBe("0 0 100 100");
  });

  it.each([
    ["ink", "text-ink"],
    ["spot", "text-spot"],
  ] as const)("inks %s in %s", (color, name) => {
    const splatter = splatterOf(render(<InkSplatter color={color} />).container);
    expect(splatter?.dataset.color).toBe(color);
    expect(splatter?.classList.contains(name)).toBe(true);
  });

  it("hands rough.js one seed per blot, a solid fill and the clean pen", () => {
    render(<InkSplatter kind="splat" seed={9} />);
    // Drawn twice: on the first render with the default pen, again once the theme's is read.
    const pass = calls.slice(0, calls.length / 2);
    expect(pass.map(({ options }) => options.seed)).toEqual(pass.map((_, index) => 9 + index));
    for (const { options } of calls) {
      expect(options).toMatchObject({
        fill: "currentColor",
        fillStyle: "solid",
        fillShapeRoughnessGain: 0,
        stroke: "none",
        disableMultiStroke: true,
        preserveVertices: true,
        bowing: 0.8,
      });
    }
    // The body takes the theme's pen; small drops a calmer share of it, in proportion.
    const body = calls.find(({ shape }) => shape === "curve");
    expect(body?.options).toMatchObject({ roughness: 1.2, maxRandomnessOffset: 1.5 });
    for (const { shape, options } of calls) {
      if (shape !== "ellipse") continue;
      expect(options.roughness).toBeLessThan(1.2);
      expect((options.maxRandomnessOffset as number) / (options.roughness as number)).toBeCloseTo(
        1.5 / 1.2,
      );
    }
  });

  it("draws the same path commands for the same seed, and another splatter for another", () => {
    for (const kind of ["splat", "drip", "dots"] as const) {
      const first = paths(render(<InkSplatter kind={kind} seed={7} />).container);
      cleanup();
      const second = paths(render(<InkSplatter kind={kind} seed={7} />).container);
      cleanup();
      const other = paths(render(<InkSplatter kind={kind} seed={8} />).container);
      cleanup();
      expect(second).toEqual(first);
      expect(other).not.toEqual(first);
    }
  });

  it("gives two unseeded instances different shapes", () => {
    const { container } = render(
      <>
        <InkSplatter />
        <InkSplatter />
      </>,
    );
    const [a, b] = [...container.querySelectorAll('[data-slot="ink-splatter"]')].map((svg) =>
      [...svg.querySelectorAll("path")].map((path) => path.getAttribute("d")).join(" "),
    );
    expect(a).not.toEqual(b);
  });

  it.each([
    ["default", InkSplatterDefaultDemo],
    ["kinds", InkSplatterKindsDemo],
    ["behind-sfx", InkSplatterBehindSfxDemo],
  ])("has no axe violations in its %s demo", async (_name, Demo) => {
    await expectNoA11yViolations(<Demo />);
  });
});
