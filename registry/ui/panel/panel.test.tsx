import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { expectDemosAccessible } from "@/lib/test/axe";
import { stubResizeObserver } from "@/lib/test/resize-observer";
import { CaptionBox } from "@/registry/ui/caption-box/caption-box";
import { Panel } from "./panel";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const frameOf = (element: HTMLElement) =>
  element.querySelector<HTMLElement>(':scope > [data-slot="ink-frame"]');

describe("Panel", () => {
  it("renders a section with data-slot and a forwarded className", () => {
    const { container } = render(<Panel className="custom-class">Hi</Panel>);
    const panel = container.firstElementChild as HTMLElement;
    expect(panel.tagName).toBe("SECTION");
    expect(panel.dataset.slot).toBe("panel");
    expect(panel.classList.contains("custom-class")).toBe(true);
    expect(panel.textContent).toBe("Hi");
  });

  it("renders the element given by as", () => {
    render(
      <Panel as="article" aria-label="Opening">
        Hi
      </Panel>,
    );
    expect(screen.getByRole("article", { name: "Opening" }).dataset.slot).toBe("panel");
  });

  it("draws a heavy InkFrame on paper instead of a CSS border", () => {
    const observers = stubResizeObserver();
    const { container } = render(<Panel>Hi</Panel>);
    const panel = container.firstElementChild as HTMLElement;
    for (const name of panel.classList) expect(name, name).not.toMatch(/^border|shadow/);
    const frame = frameOf(panel);
    expect(frame?.dataset.fill).toBe("paper");
    expect(frame?.className).toContain("[--outline-width:var(--outline-width-heavy)]");
    observers.drawAll(240, 160);
    expect(frame?.dataset.inked).toBe("true");
    expect(frame?.querySelectorAll("svg > g")).toHaveLength(1);
  });

  it.each([
    ["halftone", "halftone"],
    ["lines", "screentone-lines"],
    ["cross", "screentone-cross"],
  ] as const)("lays the %s tone over the paper", (tone, utility) => {
    const { container } = render(<Panel tone={tone}>Hi</Panel>);
    const panel = container.firstElementChild as HTMLElement;
    expect(panel.dataset.tone).toBe(tone);
    const layer = panel.querySelector('[data-slot="panel-tone"]');
    expect(layer?.classList.contains(utility)).toBe(true);
    expect(layer?.getAttribute("aria-hidden")).toBe("true");
  });

  it("hides the tone layer by default", () => {
    const { container } = render(<Panel>Hi</Panel>);
    expect(container.querySelector('[data-slot="panel-tone"]')?.classList).toContain("hidden");
  });

  it("adds a hatched shadow only when asked", () => {
    const observers = stubResizeObserver();
    const { container } = render(<Panel shadow>Hi</Panel>);
    const panel = container.firstElementChild as HTMLElement;
    expect(panel.dataset.shadow).toBe("true");
    observers.drawAll(240, 160);
    expect(frameOf(panel)?.querySelectorAll("svg > g")).toHaveLength(2);
  });

  it.each([
    ["top-left", ["top-0", "left-0"], "pt-(--panel-caption-room)"],
    ["top-right", ["top-0", "right-0"], "pt-(--panel-caption-room)"],
    ["bottom-left", ["bottom-0", "left-0"], "pb-(--panel-caption-room)"],
    ["bottom-right", ["bottom-0", "right-0"], "pb-(--panel-caption-room)"],
  ] as const)(
    "puts the caption %s as text and keeps room for it on that side",
    (side, corner, room) => {
      const { container } = render(
        <Panel caption="Later that night" captionSide={side}>
          Hi
        </Panel>,
      );
      const caption = screen.getByText("Later that night");
      expect(caption.dataset.slot).toBe("panel-caption");
      expect(caption.dataset.side).toBe(side);
      for (const name of ["absolute", ...corner]) {
        expect(caption.classList.contains(name), name).toBe(true);
      }
      const panel = container.firstElementChild as HTMLElement;
      expect(panel.classList.contains(room)).toBe(true);
      // One line of `text-sm` at `leading-snug`, the box's `py-1.5` and the panel's `gap-3`.
      expect(panel.className).toContain(
        "[--panel-caption-room:calc(var(--text-sm)*var(--leading-snug)+--spacing(6))]",
      );
    },
  );

  it("keeps no room without a caption, and lets the author's padding win", () => {
    const bare = render(<Panel>Hi</Panel>).container.firstElementChild as HTMLElement;
    expect(bare.className).not.toContain("panel-caption-room");
    cleanup();
    const padded = render(
      <Panel caption="Later" className="pt-14">
        Hi
      </Panel>,
    ).container.firstElementChild as HTMLElement;
    expect(padded.classList.contains("pt-14")).toBe(true);
    expect(padded.classList.contains("pt-(--panel-caption-room)")).toBe(false);
  });

  // The dogfood run found the two mechanisms in two faces side by side (Task 66).
  it.each([
    ["top-left", undefined],
    ["bottom-right", "body"],
  ] as const)(
    "draws the %s caption as caption-box draws its corner box (%s face)",
    (side, font) => {
      const classes = (element: Element) => [...element.classList].sort();
      const panel = render(
        <Panel caption="Later" captionSide={side} captionFont={font}>
          Hi
        </Panel>,
      ).container;
      const box = render(
        <CaptionBox corner={side} font={font}>
          Later
        </CaptionBox>,
      ).container;
      const caption = panel.querySelector('[data-slot="panel-caption"]') as HTMLElement;
      const captionBox = box.querySelector('[data-slot="caption-box"]') as HTMLElement;
      expect(caption.dataset.font).toBe(font ?? "dialogue");
      expect(caption.dataset.font).toBe(captionBox.dataset.font);
      expect(classes(caption)).toEqual(classes(captionBox));
      const [frame, boxFrame] = [caption, captionBox].map(
        (element) => element.querySelector(':scope > [data-slot="ink-frame"]') as HTMLElement,
      );
      expect(frame.dataset.fill).toBe(boxFrame.dataset.fill);
      expect(classes(frame)).toEqual(classes(boxFrame));
    },
  );

  expectDemosAccessible(import.meta.glob("./demos/*.tsx"));
});
