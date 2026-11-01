import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "@/lib/test/axe";
import { stubResizeObserver } from "@/lib/test/resize-observer";
import { Hero } from "./hero";

beforeEach(() => {
  stubResizeObserver();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe("Hero", () => {
  it("leads with the kicker, the headline and its sound-effect word", async () => {
    render(await Hero({ total: 34 }));
    expect(screen.getByText("34 items · shadcn registry · MIT")).not.toBeNull();
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading.textContent).toBe("Manga-styled components, drawn by hand.");
    expect(heading.querySelector('[data-slot="sfx-text"]')?.textContent).toBe("drawn");
  });

  it("links the two buttons to the component index and the docs", async () => {
    render(await Hero({ total: 34 }));
    expect(screen.getByRole("link", { name: "Browse components" })).toHaveProperty(
      "pathname",
      "/docs/components",
    );
    expect(screen.getByRole("link", { name: "Read the docs" })).toHaveProperty("pathname", "/docs");
  });

  it("shows four live demos in a 2×2 panel grid, none of them in an iframe", async () => {
    const { container } = render(await Hero({ total: 34 }));
    const grid = screen.getByRole("group", { name: "Live demos" });
    expect(grid.querySelectorAll(':scope > [data-slot="panel-grid-item"]')).toHaveLength(4);
    expect(within(grid).getAllByRole("button", { name: "Dokan!" })).toHaveLength(1);
    expect(within(grid).getByText("遅いぞ。もう始まってる！")).not.toBeNull();
    expect(within(grid).getByRole("checkbox", { name: "Bookmark chapter 12" })).not.toBeNull();
    expect(within(grid).getByRole("switch", { name: "Show furigana" })).not.toBeNull();
    expect(within(grid).getByText("新連載")).not.toBeNull();
    expect(container.querySelector("iframe")).toBeNull();
    expect(container.querySelector('[data-slot="install-command"]')).not.toBeNull();
  });

  it("has no axe violations", async () => {
    const { container } = render(await Hero({ total: 34 }));
    expect(await axe(container)).toHaveNoViolations();
  });
});
