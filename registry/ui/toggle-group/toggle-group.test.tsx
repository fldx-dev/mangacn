import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { expectDemosAccessible } from "@/lib/test/axe";
import { stubResizeObserver } from "@/lib/test/resize-observer";
import { ToggleGroup, ToggleGroupItem } from "./toggle-group";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const framesOf = (element: HTMLElement | null | undefined) => [
  ...(element?.querySelectorAll<HTMLElement>(':scope > [data-slot="ink-frame"]') ?? []),
];

function Group(props: Partial<React.ComponentProps<typeof ToggleGroup>>) {
  return (
    <ToggleGroup aria-label="Reading mode" className="custom-class" {...props}>
      <ToggleGroupItem value="page">Page</ToggleGroupItem>
      <ToggleGroupItem value="spread">Spread</ToggleGroupItem>
      <ToggleGroupItem value="scroll">Scroll</ToggleGroupItem>
    </ToggleGroup>
  );
}

describe("ToggleGroup", () => {
  it("renders stock slots and data attributes with a forwarded className", () => {
    render(<Group variant="outline" size="sm" spacing={0} />);
    const group = screen.getByRole("group", { name: "Reading mode" });
    expect(group.getAttribute("data-slot")).toBe("toggle-group");
    expect(group.getAttribute("data-variant")).toBe("outline");
    expect(group.getAttribute("data-size")).toBe("sm");
    expect(group.getAttribute("data-spacing")).toBe("0");
    expect(group.classList.contains("custom-class")).toBe(true);
    const items = screen.getAllByRole("button");
    expect(items).toHaveLength(3);
    for (const item of items) {
      expect(item.getAttribute("data-slot")).toBe("toggle-group-item");
      expect(item.getAttribute("data-variant")).toBe("outline");
      expect(item.getAttribute("data-size")).toBe("sm");
    }
  });

  it("draws one outline around the group, as its first child, and none per item", () => {
    render(<Group variant="outline" />);
    const group = screen.getByRole("group");
    expect(group.firstElementChild?.getAttribute("data-slot")).toBe("ink-frame");
    const [outline] = framesOf(group);
    expect(outline?.getAttribute("data-shape")).toBe("rect");
    expect(outline?.getAttribute("data-fill")).toBe("paper");
    for (const item of screen.getAllByRole("button")) {
      const fills = framesOf(item).map((frame) => frame.getAttribute("data-fill"));
      expect(fills).not.toContain("paper");
      expect(item.classList.contains("bg-transparent")).toBe(true);
    }
  });

  it("separates items with hand-drawn rules, none after the last", () => {
    render(<Group />);
    for (const item of screen.getAllByRole("button")) {
      const rule = framesOf(item).find((frame) => frame.dataset.shape === "line");
      expect(rule).toBeDefined();
      expect(rule?.classList.contains("group-last/toggle:hidden")).toBe(true);
    }
  });

  it("presses one item at a time, or several with multiple", () => {
    render(<Group defaultValue={["page"]} />);
    const [page, spread] = screen.getAllByRole("button");
    expect(page?.getAttribute("aria-pressed")).toBe("true");
    if (spread) fireEvent.click(spread);
    expect(page?.getAttribute("aria-pressed")).toBe("false");
    expect(spread?.getAttribute("aria-pressed")).toBe("true");
    cleanup();
    render(<Group multiple defaultValue={["page"]} />);
    const [first, second] = screen.getAllByRole("button");
    if (second) fireEvent.click(second);
    expect(first?.getAttribute("aria-pressed")).toBe("true");
    expect(second?.getAttribute("aria-pressed")).toBe("true");
  });

  it("fills a pressed item with ink once drawn", () => {
    const observers = stubResizeObserver();
    render(<Group defaultValue={["spread"]} />);
    observers.drawAll(72, 32);
    const spread = screen.getByRole("button", { name: "Spread" });
    const fill = framesOf(spread).find((frame) => frame.dataset.fill === "ink");
    expect(fill?.dataset.inked).toBe("true");
    expect(framesOf(screen.getByRole("group"))[0]?.dataset.inked).toBe("true");
  });

  expectDemosAccessible(import.meta.glob("./demos/*.tsx"));
});
