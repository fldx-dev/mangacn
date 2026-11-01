import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { installCommand } from "@/lib/docs/install-command";
import { axe } from "@/lib/test/axe";
import { stubResizeObserver } from "@/lib/test/resize-observer";
import { FEATURED, landingCatalog } from "./catalog";
import { ComponentWall } from "./component-wall";

beforeEach(() => {
  stubResizeObserver();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

// The wall renders every non-overlay default demo; the first import of them is slow.
vi.setConfig({ testTimeout: 30_000 });

const cards = () => [...document.querySelectorAll<HTMLElement>("[data-item]")];

describe("ComponentWall", () => {
  it("shows the twelve featured items first, with counts from the catalog", async () => {
    const catalog = landingCatalog();
    render(await ComponentWall({ catalog }));
    expect(cards().map((card) => card.dataset.item)).toEqual([...FEATURED]);
    expect(
      screen.getByRole("heading", { name: `${catalog.items.length} items. Two kinds.` }),
    ).not.toBeNull();
    expect(screen.getByRole("link", { name: `All ${catalog.items.length} →` })).toHaveProperty(
      "pathname",
      "/docs/components",
    );
  });

  it("has a line tab per category, labelled with its catalog count", async () => {
    const catalog = landingCatalog();
    render(await ComponentWall({ catalog }));
    const list = screen.getByRole("tablist", { name: "Component categories" });
    expect(list.dataset.variant).toBe("line");
    expect(
      within(list)
        .getAllByRole("tab")
        .map((tab) => tab.textContent),
    ).toMatchInlineSnapshot(`
      [
        "Featured",
        "Primitives 21",
        "Layout 2",
        "Text 4",
        "Background 3",
        "Decoration 1",
        "Feedback 1",
        "Animation 1",
        "Data 1",
      ]
    `);
  });

  it("switches the grid to a category, overlay items without an iframe", async () => {
    render(await ComponentWall({ catalog: landingCatalog() }));
    await act(async () => {
      fireEvent.click(screen.getByRole("tab", { name: "Primitives 21" }));
    });
    expect(cards()).toHaveLength(21);
    const dialog = cards().find((card) => card.dataset.item === "dialog");
    expect(dialog?.textContent).toContain("Opens over the page");
    expect(document.querySelector("iframe")).toBeNull();
  });

  it("links each title to its page and copies its install command", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText } });
    render(await ComponentWall({ catalog: landingCatalog() }));
    const card = cards().find((element) => element.dataset.item === "speed-lines");
    if (!card) throw new Error("no speed-lines card");
    expect(within(card).getByRole("link", { name: "Speed Lines" })).toHaveProperty(
      "pathname",
      "/docs/components/speed-lines",
    );
    await act(async () => {
      fireEvent.click(
        within(card).getByRole("button", { name: "Copy install command for Speed Lines" }),
      );
    });
    expect(writeText).toHaveBeenCalledWith(installCommand("speed-lines", "pnpm"));
    expect(within(card).getByText("Copied")).not.toBeNull();
  });

  it("has no axe violations", async () => {
    const { container } = render(await ComponentWall({ catalog: landingCatalog() }));
    expect(await axe(container)).toHaveNoViolations();
  });
});
