import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "@/lib/test/axe";
import { stubResizeObserver } from "@/lib/test/resize-observer";
import { ComponentIndex } from "./component-index";

beforeEach(() => {
  stubResizeObserver();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("ComponentIndex", () => {
  it("groups every item under the eight categories in spec order", async () => {
    const { container } = render(await ComponentIndex());
    // Demos bring headings of their own (panel), so only the section headings are read.
    const headings = [...container.querySelectorAll("section[aria-labelledby] > h2")];
    expect(headings.map((h) => h.firstChild?.textContent)).toMatchInlineSnapshot(`
      [
        "Primitives",
        "Layout",
        "Text",
        "Background",
        "Decoration",
        "Feedback",
        "Animation",
        "Data",
      ]
    `);
    expect(document.querySelectorAll("[data-item]")).toHaveLength(34);
  });

  it("links each card's title to the item page and renders its default demo", async () => {
    const { container } = render(await ComponentIndex());
    const card = container.querySelector<HTMLElement>('[data-item="speech-bubble"]');
    if (!card) throw new Error("no speech-bubble card");
    expect(within(card).getByRole("link", { name: "Speech Bubble" })).toHaveProperty(
      "pathname",
      "/docs/components/speech-bubble",
    );
    expect(card.querySelector('[data-slot="speech-bubble"]')).not.toBeNull();
  });

  it("shows overlay items through their stage iframe", async () => {
    render(await ComponentIndex());
    expect(screen.getByTitle("dialog / default").getAttribute("src")).toBe("/demo/dialog/default");
    expect(document.querySelectorAll("iframe")).toHaveLength(4);
  });

  it("has no axe violations", async () => {
    const { container } = render(await ComponentIndex());
    // axe cannot enter a jsdom iframe; the stages have their own suite.
    expect(await axe(container, { iframes: false })).toHaveNoViolations();
  }, 30_000);
});
