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
  it("sets pages 7 and 8 as a spread, page 7 first, its Japanese marked lang=ja", () => {
    const { container } = render(<WholePage />);
    const grids = container.querySelectorAll<HTMLElement>('[data-slot="panel-grid"]');
    expect(grids).toHaveLength(2);
    expect(grids[0]?.className).toContain("sm:grid-cols-3");
    expect(grids[0]?.querySelectorAll('[data-slot="panel"]')).toHaveLength(4);
    const folios = [...container.querySelectorAll<HTMLElement>('[data-slot="page-number"]')];
    expect(folios.map((folio) => folio.textContent)).toEqual(["Page 77", "Page 88"]);
    for (const text of ["ドドド", "遅いぞ。", "ここで合ってる…？", "続きは、次のページで。"]) {
      expect(screen.getByText(text).closest('[lang="ja"]')).not.toBeNull();
    }
  });

  it("rings every use of the item picked in the legend", async () => {
    const { container } = render(<WholePage />);
    const legend = screen.getByRole("list", { name: "Items on the spread" });
    await act(async () => {
      fireEvent.click(within(legend).getByRole("button", { name: "sfx-text" }));
    });
    const spread = container.querySelector<HTMLElement>(".landing-spread");
    expect(spread?.dataset.active).toBe("sfx-text");
    expect(spread?.querySelectorAll('[data-part="sfx-text"]')).toHaveLength(2);
    expect(
      within(legend).getByRole("button", { name: "sfx-text" }).getAttribute("aria-pressed"),
    ).toBe("true");
  });

  it("has no axe violations", async () => {
    const { container } = render(<WholePage />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
