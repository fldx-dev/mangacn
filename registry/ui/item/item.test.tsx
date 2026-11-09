import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { expectDemosAccessible } from "@/lib/test/axe";
import { stubResizeObserver } from "@/lib/test/resize-observer";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemGroup,
  ItemHeader,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from "./item";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const framesOf = (element: HTMLElement | null) => [
  ...(element?.querySelectorAll<HTMLElement>(':scope > [data-slot="ink-frame"]') ?? []),
];

function Row(props: Partial<React.ComponentProps<typeof Item>>) {
  return (
    <Item data-testid="item" className="custom-class" {...props}>
      <ItemHeader>Header</ItemHeader>
      <ItemMedia variant="icon">M</ItemMedia>
      <ItemContent>
        <ItemTitle>Chapter 12</ItemTitle>
        <ItemDescription>24 pages</ItemDescription>
      </ItemContent>
      <ItemActions>Read</ItemActions>
      <ItemFooter>Footer</ItemFooter>
    </Item>
  );
}

describe("Item", () => {
  it("renders stock slots and state attributes with a forwarded className", () => {
    render(<Row size="sm" />);
    const item = screen.getByTestId("item");
    expect(item.getAttribute("data-slot")).toBe("item");
    expect(item.getAttribute("data-variant")).toBe("default");
    expect(item.getAttribute("data-size")).toBe("sm");
    expect(item.classList.contains("custom-class")).toBe(true);
    for (const slot of [
      "item-header",
      "item-media",
      "item-content",
      "item-title",
      "item-description",
      "item-actions",
      "item-footer",
    ]) {
      expect(item.querySelector(`[data-slot="${slot}"]`), slot).not.toBeNull();
    }
    expect(item.querySelector('[data-slot="item-media"]')?.getAttribute("data-variant")).toBe(
      "icon",
    );
  });

  it("draws a heavy paper outline only for variant outline, and no CSS border", () => {
    render(<Row variant="outline" />);
    const item = screen.getByTestId("item");
    const [frame] = framesOf(item);
    expect(item.firstElementChild).toBe(frame);
    expect(frame?.getAttribute("data-fill")).toBe("paper");
    expect(frame?.className).toContain("[--outline-width:var(--outline-width-heavy)]");
    expect(item.classList.contains("border-0")).toBe(true);
    expect(item.classList.contains("border")).toBe(false);
    cleanup();
    render(<Row />);
    expect(framesOf(screen.getByTestId("item"))).toHaveLength(0);
  });

  it("sets muted on tone-1 with no outline", () => {
    render(<Row variant="muted" />);
    const item = screen.getByTestId("item");
    expect(item.classList.contains("bg-tone-1")).toBe(true);
    expect(framesOf(item)).toHaveLength(0);
  });

  it("sets the title in the display face", () => {
    render(<Row />);
    expect(screen.getByText("Chapter 12").classList.contains("font-display")).toBe(true);
  });

  it("renders as another element through render, keeping the frame first", () => {
    render(
      <Item variant="outline" render={<a href="/ch/12" aria-label="Open chapter 12" />}>
        <ItemContent>
          <ItemTitle>Open</ItemTitle>
        </ItemContent>
      </Item>,
    );
    const link = screen.getByRole("link", { name: "Open chapter 12" });
    expect(link.getAttribute("data-slot")).toBe("item");
    expect(link.firstElementChild?.getAttribute("data-slot")).toBe("ink-frame");
  });

  it("groups items as a list with hand-drawn separators", () => {
    render(
      <ItemGroup aria-label="Chapters">
        <Item role="listitem">One</Item>
        <ItemSeparator />
        <Item role="listitem">Two</Item>
      </ItemGroup>,
    );
    const group = screen.getByRole("list", { name: "Chapters" });
    expect(group.getAttribute("data-slot")).toBe("item-group");
    const separator = group.querySelector<HTMLElement>('[data-slot="item-separator"]');
    expect(separator?.querySelector('[data-slot="ink-frame"]')?.getAttribute("data-shape")).toBe(
      "line",
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("draws the outline once measured", () => {
    const observers = stubResizeObserver();
    render(<Row variant="outline" />);
    observers.drawAll(320, 64);
    const [frame] = framesOf(screen.getByTestId("item"));
    expect(frame?.dataset.inked).toBe("true");
  });

  expectDemosAccessible(import.meta.glob("./demos/*.tsx"));
});
