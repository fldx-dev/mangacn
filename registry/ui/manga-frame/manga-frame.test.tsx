import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { expectNoA11yViolations } from "@/lib/test/axe";
import MangaFrameDefaultDemo from "./demos/default";
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

  it("has no axe violations in its default demo", async () => {
    await expectNoA11yViolations(<MangaFrameDefaultDemo />);
  });
});
