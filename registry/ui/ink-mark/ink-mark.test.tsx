import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { expectNoA11yViolations } from "@/lib/test/axe";
import InkMarkDefaultDemo from "./demos/default";
import InkMarkJapaneseDemo from "./demos/japanese";
import InkMarkKindsDemo from "./demos/kinds";
import InkMarkRevealDemo from "./demos/reveal";
import InkMarkWrappedDemo from "./demos/wrapped";
import { InkMark } from "./ink-mark";

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
        for (const shape of ["line", "rectangle", "ellipse", "linearPath"] as const) {
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

/** Line boxes jsdom cannot lay out: what a wrapped phrase reports in a browser. */
const TWO_LINES = [
  { left: 40, top: 10, right: 300, bottom: 34, width: 260, height: 24 },
  { left: 16, top: 38, right: 180, bottom: 62, width: 164, height: 24 },
];

function layOut(rects: typeof TWO_LINES) {
  vi.spyOn(HTMLElement.prototype, "getClientRects").mockImplementation(function (
    this: HTMLElement,
  ) {
    return (this.dataset.slot === "ink-mark" ? rects : []) as unknown as DOMRectList;
  });
  placeDrawings();
}

/**
 * jsdom ignores `left` / `top` in an element's rect; a browser reports the drawing where it was
 * placed (here: in a containing block at the viewport origin), which the measuring relies on.
 */
function placeDrawings() {
  vi.spyOn(SVGElement.prototype, "getBoundingClientRect").mockImplementation(function (
    this: SVGElement,
  ) {
    const left = Number.parseFloat(this.style.left) || 0;
    const top = Number.parseFloat(this.style.top) || 0;
    return { left, top, x: left, y: top, right: left, bottom: top, width: 0, height: 0 } as DOMRect;
  });
}

const markOf = (root: ParentNode) => root.querySelector<HTMLElement>('[data-slot="ink-mark"]');
const paths = (root: ParentNode) =>
  [...root.querySelectorAll("path")].map((path) => path.getAttribute("d"));

beforeEach(() => {
  calls.length = 0;
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("InkMark on the server", () => {
  it("renders the text and an empty drawing, not inked", () => {
    const html = renderToString(<InkMark kind="circle">cliffhanger</InkMark>);
    expect(html).toContain('data-slot="ink-mark"');
    expect(html).toContain("cliffhanger");
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain("<path");
    expect(html).not.toContain("data-inked");
  });
});

describe("InkMark", () => {
  it("keeps the children as plain text with no role, the drawing hidden", () => {
    layOut(TWO_LINES.slice(0, 1));
    const { container } = render(
      <p>
        A <InkMark className="custom-class">cliffhanger</InkMark> again.
      </p>,
    );
    const mark = markOf(container);
    expect(mark?.tagName).toBe("SPAN");
    expect(mark?.getAttribute("role")).toBeNull();
    expect(mark?.className).toContain("custom-class");
    expect(screen.getByText("cliffhanger")).toBe(mark);
    expect(container.querySelector("p")?.textContent).toBe("A cliffhanger again.");
    const svg = mark?.querySelector("svg");
    expect(svg?.getAttribute("aria-hidden")).toBe("true");
    expect(svg?.getAttribute("focusable")).toBe("false");
    expect(svg?.querySelector("text, foreignObject, image")).toBeNull();
  });

  it("draws once the line boxes are measured and stamps what it measured", () => {
    layOut(TWO_LINES);
    const { container } = render(<InkMark>a phrase that wraps</InkMark>);
    const mark = markOf(container);
    expect(mark?.dataset.inked).toBe("true");
    expect(mark?.dataset.inkSize).toBe("284x52");
    expect(mark?.dataset.inkLines).toBe("2");
    expect(mark?.dataset.kind).toBe("underline");
    expect(mark?.dataset.color).toBe("ink");
  });

  it("draws one mark per line box of wrapped text", () => {
    layOut(TWO_LINES);
    const { container } = render(<InkMark>a phrase that wraps</InkMark>);
    const lines = container.querySelectorAll('[data-slot="ink-mark-line"]');
    expect(lines).toHaveLength(2);
    for (const line of lines) expect(line.querySelectorAll("path")).toHaveLength(1);
    expect(calls.filter(({ shape }) => shape === "line")).toHaveLength(2);
  });

  it("covers the line boxes and nothing else, without touching the text's layout", () => {
    layOut(TWO_LINES);
    const { container } = render(
      <p>
        Before <InkMark kind="box">a phrase that wraps</InkMark> after.
      </p>,
    );
    const mark = markOf(container);
    // No inline style and no box-model class on the span: only the anchor for the drawing.
    expect(mark?.getAttribute("style")).toBeNull();
    expect(mark?.className).toBe("relative isolate");
    // The only element child is the out-of-flow drawing, sized to the union of the line boxes
    // (16,10 to 300,62) relative to where it sits.
    const children = [...(mark?.children ?? [])];
    expect(children.map((child) => child.tagName.toLowerCase())).toEqual(["svg"]);
    const svg = children[0] as SVGSVGElement;
    expect(svg.style.position).toBe("absolute");
    expect(svg.style.pointerEvents).toBe("none");
    expect([svg.style.left, svg.style.top, svg.style.width, svg.style.height]).toEqual([
      "16px",
      "10px",
      "284px",
      "52px",
    ]);
    expect(svg.getAttribute("viewBox")).toBe("0 0 284 52");
  });

  it.each([
    ["underline", "line"],
    ["strike", "line"],
    ["highlight", "line"],
    ["box", "rectangle"],
    ["circle", "ellipse"],
  ] as const)("draws %s with rough.js %s, once per line", (kind, shape) => {
    layOut(TWO_LINES);
    render(<InkMark kind={kind}>a phrase that wraps</InkMark>);
    expect(calls.map((call) => call.shape)).toEqual([shape, shape]);
  });

  it("brackets the start of the first line and the end of the last", () => {
    layOut(TWO_LINES);
    const { container } = render(<InkMark kind="bracket">a phrase that wraps</InkMark>);
    expect(calls.map((call) => call.shape)).toEqual(["linearPath", "linearPath"]);
    const lines = container.querySelectorAll('[data-slot="ink-mark-line"]');
    expect(lines[0].querySelectorAll("path").length).toBeGreaterThan(0);
    expect(lines[1].querySelectorAll("path").length).toBeGreaterThan(0);
  });

  it("hands rough.js the seed, the clean pen and the theme's pen numbers", () => {
    layOut(TWO_LINES);
    render(<InkMark seed={7}>a phrase that wraps</InkMark>);
    expect(calls.map(({ options }) => options.seed)).toEqual([7, 8]);
    for (const { options } of calls) {
      expect(options).toMatchObject({
        disableMultiStroke: true,
        preserveVertices: true,
        strokeWidth: 1.5,
        roughness: 1.2,
        bowing: 0.8,
        maxRandomnessOffset: 1.5,
      });
    }
  });

  it("draws the same path commands for the same seed", () => {
    layOut(TWO_LINES);
    const first = paths(render(<InkMark seed={7}>a phrase</InkMark>).container);
    cleanup();
    const second = paths(render(<InkMark seed={7}>a phrase</InkMark>).container);
    cleanup();
    const other = paths(render(<InkMark seed={8}>a phrase</InkMark>).container);
    expect(first.length).toBeGreaterThan(0);
    expect(second).toEqual(first);
    expect(other).not.toEqual(first);
  });

  it.each([
    ["ink", "underline", "text-ink"],
    ["spot", "underline", "text-spot"],
    ["tone", "underline", "text-tone-3"],
    ["ink", "highlight", "text-tone-2"],
    ["spot", "highlight", "text-spot/30"],
    ["tone", "highlight", "text-tone-1"],
  ] as const)("strokes %s %s in %s", (color, kind, name) => {
    layOut(TWO_LINES);
    const { container } = render(
      <InkMark kind={kind} color={color}>
        word
      </InkMark>,
    );
    const svg = container.querySelector("svg");
    expect(svg?.classList.contains(name)).toBe(true);
    expect(svg?.querySelector("path")?.getAttribute("stroke")).toBe("currentColor");
  });

  it("puts a highlight behind the glyphs and every other mark over them", () => {
    layOut(TWO_LINES);
    const highlight = render(<InkMark kind="highlight">word</InkMark>).container;
    expect(highlight.querySelector("svg")?.style.zIndex).toBe("-1");
    cleanup();
    const underline = render(<InkMark>word</InkMark>).container;
    expect(underline.querySelector("svg")?.style.zIndex).toBe("");
  });

  it("strokes a highlight as wide as the line is tall", () => {
    layOut(TWO_LINES);
    const { container } = render(<InkMark kind="highlight">word</InkMark>);
    const widths = [...container.querySelectorAll("path")].map((path) =>
      path.getAttribute("stroke-width"),
    );
    expect(widths).toEqual([String(24 * 0.9), String(24 * 0.9)]);
  });

  it("redraws when the block the text flows in resizes", () => {
    const callbacks: ResizeObserverCallback[] = [];
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(callback: ResizeObserverCallback) {
          callbacks.push(callback);
        }
        observe() {}
        disconnect() {}
      },
    );
    try {
      layOut(TWO_LINES);
      const { container } = render(
        <div>
          <InkMark>a phrase that wraps</InkMark>
        </div>,
      );
      expect(markOf(container)?.dataset.inkLines).toBe("2");
      layOut(TWO_LINES.slice(0, 1));
      act(() => {
        for (const callback of callbacks) callback([], {} as ResizeObserver);
      });
      expect(markOf(container)?.dataset.inkLines).toBe("1");
      expect(container.querySelectorAll('[data-slot="ink-mark-line"]')).toHaveLength(1);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("hides the strokes while show is false", () => {
    layOut(TWO_LINES);
    const { container } = render(<InkMark show={false}>word</InkMark>);
    const mark = markOf(container);
    expect(mark?.dataset.show).toBe("false");
    // Measured (so the visual suite can wait on it) but not visible.
    expect(mark?.dataset.inked).toBe("true");
    for (const path of container.querySelectorAll("path")) {
      expect(path.style.opacity).toBe("0");
    }
  });

  it("draws the stroke on when show turns on (ink-mark.reduced-motion.test.tsx: at once)", async () => {
    layOut(TWO_LINES.slice(0, 1));
    const { container } = render(<InkMarkRevealDemo />);
    const toggle = screen.getByRole("switch", { name: "Mark the answer" });
    const strokes = () => [...container.querySelectorAll<SVGPathElement>("path")];
    const frame = () => act(() => new Promise((resolve) => requestAnimationFrame(resolve)));
    fireEvent.click(toggle);
    await frame();
    for (const path of strokes()) expect(path.style.opacity).toBe("0");

    fireEvent.click(toggle);
    await frame();
    await frame();
    // A frame in, the first stroke is showing but has not reached its end.
    const [first] = strokes();
    expect(first.style.opacity).toBe("1");
    // motion draws `pathLength` as the dash length (out of 1), the offset staying 0.
    const drawn = Number.parseFloat(first.getAttribute("stroke-dasharray") ?? "1");
    expect(drawn).toBeGreaterThanOrEqual(0);
    expect(drawn).toBeLessThan(1);
  });

  it.each([
    ["default", InkMarkDefaultDemo],
    ["kinds", InkMarkKindsDemo],
    ["wrapped", InkMarkWrappedDemo],
    ["reveal", InkMarkRevealDemo],
    ["japanese", InkMarkJapaneseDemo],
  ])("has no axe violations in its %s demo", async (_name, Demo) => {
    layOut(TWO_LINES);
    await expectNoA11yViolations(<Demo />);
  });

  it("sets the Japanese demo under lang=ja", () => {
    const { container } = render(<InkMarkJapaneseDemo />);
    expect(container.querySelector('[lang="ja"] [data-slot="ink-mark"]')).not.toBeNull();
  });
});
