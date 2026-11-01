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
  it("leads with the kicker, a Japanese accent, the headline and its sound-effect word", () => {
    render(<Hero />);
    expect(screen.getByText("Open source · MIT").closest('[data-slot="badge"]')).not.toBeNull();
    const accent = screen.getByText("ドン！", { selector: '[aria-hidden="true"]' });
    expect(accent.getAttribute("lang")).toBe("ja");
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading.textContent).toBe("Manga-styled components, drawn by hand.");
    expect(heading.querySelector('[data-slot="sfx-text"]')?.textContent).toBe("drawn");
    expect(screen.getByText(/^Dashboards, landing pages, manga readers\./)).not.toBeNull();
  });

  it("puts no number in the copy", () => {
    const { container } = render(<Hero />);
    const pitch = container.querySelector("#landing-hero")?.parentElement;
    expect(pitch?.querySelector('[data-slot="badge"]')?.textContent).not.toMatch(/\d/);
  });

  it("links the two buttons to the component index and the docs", () => {
    render(<Hero />);
    expect(screen.getByRole("link", { name: "Browse components" })).toHaveProperty(
      "pathname",
      "/docs/components",
    );
    expect(screen.getByRole("link", { name: "Read the docs" })).toHaveProperty("pathname", "/docs");
  });

  it("captions four compositions by their idea, none in an iframe", () => {
    const { container } = render(<Hero />);
    const grid = screen.getByRole("group", { name: "Live demos" });
    const captions = [...grid.querySelectorAll('[data-slot="panel-caption"]')];
    expect(captions.map((caption) => caption.textContent)).toEqual([
      "In a product",
      "A form",
      "On the page",
      "Badges and buttons",
    ]);
    expect(within(grid).getByText("Chapter 12 · Rooftop")).not.toBeNull();
    expect(within(grid).getAllByRole("row")).toHaveLength(4);
    expect(within(grid).getByRole("progressbar")).not.toBeNull();
    expect(within(grid).getByRole("textbox", { name: "Email" })).not.toBeNull();
    expect(within(grid).getByRole("checkbox", { name: "Remember me" })).not.toBeNull();
    expect(within(grid).getByRole("switch", { name: "New-chapter alerts" })).not.toBeNull();
    expect(within(grid).getByRole("button", { name: "Sign in" })).not.toBeNull();
    const line = within(grid).getByText("遅いぞ。もう始まってる！");
    expect(line.closest('[lang="ja"]')).not.toBeNull();
    expect(grid.querySelector('[data-slot="emanata"][data-kind="anger"]')).not.toBeNull();
    expect(within(grid).getByRole("button", { name: "Later" })).not.toBeNull();
    expect(container.querySelector("iframe")).toBeNull();
    expect(container.querySelector('[data-slot="install-command"]')).not.toBeNull();
  });

  it("has no axe violations", async () => {
    const { container } = render(<Hero />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
