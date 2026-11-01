import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "@/lib/test/axe";
import { stubResizeObserver } from "@/lib/test/resize-observer";
import { ThemeTeaser } from "./theme-teaser";

beforeEach(() => {
  stubResizeObserver();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("ThemeTeaser", () => {
  it("shows the swatches and a light and a dark card in their own tokens", () => {
    const { container } = render(<ThemeTeaser />);
    expect(container.querySelector('[data-slot="token-swatches"]')).not.toBeNull();
    const light = container.querySelector<HTMLElement>('[data-mode="light"]');
    const dark = container.querySelector<HTMLElement>('[data-mode="dark"]');
    expect(light?.parentElement?.classList.contains("dark")).toBe(false);
    expect(dark?.parentElement?.classList.contains("dark")).toBe(true);
    expect(light?.parentElement?.style.getPropertyValue("--paper")).not.toBe(
      dark?.parentElement?.style.getPropertyValue("--paper"),
    );
    expect(dark?.querySelector('[lang="ja"]')?.textContent).toBe("第12話");
  });

  it("binds two sliders to one live InkFrame, redrawing it on change", async () => {
    const { container } = render(<ThemeTeaser />);
    const teaser = container.querySelector<HTMLElement>('[data-slot="ink-teaser"]');
    if (!teaser) throw new Error("no ink teaser");
    expect(teaser.querySelectorAll('input[type="range"]')).toHaveLength(2);
    const frame = () => teaser.querySelector('[data-slot="ink-frame"]');
    const before = frame();
    await act(async () => {
      fireEvent.change(screen.getByRole("slider", { name: "Outline width" }), {
        target: { value: "3" },
      });
    });
    expect(frame()?.parentElement?.style.getPropertyValue("--outline-width")).toBe("3px");
    expect(frame()).not.toBe(before);
    expect(teaser.querySelectorAll('[data-slot="ink-frame"]')).toHaveLength(1);
  });

  it("links to the theming guide", () => {
    render(<ThemeTeaser />);
    expect(screen.getByRole("link", { name: "Theming guide →" })).toHaveProperty(
      "pathname",
      "/docs/theming",
    );
  });

  it("has no axe violations", async () => {
    const { container } = render(<ThemeTeaser />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
