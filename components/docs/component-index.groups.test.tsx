import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Category, DocItem } from "@/lib/docs/catalog";
import { stubResizeObserver } from "@/lib/test/resize-observer";
import { ComponentIndex } from "./component-index";

// Fixture items for the Inputs and Display groups (SPEC-components-7 §6), which no shipped item
// uses yet: real items with demos, re-filed under `form` and `display`, and no `layout` item.
const FIXTURE: Readonly<Record<string, Category>> = {
  badge: "display",
  "speech-bubble": "text",
  input: "form",
  button: "primitive",
};

vi.mock("@/lib/docs/catalog", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/docs/catalog")>();
  return {
    ...actual,
    docItems: (...args: Parameters<typeof actual.docItems>): DocItem[] => {
      const items = actual
        .docItems(...args)
        .filter((item) => item.name in FIXTURE)
        .map((item) => ({ ...item, category: FIXTURE[item.name] }));
      return items.sort(
        (a, b) => actual.CATEGORIES.indexOf(a.category) - actual.CATEGORIES.indexOf(b.category),
      );
    },
  };
});

beforeEach(() => stubResizeObserver());
afterEach(() => cleanup());

vi.setConfig({ testTimeout: 60_000 });

describe("ComponentIndex, Inputs and Display", () => {
  it("lists a form item under Inputs and a display item under Display, after Primitives", async () => {
    const { container } = render(await ComponentIndex());
    const sections = [...container.querySelectorAll("section[aria-labelledby]")].map((section) => [
      section.querySelector("h2")?.firstChild?.textContent,
      [...section.querySelectorAll<HTMLElement>("[data-item]")].map((card) => card.dataset.item),
    ]);
    // No Layout heading: an empty group renders nothing.
    expect(sections).toEqual([
      ["Primitives", ["button"]],
      ["Inputs", ["input"]],
      ["Display", ["badge"]],
      ["Text", ["speech-bubble"]],
    ]);
  });
});
