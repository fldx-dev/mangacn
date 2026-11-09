import { cleanup, render } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import { expectDemosAccessible } from "@/lib/test/axe";
import { FocusLines } from "./focus-lines";

afterEach(cleanup);

const layerOf = (container: HTMLElement) =>
  container.querySelector<HTMLElement>('[data-slot="focus-lines"]') as HTMLElement;
const svgOf = (container: HTMLElement) =>
  container.querySelector<SVGSVGElement>('[data-slot="focus-lines-svg"]') as SVGSVGElement;

describe("FocusLines", () => {
  it("renders an aria-hidden layer behind content with a forwarded className", () => {
    const { container } = render(<FocusLines className="custom-class" />);
    const layer = layerOf(container);
    expect(layer.tagName).toBe("SPAN");
    expect(layer.getAttribute("aria-hidden")).toBe("true");
    for (const name of ["absolute", "inset-0", "-z-1", "custom-class", "text-ink"]) {
      expect(layer.classList.contains(name), name).toBe(true);
    }
    const svg = svgOf(container);
    expect(svg.parentElement).toBe(layer);
    expect(svg.classList.contains("size-full")).toBe(true);
  });

  // Lines start past the box edge; a panel host does not clip, so the layer must (Task 66).
  it("clips the lines to its own box, whatever inset it is given", () => {
    const { container } = render(<FocusLines className="inset-(--outline-width-heavy)" />);
    const layer = layerOf(container);
    expect(layer.classList.contains("overflow-hidden")).toBe(true);
    expect(layer.classList.contains("inset-(--outline-width-heavy)")).toBe(true);
    expect(layer.classList.contains("inset-0")).toBe(false);
    // The layer is a plain box (no `size-full`), so an inset sizes it instead of shifting it.
    expect(layer.classList.contains("size-full")).toBe(false);
    expect(svgOf(container).classList.contains("overflow-hidden")).toBe(true);
  });

  it("draws count lines in currentColor at --speed-line-width", () => {
    const svg = svgOf(render(<FocusLines count={24} />).container);
    expect(svg.querySelectorAll("line")).toHaveLength(24);
    const group = svg.querySelector("g");
    expect(group?.getAttribute("stroke")).toBe("currentColor");
    expect(group?.style.strokeWidth).toBe("var(--speed-line-width)");
    expect(svg.querySelector("line")?.getAttribute("vector-effect")).toBe("non-scaling-stroke");
  });

  it("runs every line off the box and towards the centre", () => {
    const svg = svgOf(render(<FocusLines count={32} center={[30, 60]} />).container);
    for (const line of svg.querySelectorAll("line")) {
      const [x1, y1, x2, y2] = ["x1", "y1", "x2", "y2"].map((a) => Number(line.getAttribute(a)));
      const outside = x1 < 0 || x1 > 100 || y1 < 0 || y1 > 100;
      expect(outside).toBe(true);
      expect(Math.hypot(x2 - 30, y2 - 60)).toBeLessThan(Math.hypot(x1 - 30, y1 - 60));
    }
  });

  it("reaches further in for long lines", () => {
    const reach = (length: "short" | "long") => {
      const svg = svgOf(render(<FocusLines length={length} count={16} />).container);
      const inner = [...svg.querySelectorAll("line")].map((line) =>
        Math.hypot(Number(line.getAttribute("x2")) - 50, Number(line.getAttribute("y2")) - 50),
      );
      cleanup();
      return inner.reduce((a, b) => a + b, 0) / inner.length;
    };
    expect(reach("long")).toBeLessThan(reach("short"));
  });

  it("draws the same burst on the server and the client", () => {
    const server = renderToString(<FocusLines count={12} />);
    const client = svgOf(render(<FocusLines count={12} />).container).outerHTML;
    const lines = (html: string) => html.match(/<line[^>]*>/g)?.map((l) => l.replace(/\s+/g, " "));
    expect(lines(server)?.map((l) => l.match(/x1="[^"]+"/)?.[0])).toEqual(
      lines(client)?.map((l) => l.match(/x1="[^"]+"/)?.[0]),
    );
  });

  it("colours the lines with tone", () => {
    const layer = layerOf(render(<FocusLines color="tone" />).container);
    expect(layer.classList.contains("text-tone-3")).toBe(true);
  });

  expectDemosAccessible(import.meta.glob("./demos/*.tsx"));
});
