import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "@/lib/test/axe";
import { stubResizeObserver } from "@/lib/test/resize-observer";
import { Why } from "./why";

beforeEach(() => {
  stubResizeObserver();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("Why", () => {
  it("gives each reason a panel with its own tone, an sfx or badge heading and a mark", () => {
    const { container } = render(<Why primitives={21} />);
    const panels = [...container.querySelectorAll<HTMLElement>('[data-slot="panel"]')];
    expect(panels.map((panel) => panel.dataset.tone)).toEqual(["none", "lines", "halftone"]);
    expect(screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual([
      "Hand-drawn",
      "Same API",
      "Yours",
    ]);
    expect(panels[0].querySelector('h3 [data-slot="sfx-text"]')).not.toBeNull();
    expect(panels[1].querySelector('h3 [data-slot="badge"]')).not.toBeNull();
    expect(panels[2].querySelector('h3 [data-slot="badge"]')).not.toBeNull();
    expect(container.querySelectorAll('[data-slot="emanata"][aria-hidden="true"]')).toHaveLength(3);
  });

  it("states the primitive count it is given", () => {
    render(<Why primitives={21} />);
    expect(screen.getByText(/^The 21 restyled primitives/)).not.toBeNull();
  });

  it("has no axe violations", async () => {
    const { container } = render(<Why primitives={21} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
