import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { expectNoA11yViolations } from "@/lib/test/axe";
import SfxTextDefaultDemo from "./demos/default";
import { SfxText } from "./sfx-text";

// motion reads `prefers-reduced-motion` through matchMedia, which jsdom lacks.
function stubReducedMotion(reduce: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: reduce && query.includes("reduce"),
    media: query,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
  }));
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const sfxOf = (container: HTMLElement) => container.firstElementChild as HTMLElement;

describe("SfxText", () => {
  it("renders the word as plain text with data-slot and a forwarded className", () => {
    const { container } = render(<SfxText className="custom-class">Dokan!</SfxText>);
    const sfx = sfxOf(container);
    expect(sfx.tagName).toBe("SPAN");
    expect(sfx.dataset.slot).toBe("sfx-text");
    expect(sfx.textContent).toBe("Dokan!");
    expect(screen.getByText("Dokan!")).toBe(sfx);
    for (const name of ["custom-class", "font-display", "[paint-order:stroke_fill]"]) {
      expect(sfx.classList.contains(name), name).toBe(true);
    }
  });

  it("strokes with -webkit-text-stroke unless stroke is false", () => {
    const stroked = sfxOf(render(<SfxText>Don</SfxText>).container);
    expect(stroked.className).toContain("[-webkit-text-stroke:");
    cleanup();
    const plain = sfxOf(render(<SfxText stroke={false}>Don</SfxText>).container);
    expect(plain.className).not.toContain("[-webkit-text-stroke:");
  });

  it.each([
    ["paper", "text-paper"],
    ["ink", "text-ink"],
    ["spot", "text-spot"],
  ] as const)("maps color %s to %s", (color, name) => {
    const sfx = sfxOf(render(<SfxText color={color}>Don</SfxText>).container);
    expect(sfx.dataset.color).toBe(color);
    expect(sfx.classList.contains(name)).toBe(true);
  });

  it.each([
    ["sm", "text-2xl"],
    ["md", "text-4xl"],
    ["lg", "text-5xl"],
    ["xl", "text-6xl"],
  ] as const)("maps size %s to %s", (size, name) => {
    const sfx = sfxOf(render(<SfxText size={size}>Don</SfxText>).container);
    expect(sfx.dataset.size).toBe(size);
    expect(sfx.classList.contains(name)).toBe(true);
  });

  it("tilts by rotate degrees, -6 by default", () => {
    expect(sfxOf(render(<SfxText>Don</SfxText>).container).style.rotate).toBe("-6deg");
    cleanup();
    expect(sfxOf(render(<SfxText rotate={12}>Don</SfxText>).container).style.rotate).toBe("12deg");
  });

  it("renders no motion wrapper without an entrance", () => {
    const sfx = sfxOf(render(<SfxText>Don</SfxText>).container);
    expect(sfx.dataset.enter).toBe("none");
    expect(sfx.children).toHaveLength(0);
  });

  it.each(["pop", "slam"] as const)("keeps the plain word inside a %s entrance", (enter) => {
    stubReducedMotion(false);
    const sfx = sfxOf(render(<SfxText enter={enter}>Don!</SfxText>).container);
    expect(sfx.dataset.enter).toBe(enter);
    expect(sfx.textContent).toBe("Don!");
    expect(screen.getByText("Don!").tagName).toBe("SPAN");
  });

  it("shows the word at rest under reduced motion", async () => {
    stubReducedMotion(true);
    const sfx = sfxOf(render(<SfxText enter="slam">Don!</SfxText>).container);
    const inner = sfx.firstElementChild as HTMLElement;
    await vi.waitFor(() => expect(inner.style.opacity).toBe("1"));
    expect(sfx.textContent).toBe("Don!");
  });

  it("has no axe violations in its default demo", async () => {
    stubReducedMotion(true);
    await expectNoA11yViolations(<SfxTextDefaultDemo />);
  });
});
