import { cleanup, render, screen, within } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { docItems } from "@/lib/docs/catalog";
import { loadRegistry } from "@/lib/registry";
import { listDemos } from "@/lib/registry/demos";
import { stubGetAnimations } from "@/lib/test/animations";
import { axe } from "@/lib/test/axe";
import { stubResizeObserver } from "@/lib/test/resize-observer";
import { ComponentIndex } from "./component-index";
import { OVERLAY_ITEMS } from "./demo-frame";

// The scroll-area card's viewport asks for running animations after it mounts; jsdom has none.
let restoreAnimations = () => {};
beforeAll(() => {
  restoreAnimations = stubGetAnimations();
});
afterAll(() => restoreAnimations());

beforeEach(() => {
  stubResizeObserver();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

// One card per documented item (a catalog item with demos), counted from the catalog so a new
// item needs no edit here.
const CARDS = docItems(loadRegistry(), listDemos()).length;

// Every test renders every default demo in jsdom; the first import of them is slow on a busy
// machine.
// 30 s was not enough with 76 cards while other work shared the machine (33 s, 2026-11-12).
vi.setConfig({ testTimeout: 120_000 });

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
    expect(document.querySelectorAll("[data-item]")).toHaveLength(CARDS);
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
    expect(document.querySelectorAll("iframe")).toHaveLength(OVERLAY_ITEMS.size);
  });

  it("puts every demo on a fixed stage that mounts lazily (mounted at once in jsdom)", async () => {
    const { container } = render(await ComponentIndex());
    const stages = [...container.querySelectorAll<HTMLElement>('[data-slot="lazy-demo"]')];
    expect(stages).toHaveLength(CARDS);
    // jsdom has no IntersectionObserver, so every demo mounts at once.
    expect(stages.every((stage) => stage.dataset.mounted === "true")).toBe(true);
    const height = (item: string) =>
      container.querySelector<HTMLElement>(`[data-item="${item}"] [data-slot="lazy-demo"]`)?.style
        .height;
    expect(height("button")).toBe("20rem");
    expect(height("dialog")).toBe("20rem");
    expect(height("panel-grid")).toBe("35rem");
  });

  it("has no axe violations", async () => {
    const { container } = render(await ComponentIndex());
    // axe cannot enter a jsdom iframe; the stages have their own suite.
    expect(await axe(container, { iframes: false })).toHaveNoViolations();
  }, 30_000);
});
