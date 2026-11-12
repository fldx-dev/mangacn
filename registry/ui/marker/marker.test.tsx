import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { expectDemosAccessible } from "@/lib/test/axe";
import { Marker, MarkerContent, MarkerIcon, markerVariants } from "./marker";

afterEach(() => {
  cleanup();
});

const linesOf = (element: HTMLElement) => [
  ...element.querySelectorAll<HTMLElement>(':scope > [data-slot="ink-frame"][data-shape="line"]'),
];

describe("Marker", () => {
  it("renders stock slots and state with a forwarded className", () => {
    render(
      <Marker data-testid="marker" className="custom-class">
        <MarkerIcon data-testid="icon">i</MarkerIcon>
        <MarkerContent data-testid="content">Pinned</MarkerContent>
      </Marker>,
    );
    const marker = screen.getByTestId("marker");
    expect(marker.getAttribute("data-slot")).toBe("marker");
    expect(marker.getAttribute("data-variant")).toBe("default");
    expect(marker.classList.contains("custom-class")).toBe(true);
    expect(screen.getByTestId("icon").getAttribute("data-slot")).toBe("marker-icon");
    expect(screen.getByTestId("icon").getAttribute("aria-hidden")).toBe("true");
    expect(screen.getByTestId("content").getAttribute("data-slot")).toBe("marker-content");
    expect(linesOf(marker)).toHaveLength(0);
  });

  it("draws a hand-drawn rule either side of a separator's label, not pseudo-elements", () => {
    render(
      <Marker data-testid="marker" variant="separator">
        <MarkerContent>Today</MarkerContent>
      </Marker>,
    );
    const marker = screen.getByTestId("marker");
    const lines = linesOf(marker);
    expect(lines).toHaveLength(2);
    expect(marker.firstElementChild).toBe(lines[0]);
    expect(marker.lastElementChild).toBe(lines[1]);
    for (const line of lines) {
      expect(line.getAttribute("aria-hidden")).toBe("true");
      expect(line.classList.contains("flex-1")).toBe(true);
    }
    expect(marker.className).not.toContain("before:");
    expect(marker.className).not.toContain("after:");
  });

  it("boxes a separator's label in a heavy square paper frame, hidden elsewhere", () => {
    render(<MarkerContent data-testid="content">Today</MarkerContent>);
    const frame = screen
      .getByTestId("content")
      .querySelector<HTMLElement>(':scope > [data-slot="ink-frame"]');
    expect(frame?.getAttribute("data-fill")).toBe("paper");
    expect(frame?.classList.contains("hidden")).toBe(true);
    expect(frame?.className).toContain("group-data-[variant=separator]/marker:block");
    expect(frame?.className).toContain("[--outline-width:var(--outline-width-heavy)]");
    expect(frame?.classList.contains("rounded-none")).toBe(true);
  });

  it("draws the border variant's rule under it instead of a CSS border", () => {
    render(
      <Marker data-testid="marker" variant="border">
        <MarkerContent>Renamed</MarkerContent>
      </Marker>,
    );
    const marker = screen.getByTestId("marker");
    const [rule] = linesOf(marker);
    expect(rule?.classList.contains("bottom-0")).toBe(true);
    expect(marker.classList.contains("border-b")).toBe(false);
    expect(markerVariants({ variant: "border" })).toContain("pb-2");
  });

  it("renders as another element through render", () => {
    render(
      <Marker render={<a href="#chapter-12" />} variant="default">
        Chapter 12
      </Marker>,
    );
    const link = screen.getByRole("link", { name: "Chapter 12" });
    expect(link.getAttribute("data-slot")).toBe("marker");
  });

  expectDemosAccessible(import.meta.glob("./demos/*.tsx"));
});
