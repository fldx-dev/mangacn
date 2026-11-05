import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "@/lib/test/axe";
import { stubResizeObserver } from "@/lib/test/resize-observer";
import { WholePage } from "./whole-page";

beforeEach(() => {
  stubResizeObserver();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("WholePage", () => {
  it("composes page 7 in a three-column panel grid, its Japanese marked lang=ja", () => {
    const { container } = render(<WholePage />);
    const grid = container.querySelector<HTMLElement>('[data-slot="panel-grid"]');
    expect(grid?.className).toContain("sm:grid-cols-3");
    expect(grid?.querySelectorAll('[data-slot="panel"]')).toHaveLength(4);
    expect(grid?.querySelector('[data-slot="focus-lines"]')).not.toBeNull();
    expect(grid?.querySelector('[data-slot="halftone-background"]')).not.toBeNull();
    for (const text of ["ドドド", "遅いぞ。", "ここで合ってる…？", "じゃあ、始めようか。"]) {
      expect(screen.getByText(text).closest('[lang="ja"]')).not.toBeNull();
    }
    // The folio is the page-number item, read as "Page 7".
    const folio = container.querySelector<HTMLElement>('[data-slot="page-number"]');
    expect(folio?.closest('[data-slot="panel-caption"]')).not.toBeNull();
    expect(within(folio as HTMLElement).getByText("Page 7")).not.toBeNull();
  });

  it("turns to the next page with its own button", async () => {
    const { container } = render(<WholePage />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Turn page" }));
    });
    // The page that turned away may still be leaving; the new one carries folio 8.
    const folios = [...container.querySelectorAll<HTMLElement>('[data-slot="page-number"]')];
    expect(folios.some((folio) => within(folio).queryByText("Page 8"))).toBe(true);
    expect(screen.getByText("続きは、次のページで。").closest('[lang="ja"]')).not.toBeNull();
    expect(container.querySelector('[aria-live="polite"]')?.textContent).toBe("Page 8");
  });

  it("has no axe violations", async () => {
    const { container } = render(<WholePage />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
