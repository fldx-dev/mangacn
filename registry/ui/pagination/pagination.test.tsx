import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { expectDemosAccessible } from "@/lib/test/axe";
import { stubResizeObserver } from "@/lib/test/resize-observer";
import PaginationDefaultDemo from "./demos/default";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "./pagination";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const frameOf = (element: HTMLElement) =>
  element.querySelector<HTMLElement>(':scope > [data-slot="ink-frame"]');

describe("Pagination", () => {
  it("keeps every stock part, data-slot and forwarded className", () => {
    render(
      <Pagination className="c-nav">
        <PaginationContent className="c-content">
          <PaginationItem className="c-item">
            <PaginationLink href="#1" className="c-link">
              1
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationEllipsis className="c-ellipsis" />
          </PaginationItem>
        </PaginationContent>
      </Pagination>,
    );
    const nav = screen.getByRole("navigation", { name: "pagination" });
    expect(nav.getAttribute("data-slot")).toBe("pagination");
    expect(nav.classList.contains("c-nav")).toBe(true);
    for (const [slot, name] of [
      ["pagination-content", "c-content"],
      ["pagination-item", "c-item"],
      ["pagination-link", "c-link"],
      ["pagination-ellipsis", "c-ellipsis"],
    ]) {
      const part = nav.querySelector(`[data-slot="${slot}"]`);
      expect(part, slot).not.toBeNull();
      expect(part?.classList.contains(name), slot).toBe(true);
    }
  });

  it("draws pages as outlined buttons and the current page in ink", () => {
    render(
      <>
        <PaginationLink href="#5">5</PaginationLink>
        <PaginationLink href="#6" isActive>
          6
        </PaginationLink>
      </>,
    );
    const page = screen.getByRole("link", { name: "5" });
    const current = screen.getByRole("link", { name: "6" });
    expect(page.tagName).toBe("A");
    expect(page.getAttribute("href")).toBe("#5");
    expect(page.getAttribute("aria-current")).toBeNull();
    expect(frameOf(page)?.dataset.fill).toBe("paper");
    expect(page.classList.contains("size-8")).toBe(true);
    expect(current.getAttribute("aria-current")).toBe("page");
    expect(current.getAttribute("data-active")).toBe("true");
    expect(frameOf(current)?.dataset.fill).toBe("ink");
    expect(current.classList.contains("bg-primary")).toBe(true);
    // The page number sits after the frame, inside the anchor.
    expect(current.textContent).toBe("6");
  });

  it("announces page links as links, not buttons", () => {
    render(<PaginationDefaultDemo />);
    expect(screen.queryAllByRole("button")).toHaveLength(0);
    // Previous, 1, 5, 6, 7, 12, next.
    expect(screen.getAllByRole("link")).toHaveLength(7);
    expect(screen.getAllByText("More pages")).toHaveLength(2);
  });

  it("keeps previous and next with their stock names, the visible text in them, and a hand-inked chevron", () => {
    render(
      <>
        <PaginationPrevious href="#prev" />
        <PaginationNext href="#next" text="Chapter 13" />
      </>,
    );
    const previous = screen.getByRole("link", { name: "Go to previous page" });
    // A custom text joins the name, so the visible label is part of it (WCAG 2.5.3).
    const next = screen.getByRole("link", { name: "Go to next page: Chapter 13" });
    expect(previous.textContent).toBe("Previous");
    expect(next.textContent).toBe("Chapter 13");
    expect(previous.classList.contains("pl-1.5!")).toBe(true);
    expect(next.classList.contains("pr-1.5!")).toBe(true);
    for (const [link, icon] of [
      [previous, "inline-start"],
      [next, "inline-end"],
    ] as const) {
      expect(frameOf(link)?.dataset.fill).toBe("paper");
      const svg = link.querySelector(`svg[data-icon="${icon}"]`);
      expect(svg?.getAttribute("stroke")).toBe("currentColor");
      expect(svg?.getAttribute("aria-hidden")).toBe("true");
      expect(svg?.classList.contains("lucide")).toBe(false);
    }
  });

  it("keeps the ellipsis hidden from assistive tech with its stock text", () => {
    render(<PaginationEllipsis data-testid="ellipsis" />);
    const ellipsis = screen.getByTestId("ellipsis");
    expect(ellipsis.getAttribute("aria-hidden")).toBe("true");
    expect(ellipsis.querySelector(".sr-only")?.textContent).toBe("More pages");
  });

  it("inks every outline once measured", () => {
    const observers = stubResizeObserver();
    render(<PaginationDefaultDemo />);
    observers.drawAll(32, 32);
    const frames = document.querySelectorAll<HTMLElement>('[data-slot="ink-frame"]');
    expect(frames).toHaveLength(7);
    for (const frame of frames) expect(frame.dataset.inked).toBe("true");
  });

  it("lets a caller's aria-label win over the generated name", () => {
    render(<PaginationNext href="#next" text="Chapter 13" aria-label="Next chapter: Chapter 13" />);
    expect(screen.getByRole("link", { name: "Next chapter: Chapter 13" })).toBeTruthy();
  });

  expectDemosAccessible(import.meta.glob("./demos/*.tsx"));
});
