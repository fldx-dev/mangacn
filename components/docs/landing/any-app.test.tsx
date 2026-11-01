import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "@/lib/test/axe";
import { stubResizeObserver } from "@/lib/test/resize-observer";
import { AnyApp } from "./any-app";

beforeEach(() => {
  stubResizeObserver();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const MANGA_NATIVE = [
  "panel",
  "panel-grid",
  "speech-bubble",
  "thought-bubble",
  "sfx-text",
  "vertical-text",
  "speed-lines",
  "focus-lines",
  "halftone-background",
  "emanata",
  "ink-splash-loader",
  "page-turn",
  "manga-frame",
];

describe("AnyApp", () => {
  it("shows a dashboard and a sign-up form, each with its sentence", () => {
    render(<AnyApp primitives={21} />);
    expect(screen.getByRole("heading", { level: 2, name: "Works in any app" })).not.toBeNull();
    const [dashboard, form] = screen.getAllByRole("figure");
    expect(within(dashboard).getByRole("tablist", { name: "Period" }).dataset.variant).toBe("line");
    expect(within(dashboard).getAllByRole("row")).toHaveLength(4);
    expect(within(dashboard).getByRole("progressbar")).not.toBeNull();
    expect(dashboard.querySelectorAll('[data-slot="badge"]')).toHaveLength(2);
    expect(within(dashboard).getByRole("button", { name: "New release" })).not.toBeNull();
    expect(dashboard.querySelector("figcaption")?.textContent).toBe(
      "The 21 primitives keep shadcn's API; a stock dashboard becomes this by swapping imports.",
    );
    expect(within(form).getByRole("textbox", { name: "Work email" })).not.toBeNull();
    expect(within(form).getByRole("combobox", { name: "Framework" })).not.toBeNull();
    expect(within(form).getByRole("checkbox", { name: "I accept the terms" })).not.toBeNull();
    expect(within(form).getByRole("switch", { name: "Email me release notes" })).not.toBeNull();
    expect(
      within(form)
        .getAllByRole("button")
        .map((b) => b.textContent),
    ).toContain("Cancel");
  });

  it("uses no manga-native piece", () => {
    const { container } = render(<AnyApp primitives={21} />);
    for (const slot of MANGA_NATIVE) {
      expect(container.querySelector(`[data-slot="${slot}"]`), slot).toBeNull();
    }
  });

  it("switches the dashboard's period with its line tabs", async () => {
    render(<AnyApp primitives={21} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("tab", { name: "This month" }));
    });
    expect(screen.getByRole("cell", { name: "Audit log" })).not.toBeNull();
  });

  it("has no axe violations", async () => {
    const { container } = render(<AnyApp primitives={21} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
