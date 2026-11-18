import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { expectDemosAccessible } from "@/lib/test/axe";
import { Banner, BannerAction, BannerClose, BannerContent, BannerIcon } from "./banner";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function stubReducedMotion(reduce: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: reduce && query.includes("reduce"),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    })),
  );
}

function Example(props: React.ComponentProps<typeof Banner>) {
  return (
    <Banner {...props}>
      <BannerIcon>!</BannerIcon>
      <BannerContent>Chapter 112 is out.</BannerContent>
      <BannerAction>
        <a href="#read">Read it</a>
      </BannerAction>
      <BannerClose />
    </Banner>
  );
}

const region = () => screen.queryByRole("region", { name: "Announcement" });

describe("Banner", () => {
  expectDemosAccessible(import.meta.glob("./demos/*.tsx"));

  it("is a named region (not an alert) with a data-slot on every part", () => {
    render(<Example className="custom" />);
    const root = region();
    expect(root?.dataset.slot).toBe("banner");
    expect(root?.dataset.state).toBe("open");
    expect(root?.dataset.variant).toBe("default");
    expect(root?.classList.contains("custom")).toBe(true);
    expect(screen.queryByRole("alert")).toBeNull();
    for (const slot of ["banner-icon", "banner-content", "banner-action", "banner-close"]) {
      expect(root?.querySelector(`[data-slot="${slot}"]`), slot).not.toBeNull();
    }
    expect(root?.querySelector('[data-slot="banner-icon"]')?.getAttribute("aria-hidden")).toBe(
      "true",
    );
  });

  it("draws an ink rule under the paper variant and none under the inverted one", () => {
    const { unmount } = render(<Example />);
    expect(
      region()?.querySelector(':scope > [data-slot="ink-frame"]')?.getAttribute("data-shape"),
    ).toBe("line");
    expect(region()?.className).toContain("bg-paper");
    unmount();
    render(<Example variant="inverted" />);
    expect(region()?.querySelector('[data-slot="ink-frame"]')).toBeNull();
    expect(region()?.className).toContain("bg-ink");
    expect(region()?.className).not.toMatch(/spot/);
  });

  it("closes uncontrolled, collapsing first, then unmounts", () => {
    vi.useFakeTimers();
    const onOpenChange = vi.fn();
    render(<Example onOpenChange={onOpenChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Dismiss announcement" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    // Collapsing: still in the DOM, closed and inert.
    const root = document.querySelector<HTMLElement>('[data-slot="banner"]');
    expect(root?.dataset.state).toBe("closed");
    expect(root?.hasAttribute("inert")).toBe(true);
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(document.querySelector('[data-slot="banner"]')).toBeNull();
  });

  it("unmounts on transitionend", () => {
    render(<Example />);
    fireEvent.click(screen.getByRole("button", { name: "Dismiss announcement" }));
    const root = document.querySelector<HTMLElement>('[data-slot="banner"]');
    if (!root) throw new Error("no banner");
    fireEvent.transitionEnd(root);
    expect(document.querySelector('[data-slot="banner"]')).toBeNull();
  });

  it("disappears at once, without the collapse, under reduced motion", () => {
    stubReducedMotion(true);
    render(<Example />);
    fireEvent.click(screen.getByRole("button", { name: "Dismiss announcement" }));
    expect(document.querySelector('[data-slot="banner"]')).toBeNull();
  });

  it("follows `open` when controlled and starts closed with defaultOpen={false}", () => {
    stubReducedMotion(true);
    const onOpenChange = vi.fn();
    const { rerender } = render(<Example open onOpenChange={onOpenChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Dismiss announcement" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    // The parent did not close it: it stays.
    expect(region()).not.toBeNull();
    rerender(<Example open={false} onOpenChange={onOpenChange} />);
    expect(region()).toBeNull();
    rerender(<Example open onOpenChange={onOpenChange} />);
    expect(region()).not.toBeNull();
    cleanup();
    render(<Example defaultOpen={false} />);
    expect(region()).toBeNull();
  });

  it("moves focus to the next focusable element after it when it closes with focus inside", () => {
    stubReducedMotion(true);
    render(
      <>
        <button type="button">Before</button>
        <Example />
        <a href="#next">After</a>
      </>,
    );
    const close = screen.getByRole("button", { name: "Dismiss announcement" });
    close.focus();
    fireEvent.click(close);
    expect(document.activeElement).toBe(screen.getByRole("link", { name: "After" }));
  });

  it("moves focus to main when nothing focusable follows it", () => {
    stubReducedMotion(true);
    render(
      <main>
        <Example />
        <p>Text only.</p>
      </main>,
    );
    const close = screen.getByRole("button", { name: "Dismiss announcement" });
    close.focus();
    fireEvent.click(close);
    const main = screen.getByRole("main");
    expect(document.activeElement).toBe(main);
    expect(main.getAttribute("tabindex")).toBe("-1");
  });

  it("leaves focus alone when it closes with focus elsewhere", () => {
    stubReducedMotion(true);
    render(
      <>
        <button type="button">Elsewhere</button>
        <Example />
        <a href="#next">After</a>
      </>,
    );
    const elsewhere = screen.getByRole("button", { name: "Elsewhere" });
    elsewhere.focus();
    fireEvent.click(screen.getByRole("button", { name: "Dismiss announcement" }));
    expect(document.activeElement).toBe(elsewhere);
  });

  it("takes every built-in word from labels", () => {
    render(<Example labels={{ region: "News", dismiss: "Hide news" }} />);
    expect(screen.getByRole("region", { name: "News" })).not.toBeNull();
    expect(screen.getByRole("button", { name: "Hide news" })).not.toBeNull();
  });

  it("drops the action under the text below md and keeps one line from md up", () => {
    render(<Example />);
    const action = document.querySelector<HTMLElement>('[data-slot="banner-action"]');
    expect(action?.className).toContain("basis-full");
    expect(action?.className).toContain("md:basis-auto");
    expect(action?.parentElement?.className).toContain("flex-wrap");
    expect(action?.parentElement?.className).toContain("md:flex-nowrap");
  });

  it("throws when BannerClose is used outside a Banner", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<BannerClose />)).toThrow(/within a <Banner \/>/);
  });
});
