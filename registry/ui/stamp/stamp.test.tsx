import { act, cleanup, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { expectDemosAccessible } from "@/lib/test/axe";
import StampJapaneseDemo from "./demos/japanese";
import { Stamp } from "./stamp";

// Records the options handed to rough.js, with the real generator still doing the drawing.
const { calls } = vi.hoisted(() => ({
  calls: [] as { shape: string; args: unknown[]; options: Record<string, unknown> }[],
}));
vi.mock("roughjs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("roughjs")>();
  return {
    default: {
      ...actual.default,
      generator: (...args: Parameters<typeof actual.default.generator>) => {
        const generator = actual.default.generator(...args);
        for (const shape of ["ellipse", "rectangle"] as const) {
          const original = generator[shape].bind(generator) as (...a: unknown[]) => unknown;
          (generator as unknown as Record<string, unknown>)[shape] = (...a: unknown[]) => {
            calls.push({
              shape,
              args: a.slice(0, -1),
              options: { ...(a.at(-1) as Record<string, unknown>) },
            });
            return original(...a);
          };
        }
        return generator;
      },
    },
  };
});

const stampOf = (root: ParentNode) => root.querySelector<HTMLElement>('[data-slot="stamp"]');
const paths = (root: ParentNode) =>
  [...root.querySelectorAll("path")].map((path) => path.getAttribute("d"));

beforeEach(() => {
  calls.length = 0;
});

afterEach(cleanup);

describe("Stamp", () => {
  it("draws on the server render already, with the default pen", () => {
    const html = renderToString(<Stamp seed={3}>NEW</Stamp>);
    expect(html).toContain('data-slot="stamp"');
    expect(html).toContain("<path");
    expect(html).toContain("NEW");
    expect(html).not.toContain("data-inked");
  });

  it("is real text by default: no role, the word read as it is", () => {
    const { container } = render(<Stamp className="custom-class">完結</Stamp>);
    const stamp = stampOf(container);
    expect(stamp?.getAttribute("role")).toBeNull();
    expect(stamp?.getAttribute("aria-hidden")).toBeNull();
    expect(stamp?.className).toContain("custom-class");
    expect(stamp?.dataset.inked).toBe("true");
    expect(container.querySelector('[data-slot="stamp-text"]')?.textContent).toBe("完結");
    // The drawing and the grain are decoration.
    expect(container.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
    expect(container.querySelector('[data-slot="stamp-grain"]')?.getAttribute("aria-hidden")).toBe(
      "true",
    );
  });

  it("is an image named by aria-label when the author gives one", () => {
    render(
      <Stamp aria-label="Approved">
        <span lang="ja">承認</span>
      </Stamp>,
    );
    const stamp = screen.getByRole("img", { name: "Approved" });
    expect(stamp.dataset.slot).toBe("stamp");
    expect(stamp.textContent).toBe("承認");
  });

  it("defaults to a round, spot, medium seal tilted a few degrees at 90 % ink", () => {
    const stamp = stampOf(render(<Stamp>NEW</Stamp>).container);
    expect(stamp?.dataset).toMatchObject({ shape: "round", color: "spot", size: "md" });
    expect(stamp?.style.rotate).toBe("-8deg");
    expect(stamp?.classList.contains("text-spot")).toBe(true);
    expect(stamp?.classList.contains("opacity-90")).toBe(true);
    expect(stamp?.classList.contains("font-display")).toBe(true);
    expect(stamp?.classList.contains("size-20")).toBe(true);
  });

  it("takes a rotation and keeps the author's own style", () => {
    const stamp = stampOf(
      render(
        <Stamp rotate={12} style={{ top: 4 }}>
          OK
        </Stamp>,
      ).container,
    );
    expect(stamp?.style.rotate).toBe("12deg");
    expect(stamp?.style.top).toBe("4px");
  });

  it.each([
    ["sm", "size-14", 56],
    ["md", "size-20", 80],
    ["lg", "size-28", 112],
  ] as const)("draws a %s seal in a %s box", (size, name, box) => {
    const { container } = render(<Stamp size={size}>OK</Stamp>);
    expect(stampOf(container)?.classList.contains(name)).toBe(true);
    expect(container.querySelector("svg")?.getAttribute("viewBox")).toBe(`0 0 ${box} ${box}`);
  });

  it("draws a round seal as two rough ellipses and a square one as two rectangles", () => {
    render(<Stamp>OK</Stamp>);
    // Drawn twice: on the first render with the default pen, again once the theme's is read.
    expect(calls.map((call) => call.shape)).toEqual(["ellipse", "ellipse", "ellipse", "ellipse"]);
    // The inner ring is the smaller of the two, both centred in the 80 px box.
    const [outer, inner] = calls.map((call) => call.args as number[]);
    expect(outer.slice(0, 2)).toEqual([40, 40]);
    expect(inner.slice(0, 2)).toEqual([40, 40]);
    expect(inner[2]).toBeLessThan(outer[2]);
    calls.length = 0;
    cleanup();
    const { container } = render(<Stamp shape="square">OK</Stamp>);
    expect(new Set(calls.map((call) => call.shape))).toEqual(new Set(["rectangle"]));
    expect(stampOf(container)?.dataset.shape).toBe("square");
    expect(
      container.querySelector('[data-slot="stamp-grain"]')?.classList.contains("rounded-full"),
    ).toBe(false);
  });

  it("strokes the outline with the heavy pen and the ring with the thin one", () => {
    const { container } = render(<Stamp>OK</Stamp>);
    const classes = [...container.querySelectorAll("path")].map((path) =>
      path.getAttribute("class"),
    );
    expect(classes).toContain("[stroke-width:var(--outline-width-heavy)]");
    expect(classes).toContain("[stroke-width:var(--outline-width)]");
    for (const path of container.querySelectorAll("path")) {
      expect(path.getAttribute("stroke")).toBe("currentColor");
      expect(path.getAttribute("fill")).toBe("none");
    }
  });

  it("lays the theme's halftone over the face in its own colour, faint", () => {
    const grain = render(<Stamp>OK</Stamp>).container.querySelector('[data-slot="stamp-grain"]');
    expect(grain?.classList.contains("halftone")).toBe(true);
    expect(grain?.classList.contains("opacity-25")).toBe(true);
    expect(grain?.classList.contains("[--tone-4:currentColor]")).toBe(true);
    expect(grain?.classList.contains("rounded-full")).toBe(true);
  });

  it.each([
    ["spot", "text-spot"],
    ["ink", "text-ink"],
  ] as const)("inks %s in %s", (color, name) => {
    const stamp = stampOf(render(<Stamp color={color}>OK</Stamp>).container);
    expect(stamp?.dataset.color).toBe(color);
    expect(stamp?.classList.contains(name)).toBe(true);
  });

  it("hands rough.js the seed and the clean pen", () => {
    render(<Stamp seed={9}>OK</Stamp>);
    const seeds = calls.map(({ options }) => options.seed);
    // The outline takes the seed, the ring the next one (on both passes).
    expect(seeds).toEqual([9, 10, 9, 10]);
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
    const first = paths(render(<Stamp seed={7}>OK</Stamp>).container);
    cleanup();
    const second = paths(render(<Stamp seed={7}>OK</Stamp>).container);
    cleanup();
    const other = paths(render(<Stamp seed={8}>OK</Stamp>).container);
    expect(second).toEqual(first);
    expect(other).not.toEqual(first);
  });

  it("keeps the Japanese demo under lang=ja", () => {
    const { container } = render(<StampJapaneseDemo />);
    for (const stamp of container.querySelectorAll('[data-slot="stamp"]')) {
      expect(stamp.closest("[lang]")?.getAttribute("lang")).toBe("ja");
    }
  });

  describe("fitting the text inside the ring", () => {
    // jsdom has no layout: give the seal and its text the sizes Chromium measures for these
    // words in Dela Gothic One (registry/ui/stamp/demos/long-words.tsx).
    const layout = (seal: number, width: number, height: number) => {
      const size = (slot: string | undefined, sealSize: number, textSize: number) =>
        slot === "stamp" ? sealSize : slot === "stamp-text" ? textSize : 0;
      vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockImplementation(function (
        this: HTMLElement,
      ) {
        return size(this.dataset.slot, seal, width);
      });
      vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockImplementation(function (
        this: HTMLElement,
      ) {
        return size(this.dataset.slot, seal, height);
      });
    };
    const textOf = (root: ParentNode) =>
      root.querySelector<HTMLElement>('[data-slot="stamp-text"]') as HTMLElement;

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("renders at full size on the server, so hydration matches", () => {
      const html = renderToString(<Stamp size="lg">SUPER</Stamp>);
      expect(html).not.toContain("data-fit");
      expect(html).not.toContain("scale");
    });

    it("shrinks a word that overruns a round seal's ring to fit inside it", () => {
      layout(112, 108, 24);
      const { container } = render(<Stamp size="lg">SUPER</Stamp>);
      // Ring: 112 - 2 × 3 pad - 2 × 11.2 inset - 1.5 stroke - 2 × 1 gap = 80.1 px across; the
      // text box's diagonal (110.6 px) must fit in it.
      expect(stampOf(container)?.dataset.fit).toBe("0.72");
      expect(textOf(container).style.scale).toBe("0.72");
      expect(Math.hypot(108, 24) * 0.72).toBeLessThanOrEqual(80.1);
    });

    it("shrinks to the inner square's side on a square seal", () => {
      layout(112, 173, 24);
      const { container } = render(
        <Stamp size="lg" shape="square">
          APPROVED
        </Stamp>,
      );
      expect(stampOf(container)?.dataset.fit).toBe("0.46");
      expect(173 * 0.46).toBeLessThanOrEqual(80.1);
    });

    it("leaves text that already fits alone", () => {
      layout(80, 51, 18);
      const { container } = render(<Stamp>NEW</Stamp>);
      expect(stampOf(container)?.dataset.fit).toBeUndefined();
      expect(textOf(container).getAttribute("style")).toBeNull();
    });

    it("never resizes the seal itself, and keeps an overflowing word centred", () => {
      layout(112, 173, 24);
      const { container } = render(<Stamp size="lg">APPROVED</Stamp>);
      const stamp = stampOf(container) as HTMLElement;
      expect(stamp.classList.contains("size-28")).toBe(true);
      expect(stamp.style.width).toBe("");
      // One track the seal's size; the text never narrower than its longest word, centred.
      for (const name of ["grid-cols-1", "grid-rows-1"]) {
        expect(stamp.classList.contains(name), name).toBe(true);
      }
      for (const name of ["min-w-min", "max-w-[72%]", "[place-self:unsafe_center]"]) {
        expect(textOf(container).classList.contains(name), name).toBe(true);
      }
    });

    it("sets a vertical word in one upright column at a larger face, fitted to the ring", () => {
      // Two kanji at md's vertical text-2xl: one column 24 px wide, 48 px tall. Ring: 80 - 6 -
      // 16 - 1.5 - 2 = 54.5 px; the diagonal (53.7 px) fits, so the word is not shrunk.
      layout(80, 24, 48);
      const { container } = render(<Stamp vertical>完結</Stamp>);
      const text = textOf(container);
      expect(stampOf(container)?.dataset.vertical).toBe("true");
      for (const name of ["[writing-mode:vertical-rl]", "[text-orientation:upright]", "text-2xl"]) {
        expect(text.classList.contains(name), name).toBe(true);
      }
      expect(stampOf(container)?.dataset.fit).toBeUndefined();
      expect(text.textContent).toBe("完結");
      cleanup();
      // At sm the column (16 × 32 px) overruns the 35.3 px ring a little and is fitted.
      layout(56, 16, 32);
      const small = render(
        <Stamp vertical size="sm">
          最新
        </Stamp>,
      );
      expect(textOf(small.container).classList.contains("text-base")).toBe(true);
      expect(stampOf(small.container)?.dataset.fit).toBe("0.98");
      expect(Math.hypot(16, 32) * 0.98).toBeLessThanOrEqual(35.3);
    });

    it("keeps a word horizontal unless vertical is set", () => {
      layout(80, 36, 18);
      const { container } = render(<Stamp>完結</Stamp>);
      expect(stampOf(container)?.dataset.vertical).toBeUndefined();
      expect(textOf(container).className).not.toContain("writing-mode");
    });

    it("refits when the text or the seal resizes (a web font swapping in)", () => {
      const observed: Element[] = [];
      let notify = () => {};
      vi.stubGlobal(
        "ResizeObserver",
        class {
          constructor(callback: () => void) {
            notify = callback;
          }
          observe(element: Element) {
            observed.push(element);
          }
          disconnect() {}
        },
      );
      layout(112, 60, 24);
      const { container } = render(<Stamp size="lg">SUPER</Stamp>);
      expect(stampOf(container)?.dataset.fit).toBeUndefined();
      expect(observed).toEqual([textOf(container), stampOf(container)]);
      layout(112, 108, 24);
      act(() => notify());
      expect(stampOf(container)?.dataset.fit).toBe("0.72");
      vi.unstubAllGlobals();
    });
  });

  expectDemosAccessible(import.meta.glob("./demos/*.tsx"));
});
