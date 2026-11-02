import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
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
    expect(screen.getByText("p. 7")).not.toBeNull();
  });

  it("turns to the next page with its own button", async () => {
    render(<WholePage />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Turn page" }));
    });
    expect(screen.getByText("p. 8")).not.toBeNull();
    expect(screen.getByText("続きは、次のページで。").closest('[lang="ja"]')).not.toBeNull();
    expect(screen.getByText("Page 8").getAttribute("aria-live")).toBe("polite");
  });

  it("has no axe violations", async () => {
    const { container } = render(<WholePage />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
