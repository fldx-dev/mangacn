import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { expectDemosAccessible } from "@/lib/test/axe";
import { stubResizeObserver } from "@/lib/test/resize-observer";
import { CaptionBox } from "./caption-box";
import CaptionBoxDefaultDemo from "./demos/default";
import CaptionBoxInAPanelDemo from "./demos/in-a-panel";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const boxOf = (root: ParentNode) => root.querySelector<HTMLElement>('[data-slot="caption-box"]');
const frameOf = (box: HTMLElement) =>
  box.querySelector<HTMLElement>(':scope > [data-slot="ink-frame"]');

describe("CaptionBox", () => {
  it("renders real text in a div with data-slot and a forwarded className", () => {
    const { container } = render(
      <CaptionBox className="custom-class">Meanwhile, at the docks…</CaptionBox>,
    );
    const box = boxOf(container) as HTMLElement;
    expect(box.tagName).toBe("DIV");
    expect(box.classList.contains("custom-class")).toBe(true);
    expect(box.textContent).toBe("Meanwhile, at the docks…");
    expect(box.getAttribute("role")).toBeNull();
  });

  it("is a note named by aria-label when given one", () => {
    render(<CaptionBox aria-label="Narrator">Three days earlier.</CaptionBox>);
    const note = screen.getByRole("note", { name: "Narrator" });
    expect(note.dataset.slot).toBe("caption-box");
    expect(note.textContent).toBe("Three days earlier.");
  });

  it("keeps an explicit role", () => {
    render(
      <CaptionBox role="status" aria-label="Narrator">
        Later…
      </CaptionBox>,
    );
    expect(screen.getByRole("status", { name: "Narrator" })).toBeTruthy();
  });

  it("defaults to paper, the dialogue face and no corner, in the flow", () => {
    const { container } = render(<CaptionBox>Hi</CaptionBox>);
    const box = boxOf(container) as HTMLElement;
    expect(box.dataset.tone).toBe("paper");
    expect(box.dataset.font).toBe("dialogue");
    expect(box.dataset.corner).toBe("none");
    expect(box.classList.contains("font-dialogue")).toBe(true);
    expect(box.classList.contains("relative")).toBe(true);
    expect(box.classList.contains("absolute")).toBe(false);
  });

  it("draws a square, heavy InkFrame on paper instead of a CSS border", () => {
    const observers = stubResizeObserver();
    const { container } = render(<CaptionBox>Hi</CaptionBox>);
    const box = boxOf(container) as HTMLElement;
    for (const name of box.classList) expect(name, name).not.toMatch(/^(border|shadow|rounded)/);
    const frame = frameOf(box) as HTMLElement;
    expect(frame.dataset.fill).toBe("paper");
    expect(frame.dataset.shape).toBe("rect");
    expect(frame.className).toContain("[--outline-width:var(--outline-width-heavy)]");
    expect(frame.classList.contains("rounded-none")).toBe(true);
    observers.drawAll(240, 40);
    expect(frame.dataset.inked).toBe("true");
  });

  it("fills with the lightest tone for tone", () => {
    const { container } = render(<CaptionBox tone="tone">Hi</CaptionBox>);
    const box = boxOf(container) as HTMLElement;
    expect(box.dataset.tone).toBe("tone");
    const frame = frameOf(box) as HTMLElement;
    expect(frame.dataset.fill).toBe("tone");
    expect(frame.className).toContain("[--tone-2:var(--tone-1)]");
  });

  it("sets the body face for font body", () => {
    const { container } = render(<CaptionBox font="body">Hi</CaptionBox>);
    const box = boxOf(container) as HTMLElement;
    expect(box.dataset.font).toBe("body");
    expect(box.classList.contains("font-sans")).toBe(true);
    expect(box.classList.contains("font-dialogue")).toBe(false);
  });

  it.each([
    ["top-left", ["top-0", "left-0"]],
    ["top-right", ["top-0", "right-0"]],
    ["bottom-left", ["bottom-0", "left-0"]],
    ["bottom-right", ["bottom-0", "right-0"]],
  ] as const)("pins itself to the %s corner of its parent", (corner, edges) => {
    const { container } = render(<CaptionBox corner={corner}>Hi</CaptionBox>);
    const box = boxOf(container) as HTMLElement;
    expect(box.dataset.corner).toBe(corner);
    for (const name of ["absolute", "z-1", "max-w-[85%]", ...edges]) {
      expect(box.classList.contains(name), name).toBe(true);
    }
    expect(box.classList.contains("relative")).toBe(false);
  });

  it("sits in the corners of a panel in the in-a-panel demo", () => {
    const { container } = render(<CaptionBoxInAPanelDemo />);
    const panel = container.querySelector<HTMLElement>('[data-slot="panel"]') as HTMLElement;
    const corners = [...panel.querySelectorAll<HTMLElement>(':scope > [data-slot="caption-box"]')];
    expect(corners.map((box) => box.dataset.corner)).toEqual(["top-left", "bottom-right"]);
    expect(panel.querySelector('[data-slot="halftone-background"]')).not.toBeNull();
  });

  it("marks the Japanese sample in the default demo", () => {
    const { container } = render(<CaptionBoxDefaultDemo />);
    const ja = container.querySelector<HTMLElement>('[data-slot="caption-box"][lang="ja"]');
    expect(ja?.textContent).toBe("その頃、街の反対側では……");
  });

  expectDemosAccessible(import.meta.glob("./demos/*.tsx"));
});
