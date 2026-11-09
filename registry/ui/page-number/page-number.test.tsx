import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { expectDemosAccessible } from "@/lib/test/axe";
import PageNumberInAPageDemo from "./demos/in-a-page";
import PageNumberWithChapterDemo from "./demos/with-chapter";
import { PageNumber } from "./page-number";

afterEach(cleanup);

const folioOf = (root: ParentNode) => root.querySelector<HTMLElement>('[data-slot="page-number"]');
/** What a screen reader reads: the text outside `aria-hidden` subtrees. */
function spoken(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
  if (node instanceof Element && node.getAttribute("aria-hidden") === "true") return "";
  return [...node.childNodes].map(spoken).join("");
}

describe("PageNumber", () => {
  it("prints the page and the count as real text, read as words", () => {
    const { container } = render(<PageNumber page={7} of={24} />);
    const folio = folioOf(container) as HTMLElement;
    expect(folio.tagName).toBe("SPAN");
    const page = folio.querySelector('[data-slot="page-number-page"]') as HTMLElement;
    const shown = page.querySelector('[aria-hidden="true"]');
    expect(shown?.textContent).toBe("7 / 24");
    expect(spoken(folio)).toBe("Page 7 of 24");
    expect(screen.getByText("Page 7 of 24").classList.contains("sr-only")).toBe(true);
  });

  it("reads just the page without a count", () => {
    const { container } = render(<PageNumber page={7} />);
    const folio = folioOf(container) as HTMLElement;
    expect(spoken(folio)).toBe("Page 7");
    expect(folio.querySelector('[aria-hidden="true"]')?.textContent).toBe("7");
    expect(folio.querySelector('[data-slot="page-number-of"]')).toBeNull();
  });

  it("sits on the right by default, in the display face", () => {
    const { container } = render(<PageNumber page={7} />);
    const folio = folioOf(container) as HTMLElement;
    expect(folio.dataset.side).toBe("right");
    for (const name of ["font-display", "items-end", "text-right"]) {
      expect(folio.classList.contains(name), name).toBe(true);
    }
  });

  it("hugs the left edge for side left", () => {
    const { container } = render(<PageNumber page={6} side="left" />);
    const folio = folioOf(container) as HTMLElement;
    expect(folio.dataset.side).toBe("left");
    expect(folio.classList.contains("items-start")).toBe(true);
    expect(folio.classList.contains("text-left")).toBe(true);
    expect(folio.classList.contains("items-end")).toBe(false);
  });

  it("puts the chapter mark above the number, read first", () => {
    const { container } = render(<PageNumber page={7} of={24} chapter="Ch. 12" />);
    const folio = folioOf(container) as HTMLElement;
    const [first, second] = [...folio.children] as HTMLElement[];
    expect(first?.dataset.slot).toBe("page-number-chapter");
    expect(first?.textContent).toBe("Ch. 12");
    expect(second?.dataset.slot).toBe("page-number-page");
    expect(spoken(folio)).toBe("Ch. 12 Page 7 of 24");
    expect(folio.classList.contains("flex-col")).toBe(true);
  });

  it("forwards className and props, so the consumer can place it", () => {
    const { container } = render(
      <PageNumber page={3} className="absolute right-4 bottom-3" id="folio" />,
    );
    const folio = folioOf(container) as HTMLElement;
    expect(folio.id).toBe("folio");
    expect(folio.classList.contains("absolute")).toBe(true);
    expect(folio.classList.contains("bottom-3")).toBe(true);
  });

  it("pins the folio in the panel's corner with a Japanese chapter mark in the in-a-page demo", () => {
    const { container } = render(<PageNumberInAPageDemo />);
    const panel = container.querySelector<HTMLElement>('[data-slot="panel"]') as HTMLElement;
    const folio = panel.querySelector<HTMLElement>(':scope > [data-slot="page-number"]');
    expect(folio?.classList.contains("absolute")).toBe(true);
    const chapter = folio?.querySelector('[data-slot="page-number-chapter"] [lang="ja"]');
    expect(chapter?.textContent).toBe("第12話");
  });

  it("shows both sides of a spread in the with-chapter demo", () => {
    const { container } = render(<PageNumberWithChapterDemo />);
    const sides = [...container.querySelectorAll<HTMLElement>('[data-slot="page-number"]')].map(
      (folio) => folio.dataset.side,
    );
    expect(sides).toEqual(["left", "right"]);
  });

  expectDemosAccessible(import.meta.glob("./demos/*.tsx"));
});
