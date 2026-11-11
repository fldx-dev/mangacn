import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { expectDemosAccessible } from "@/lib/test/axe";
import { stubResizeObserver } from "@/lib/test/resize-observer";
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "./carousel";

/** What embla needs from the window that jsdom lacks. */
function stubWindow() {
  stubResizeObserver();
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
    })),
  );
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    },
  );
}

const SLIDE = 300;

/**
 * jsdom lays nothing out, so embla would see every slide at 0. Lay a horizontal carousel out
 * by hand: a 300 px viewport and track (the slides overflow the track, as in CSS), slides 300 px
 * wide side by side.
 */
function layOut() {
  const box = (element: HTMLElement) => {
    if (element.dataset.slot === "carousel-content") return { left: 0, width: SLIDE };
    if (element.dataset.slot === "carousel-item") {
      const index = [...(element.parentElement?.children ?? [])].indexOf(element);
      return { left: index * SLIDE, width: SLIDE };
    }
    if (element.parentElement?.dataset.slot === "carousel-content") {
      return { left: 0, width: SLIDE };
    }
    return { left: 0, width: 0 };
  };
  const spy = (name: "offsetLeft" | "offsetTop" | "offsetWidth" | "offsetHeight") =>
    vi.spyOn(HTMLElement.prototype, name, "get").mockImplementation(function (this: HTMLElement) {
      const { left, width } = box(this);
      if (name === "offsetLeft") return left;
      if (name === "offsetWidth") return width;
      if (name === "offsetHeight") return width > 0 ? 200 : 0;
      return 0;
    });
  spy("offsetLeft");
  spy("offsetTop");
  spy("offsetWidth");
  spy("offsetHeight");
}

beforeEach(() => stubWindow());

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function Pages({ setApi }: { setApi?: (api: CarouselApi) => void }) {
  return (
    <Carousel className="custom-class" aria-label="Pages" setApi={setApi}>
      <CarouselContent className="content-class">
        <CarouselItem className="item-class">One</CarouselItem>
        <CarouselItem>Two</CarouselItem>
        <CarouselItem>Three</CarouselItem>
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}

const slot = (name: string) => document.querySelector<HTMLElement>(`[data-slot="${name}"]`);

describe("Carousel", () => {
  it("keeps stock's structure, roles and slots", () => {
    render(<Pages />);
    const region = screen.getByRole("region", { name: "Pages" });
    expect(region.dataset.slot).toBe("carousel");
    expect(region.getAttribute("aria-roledescription")).toBe("carousel");
    expect(region.classList.contains("custom-class")).toBe(true);
    const slides = screen.getAllByRole("group");
    expect(slides).toHaveLength(3);
    expect(slides[0]?.getAttribute("aria-roledescription")).toBe("slide");
    expect(slides[0]?.classList.contains("item-class")).toBe(true);
    expect(slot("carousel-content")?.firstElementChild?.classList.contains("content-class")).toBe(
      true,
    );
  });

  it("draws nothing on the viewport", () => {
    render(<Pages />);
    const viewport = slot("carousel-content");
    expect(viewport?.className).toBe("overflow-hidden");
    expect(viewport?.querySelector('[data-slot="ink-frame"]')).toBeNull();
  });

  it("makes previous and next mangacn's outlined icon buttons", () => {
    render(<Pages />);
    for (const name of ["carousel-previous", "carousel-next"]) {
      const button = slot(name);
      expect(button?.dataset.slot).toBe(name);
      expect(button?.className).toContain("size-7");
      expect(button?.className).not.toContain("rounded-full");
      const frame = button?.querySelector<HTMLElement>(':scope > [data-slot="ink-frame"]');
      expect(frame).not.toBeNull();
    }
    expect(screen.getByRole("button", { name: "Previous slide" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Next slide" })).toBeTruthy();
  });

  it("advances a slide through embla, from the button and the arrow keys", async () => {
    layOut();
    let api: CarouselApi;
    render(<Pages setApi={(next) => (api = next)} />);
    await act(async () => {});
    expect(api?.selectedScrollSnap()).toBe(0);
    const previous = screen.getByRole("button", { name: "Previous slide" });
    const next = screen.getByRole("button", { name: "Next slide" });
    expect((previous as HTMLButtonElement).disabled).toBe(true);
    expect((next as HTMLButtonElement).disabled).toBe(false);

    fireEvent.click(next);
    await act(async () => {});
    expect(api?.selectedScrollSnap()).toBe(1);
    expect((previous as HTMLButtonElement).disabled).toBe(false);

    fireEvent.keyDown(screen.getByRole("region", { name: "Pages" }), { key: "ArrowRight" });
    await act(async () => {});
    expect(api?.selectedScrollSnap()).toBe(2);
    expect((next as HTMLButtonElement).disabled).toBe(true);

    fireEvent.keyDown(screen.getByRole("region", { name: "Pages" }), { key: "ArrowLeft" });
    await act(async () => {});
    expect(api?.selectedScrollSnap()).toBe(1);
  });

  it("stacks the buttons above and below a vertical carousel", () => {
    render(
      <Carousel orientation="vertical" aria-label="Lines">
        <CarouselContent>
          <CarouselItem>One</CarouselItem>
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>,
    );
    expect(slot("carousel-previous")?.className).toContain("-top-12");
    expect(slot("carousel-next")?.className).toContain("-bottom-12");
    expect(slot("carousel-content")?.firstElementChild?.className).toContain("flex-col");
  });

  expectDemosAccessible(import.meta.glob("./demos/*.tsx"), { setup: stubWindow });
});
