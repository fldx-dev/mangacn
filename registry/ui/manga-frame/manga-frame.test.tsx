import { readFileSync } from "node:fs";
import path from "node:path";
import { cleanup, render, screen } from "@testing-library/react";
import type * as React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { expectDemosAccessible } from "@/lib/test/axe";
import { MangaFrame } from "./manga-frame";

afterEach(cleanup);

const src = "data:image/gif;base64,R0lGODlhAQABAAAAACw=";

describe("MangaFrame", () => {
  it("renders a figure with the image, its alt and a forwarded className", () => {
    const { container } = render(
      <MangaFrame src={src} alt="A rooftop" className="custom-class" loading="lazy" />,
    );
    const figure = container.firstElementChild as HTMLElement;
    expect(figure.tagName).toBe("FIGURE");
    expect(figure.dataset.slot).toBe("manga-frame");
    expect(figure.classList.contains("custom-class")).toBe(true);
    const image = screen.getByRole("img", { name: "A rooftop" });
    expect(image.getAttribute("src")).toBe(src);
    expect(image.getAttribute("loading")).toBe("lazy");
    expect(image.classList.contains("custom-class")).toBe(false);
  });

  it("requires alt at the type level", () => {
    // @ts-expect-error alt is required
    const { container } = render(<MangaFrame src={src} />);
    expect(container.querySelector("img")).not.toBeNull();
  });

  it.each([
    ["4/3", "aspect-4/3"],
    ["3/4", "aspect-3/4"],
    ["1/1", "aspect-square"],
    ["16/9", "aspect-video"],
  ] as const)("maps aspect %s to %s", (aspect, name) => {
    const { container } = render(<MangaFrame src={src} alt="x" aspect={aspect} />);
    expect((container.firstElementChild as HTMLElement).dataset.aspect).toBe(aspect);
    expect(screen.getByRole("img").classList.contains(name)).toBe(true);
  });

  it("draws a heavy ink frame over the picture, without a CSS border", () => {
    const { container } = render(<MangaFrame src={src} alt="x" />);
    const frames = container.querySelectorAll<HTMLElement>('[data-slot="ink-frame"]');
    expect(frames).toHaveLength(1);
    expect(frames[0].dataset.fill).toBe("none");
    expect(frames[0].className).toContain("z-1");
    expect(frames[0].className).toContain("[--outline-width:var(--outline-width-heavy)]");
  });

  it("adds a halftone mat and an inner frame with matte", () => {
    const { container } = render(<MangaFrame src={src} alt="x" matte />);
    expect((container.firstElementChild as HTMLElement).dataset.matte).toBe("true");
    expect(container.querySelector(".halftone-light")).not.toBeNull();
    expect(container.querySelectorAll('[data-slot="ink-frame"]')).toHaveLength(2);
  });

  it("renders the caption as a figcaption", () => {
    render(<MangaFrame src={src} alt="x" caption="Page one" />);
    const caption = screen.getByText("Page one");
    expect(caption.tagName).toBe("FIGCAPTION");
    expect(caption.dataset.slot).toBe("manga-frame-caption");
  });

  it("renders children as a lettered scene in place of a picture", () => {
    const { container } = render(
      <MangaFrame aspect="16/9" caption="Title page" id="scene-1">
        <p className="font-display">Rooftop</p>
      </MangaFrame>,
    );
    const figure = container.firstElementChild as HTMLElement;
    expect(figure.dataset.content).toBe("scene");
    expect(container.querySelector("img")).toBeNull();
    const scene = container.querySelector<HTMLElement>('[data-slot="manga-frame-scene"]');
    expect(scene).not.toBeNull();
    expect(scene?.id).toBe("scene-1");
    expect(screen.getByText("Rooftop").parentElement).toBe(scene);
    // A box of the same aspect for backgrounds such as speed-lines, clipped to the frame.
    for (const name of ["aspect-video", "relative", "isolate", "overflow-hidden", "bg-paper"]) {
      expect(scene?.classList.contains(name), name).toBe(true);
    }
  });

  it("frames a scene exactly as it frames a picture", () => {
    const frames = (node: React.ReactElement) => {
      const { container } = render(node);
      const result = [...container.querySelectorAll<HTMLElement>('[data-slot="ink-frame"]')].map(
        (frame) => frame.className,
      );
      cleanup();
      return result;
    };
    expect(frames(<MangaFrame matte>Scene</MangaFrame>)).toEqual(
      frames(<MangaFrame matte src={src} alt="x" />),
    );
  });

  it("takes a picture or a scene, not both, at the type level", () => {
    // @ts-expect-error a scene takes no src
    render(<MangaFrame src={src}>Scene</MangaFrame>);
    // @ts-expect-error a frame needs a picture or a scene
    render(<MangaFrame />);
    expect(true).toBe(true);
  });

  it("silences Next's no-img-element lint on the plain <img>, with the reason", () => {
    const source = readFileSync(path.join(__dirname, "manga-frame.tsx"), "utf8");
    const line = source.split("\n").find((text) => text.trimStart().startsWith("<img"));
    expect(line).toMatch(/eslint-disable-line @next\/next\/no-img-element -- \S/);
  });

  expectDemosAccessible(import.meta.glob("./demos/*.tsx"));
});
