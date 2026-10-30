import { cleanup, render } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { expectNoA11yViolations } from "@/lib/test/axe";
import { stubResizeObserver } from "@/lib/test/resize-observer";
import InkFrameDefaultDemo from "./demos/default";
import { InkFrame } from "./ink-frame";

// Records the options handed to rough.js, with the real renderer still doing the drawing.
const { pathOptions, rectangleOptions } = vi.hoisted(() => ({
  pathOptions: [] as Record<string, unknown>[],
  rectangleOptions: [] as Record<string, unknown>[],
}));
vi.mock("roughjs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("roughjs")>();
  return {
    default: {
      ...actual.default,
      svg: (...args: Parameters<typeof actual.default.svg>) => {
        const rc = actual.default.svg(...args);
        const path = rc.path.bind(rc);
        const rectangle = rc.rectangle.bind(rc);
        rc.path = (d, options) => {
          pathOptions.push({ ...options });
          return path(d, options);
        };
        rc.rectangle = (x, y, w, h, options) => {
          rectangleOptions.push({ ...options });
          return rectangle(x, y, w, h, options);
        };
        return rc;
      },
    },
  };
});

let observers: ReturnType<typeof stubResizeObserver>;

function fireAll(width?: number, height?: number) {
  observers.drawAll(width, height);
}

const paths = (root: ParentNode) =>
  [...root.querySelectorAll("path")].map((path) => path.getAttribute("d"));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("InkFrame on the server", () => {
  it("renders the CSS fallback outline and no drawing", () => {
    const html = renderToString(<InkFrame fill="ink">Read now</InkFrame>);
    expect(html).toContain('data-slot="ink-frame"');
    expect(html).toContain("ink-border");
    expect(html).toContain("bg-ink");
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain("<path");
    expect(html).not.toContain("data-inked");
  });
});

describe("InkFrame in the browser", () => {
  beforeEach(() => {
    observers = stubResizeObserver();
  });

  it("draws rough.js paths once the box is measured and marks itself inked", () => {
    const { container } = render(<InkFrame className="px-3">Read now</InkFrame>);
    const frame = container.querySelector<HTMLElement>('[data-slot="ink-frame"]');
    expect(frame?.querySelector("path")).toBeNull();
    expect(frame?.dataset.inked).toBeUndefined();

    fireAll();
    expect(frame?.querySelectorAll("path").length).toBeGreaterThan(0);
    expect(frame?.dataset.inked).toBe("true");
    expect(frame?.className).toContain("px-3");
    expect(frame?.className).toContain("data-[inked=true]:border-transparent");
  });

  it("keeps colours as CSS variables and draws one 1.5 px stroke in --ink", () => {
    const { container } = render(<InkFrame fill="ink">Ink</InkFrame>);
    fireAll();
    const drawn = [...container.querySelectorAll<SVGPathElement>("path")];
    const outline = drawn.filter((path) => path.style.stroke === "var(--ink)");
    const filled = drawn.filter((path) => path.style.fill === "var(--ink)");
    expect(outline).toHaveLength(1);
    expect(outline[0].getAttribute("stroke-width")).toBe("1.5");
    expect(filled).toHaveLength(1);
    expect(container.querySelector("[stroke^='var(']")).toBeNull();
  });

  it("draws nothing extra for fill none, no shadow by default, and a hatch shadow on request", () => {
    const plain = render(<InkFrame fill="none">x</InkFrame>);
    fireAll();
    expect(plain.container.querySelectorAll("path")).toHaveLength(1);
    cleanup();
    observers.reset();

    const hatched = render(<InkFrame shadow="hatch">x</InkFrame>);
    fireAll();
    const groups = hatched.container.querySelectorAll("svg > g");
    expect(groups).toHaveLength(2);
    // The shadow is drawn first, so it sits under the paper fill.
    expect(groups[0].querySelector("path")?.style.stroke).toBe("var(--ink)");
  });

  it("draws a single line along the long side for shape line", () => {
    const { container } = render(<InkFrame shape="line" />);
    fireAll(200, 2);
    expect(container.querySelectorAll("path")).toHaveLength(1);
    const frame = container.querySelector('[data-slot="ink-frame"]');
    expect(frame?.className).toContain("bg-ink");
    expect(frame?.className).not.toContain("ink-border");
  });

  it("draws the same wobble for the same seed", () => {
    const first = render(<InkFrame seed={7}>a</InkFrame>);
    fireAll();
    const before = paths(first.container);
    cleanup();
    observers.reset();

    const second = render(<InkFrame seed={7}>a</InkFrame>);
    fireAll();
    expect(paths(second.container)).toEqual(before);

    cleanup();
    observers.reset();
    const other = render(<InkFrame seed={8}>a</InkFrame>);
    fireAll();
    expect(paths(other.container)).not.toEqual(before);
  });

  it("keeps its wobble across re-renders", () => {
    const { container, rerender } = render(<InkFrame>a</InkFrame>);
    fireAll();
    const before = paths(container);
    rerender(<InkFrame>b</InkFrame>);
    fireAll();
    expect(paths(container)).toEqual(before);
  });

  it("draws a custom outline path in box pixels, shifted into the padding", () => {
    const outline = vi.fn((w: number, h: number) => `M 0 0 L ${w} 0 L ${w / 2} ${h + 12} Z`);
    const { container } = render(<InkFrame outline={outline} shadow="solid" />);
    fireAll(100, 40);
    expect(outline).toHaveBeenCalledWith(100, 40);
    const groups = container.querySelectorAll("svg > g");
    // Shadow first, offset by --shadow-offset (4) plus half the stroke; then the outline.
    expect(groups).toHaveLength(2);
    expect(groups[0].getAttribute("transform")).toBe("translate(12.75 12.75)");
    expect(groups[1].getAttribute("transform")).toBe("translate(8 8)");
    const filled = [...groups[1].querySelectorAll("path")].filter(
      (path) => path.style.fill === "var(--paper)",
    );
    expect(filled).toHaveLength(1);
  });

  it("dashes the stroke on request and only then", () => {
    const dashedStroke = (dashed: boolean) => {
      const { container } = render(<InkFrame shape="ellipse" dashed={dashed} />);
      fireAll();
      const stroke = [...container.querySelectorAll("path")].find(
        (path) => path.style.stroke === "var(--ink)",
      );
      cleanup();
      observers.reset();
      return stroke?.getAttribute("stroke-dasharray") ?? null;
    };
    expect(dashedStroke(true)).toBe("6 4.5");
    expect(dashedStroke(false)).toBeNull();
  });

  it("measures the fractional border box, maps it edge to edge and stamps the size", () => {
    const { container } = render(<InkFrame shape="line" />);
    fireAll(320, 1.5);
    const frame = container.querySelector<HTMLElement>('[data-slot="ink-frame"]');
    const svg = frame?.querySelector("svg");
    // 8 px of padding on each side; no rounding of the 1.5 px height.
    expect(svg?.getAttribute("viewBox")).toBe("0 0 336 17.5");
    expect(svg?.getAttribute("preserveAspectRatio")).toBe("none");
    expect(frame?.dataset.inkSize).toBe("320x1.5");
    // The stroke runs the full width: from the padding edge to the padding edge.
    expect(svg?.querySelector("path")?.getAttribute("d")).toMatch(/^M8 8\.75 .* 328 8\.75$/);
  });

  it("draws ellipses as two closed arcs and calms small ones", () => {
    const { container } = render(<InkFrame shape="ellipse" seed={3} />);
    fireAll(64, 64);
    const group = container.querySelector("svg > g");
    expect(group?.getAttribute("transform")).toBe("translate(8 8)");
    expect(pathOptions.at(-1)).toMatchObject({ roughness: 1.2, maxRandomnessOffset: 1.5 });

    cleanup();
    observers.reset();
    render(<InkFrame shape="ellipse" seed={3} fill="none" />);
    fireAll(16, 16);
    // Half the pen for a 16 px dot; the floor, so an 8 px dot gets the same.
    expect(pathOptions.at(-1)).toMatchObject({ roughness: 0.6, maxRandomnessOffset: 0.75 });

    cleanup();
    observers.reset();
    render(<InkFrame seed={3} />);
    fireAll(16, 16);
    // Rectangles keep the full pen (checkboxes read fine at 16 px).
    expect(rectangleOptions.at(-1)).toMatchObject({ roughness: 1.2, maxRandomnessOffset: 1.5 });
  });

  it("renders the element given by as and forwards attributes", () => {
    const { container } = render(
      <InkFrame as="section" aria-label="Panel" id="p1">
        a
      </InkFrame>,
    );
    const frame = container.querySelector("section");
    expect(frame?.getAttribute("data-slot")).toBe("ink-frame");
    expect(frame?.getAttribute("aria-label")).toBe("Panel");
    expect(frame?.id).toBe("p1");
  });

  it("has no axe violations in its default demo", async () => {
    await expectNoA11yViolations(<InkFrameDefaultDemo />);
  });
});

describe("InkFrame without ResizeObserver", () => {
  it("keeps the CSS fallback", () => {
    vi.stubGlobal("ResizeObserver", undefined);
    const { container } = render(<InkFrame>a</InkFrame>);
    const frame = container.querySelector<HTMLElement>('[data-slot="ink-frame"]');
    expect(frame?.querySelector("path")).toBeNull();
    expect(frame?.dataset.inked).toBeUndefined();
    expect(frame?.className).toContain("ink-border");
  });
});
