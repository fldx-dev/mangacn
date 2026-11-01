import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { expectNoA11yViolations } from "@/lib/test/axe";
import { stubResizeObserver } from "@/lib/test/resize-observer";
import { ThemePlayground } from "./theme-playground";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const previewOf = (container: HTMLElement) =>
  container.querySelector<HTMLElement>('[data-slot="theme-playground-preview"]');
const framesOf = (container: HTMLElement) => [
  ...(previewOf(container)?.querySelectorAll<HTMLElement>('[data-slot="ink-frame"]') ?? []),
];
const snippet = (container: HTMLElement) => container.querySelector("pre")?.textContent ?? "";

describe("ThemePlayground", () => {
  it("starts from the theme's pen values in the preview and the snippet", () => {
    const { container } = render(<ThemePlayground />);
    expect(container.querySelector('[data-slot="theme-playground"]')).not.toBeNull();
    const preview = previewOf(container);
    expect(preview?.style.getPropertyValue("--outline-width")).toBe("1.5px");
    expect(preview?.style.getPropertyValue("--ink-roughness")).toBe("1.2");
    expect(snippet(container)).toBe(
      [
        ":root {",
        "  --outline-width: 1.5px;",
        "  --outline-width-heavy: 2.1px;",
        "  --ink-roughness: 1.2;",
        "  --ink-bowing: 0.8;",
        "  --ink-offset: 1.5;",
        "  --ink-hachure-gap: 4px;",
        "}",
      ].join("\n"),
    );
  });

  it("labels every slider and updates the preview style and the snippet", () => {
    const { container } = render(<ThemePlayground />);
    for (const name of [
      "--outline-width",
      "--outline-width-heavy",
      "--ink-roughness",
      "--ink-bowing",
      "--ink-offset",
      "--ink-hachure-gap",
    ]) {
      expect(screen.getByLabelText(new RegExp(`${name}$`))).toHaveProperty("type", "range");
    }

    fireEvent.change(screen.getByLabelText(/--outline-width$/), { target: { value: "3" } });
    fireEvent.change(screen.getByLabelText(/--ink-roughness$/), { target: { value: "0.3" } });

    const preview = previewOf(container);
    expect(preview?.style.getPropertyValue("--outline-width")).toBe("3px");
    expect(preview?.style.getPropertyValue("--ink-roughness")).toBe("0.3");
    expect(snippet(container)).toContain("  --outline-width: 3px;");
    expect(snippet(container)).toContain("  --ink-roughness: 0.3;");
  });

  it("redraws the frames after a slider change", () => {
    const observer = stubResizeObserver();
    const { container } = render(<ThemePlayground />);
    observer.drawAll();
    const before = framesOf(container);
    expect(before).toHaveLength(3);
    for (const frame of before) expect(frame.dataset.inked).toBe("true");

    observer.reset();
    fireEvent.change(screen.getByLabelText(/--ink-bowing$/), { target: { value: "2" } });
    const after = framesOf(container);
    // New frames, which draw again on their first resize callback.
    for (const [index, frame] of after.entries()) expect(frame).not.toBe(before[index]);
    observer.drawAll();
    for (const frame of after) {
      expect(frame.dataset.inked).toBe("true");
      expect(frame.querySelector("svg")?.childElementCount).toBeGreaterThan(0);
    }
  });

  it("rerolls the seed and resets the pen", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const { container } = render(<ThemePlayground />);
    fireEvent.click(screen.getByRole("button", { name: "Reroll seed" }));
    expect(previewOf(container)?.dataset.seed).toBe(String(Math.floor(0.5 * 2147483645) + 1));

    fireEvent.change(screen.getByLabelText(/--ink-offset$/), { target: { value: "4" } });
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(previewOf(container)?.style.getPropertyValue("--ink-offset")).toBe("1.5");
  });

  it("marks the Japanese label", () => {
    render(<ThemePlayground />);
    expect(screen.getByText("ドン！").closest("[lang]")?.getAttribute("lang")).toBe("ja");
  });

  it("has no axe violations", async () => {
    await expectNoA11yViolations(<ThemePlayground />);
  });
});
