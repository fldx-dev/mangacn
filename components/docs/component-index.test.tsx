import { cleanup, render, screen, within } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { CATEGORY_LABELS, docItems } from "@/lib/docs/catalog";
import { variantDisplayName } from "@/lib/docs/variant-meta";
import { loadRegistry } from "@/lib/registry";
import { listVariants } from "@/lib/registry/variants";
import { stubGetAnimations } from "@/lib/test/animations";
import { axe } from "@/lib/test/axe";
import { stubResizeObserver } from "@/lib/test/resize-observer";
import { ComponentIndex } from "./component-index";
import { OVERLAY_ITEMS } from "./variant-frame";

// The scroll-area card's viewport asks for running animations after it mounts; jsdom has none.
let restoreAnimations = () => {};
beforeAll(() => {
  restoreAnimations = stubGetAnimations();
});
afterAll(() => restoreAnimations());

beforeEach(() => {
  stubResizeObserver();
  // The carousel card (embla) asks for matchMedia and IntersectionObserver on mount; jsdom has
  // neither. Reduced data keeps every card mounting at once, as it does with no observer.
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query === "(prefers-reduced-data: reduce)",
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }));
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    },
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

// One card per documented item (a catalog item with variants), counted from the catalog so a new
// item needs no edit here.
const CARDS = docItems(loadRegistry(), listVariants()).length;

// Every test renders every default variant in jsdom; the first import of them is slow on a busy
// machine.
// 30 s was not enough with 76 cards while other work shared the machine (33 s, 2026-11-12).
vi.setConfig({ testTimeout: 120_000 });

describe("ComponentIndex", () => {
  it("groups every item under the categories in spec order", async () => {
    const { container } = render(await ComponentIndex());
    // Variants bring headings of their own (panel), so only the section headings are read.
    const headings = [...container.querySelectorAll("section[aria-labelledby] > h2")];
    // SPEC-components-7 §6: Inputs and Display right after Primitives; an empty group has no
    // heading, so a lane's first item brings its group's heading with no edit here.
    const order = [
      "Primitives",
      "Inputs",
      "Display",
      "Layout",
      "Text",
      "Background",
      "Decoration",
      "Feedback",
      "Animation",
      "Data",
    ];
    const filled = new Set(
      docItems(loadRegistry(), listVariants()).map((item) => CATEGORY_LABELS[item.category]),
    );
    expect(headings.map((h) => h.firstChild?.textContent)).toEqual(
      order.filter((label) => filled.has(label)),
    );
    expect(document.querySelectorAll("[data-item]")).toHaveLength(CARDS);
  });

  it("links each card's title to the item page and renders its default variant", async () => {
    const { container } = render(await ComponentIndex());
    const card = container.querySelector<HTMLElement>('[data-item="speech-bubble"]');
    if (!card) throw new Error("no speech-bubble card");
    expect(within(card).getByRole("link", { name: "Speech Bubble" })).toHaveProperty(
      "pathname",
      "/docs/components/speech-bubble",
    );
    expect(card.querySelector('[data-slot="speech-bubble"]')).not.toBeNull();
  });

  it("counts the components and the variants, in all and on each card", async () => {
    const { container } = render(await ComponentIndex());
    expect(container.querySelector('[data-slot="component-index-total"]')?.textContent).toBe(
      `All Components${CARDS} components, 309 variants`,
    );
    const count = (item: string) =>
      container.querySelector(`[data-item="${item}"] [data-slot="variant-count"]`)?.textContent;
    expect(count("stamp")).toBe("6 variants");
    expect(count("accordion")).toBe("3 variants");
  });

  it("shows overlay items through their stage iframe", async () => {
    render(await ComponentIndex());
    expect(screen.getByTitle(variantDisplayName("dialog", "default")).getAttribute("src")).toBe(
      "/gallery/dialog/default",
    );
    expect(document.querySelectorAll("iframe")).toHaveLength(OVERLAY_ITEMS.size);
  });

  it("puts every variant on a fixed stage that mounts lazily (mounted at once in jsdom)", async () => {
    const { container } = render(await ComponentIndex());
    const stages = [...container.querySelectorAll<HTMLElement>('[data-slot="lazy-variant"]')];
    expect(stages).toHaveLength(CARDS);
    // jsdom has no IntersectionObserver, so every variant mounts at once.
    expect(stages.every((stage) => stage.dataset.mounted === "true")).toBe(true);
    const height = (item: string) =>
      container.querySelector<HTMLElement>(`[data-item="${item}"] [data-slot="lazy-variant"]`)
        ?.style.height;
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
