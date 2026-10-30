import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { expectNoA11yViolations } from "@/lib/test/axe";
import { stubResizeObserver } from "@/lib/test/resize-observer";
import ProgressDefaultDemo from "./demos/default";
import { Progress, ProgressLabel, ProgressValue } from "./progress";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("Progress", () => {
  it("renders a progressbar with data-slots and a forwarded className", () => {
    render(
      <Progress value={40} className="custom-class">
        <ProgressLabel>Inks</ProgressLabel>
        <ProgressValue />
      </Progress>,
    );
    const bar = screen.getByRole("progressbar");
    expect(bar.getAttribute("data-slot")).toBe("progress");
    expect(bar.getAttribute("aria-valuenow")).toBe("40");
    expect(bar.classList.contains("custom-class")).toBe(true);
    for (const slot of [
      "progress-track",
      "progress-indicator",
      "progress-label",
      "progress-value",
    ]) {
      expect(bar.querySelector(`[data-slot="${slot}"]`), slot).not.toBeNull();
    }
  });

  it("draws the track as a paper InkFrame with a solid ink indicator", () => {
    const observers = stubResizeObserver();
    render(<Progress value={40} aria-label="Inks" />);
    observers.drawAll(240, 10);
    const bar = screen.getByRole("progressbar");
    const track = bar.querySelector<HTMLElement>('[data-slot="progress-track"]');
    for (const name of track?.classList ?? []) {
      expect(name, name).not.toMatch(/^overflow-/);
    }
    const frame = track?.querySelector<HTMLElement>(':scope > [data-slot="ink-frame"]');
    expect(frame?.getAttribute("data-fill")).toBe("paper");
    expect(frame?.dataset.inked).toBe("true");
    const indicator = bar.querySelector<HTMLElement>('[data-slot="progress-indicator"]');
    expect(indicator?.classList.contains("bg-primary")).toBe(true);
    expect(indicator?.style.width).toBe("40%");
  });

  it("fills the tone variant with screentone lines", () => {
    render(<Progress value={40} variant="tone" aria-label="Tones" />);
    const bar = screen.getByRole("progressbar");
    expect(bar.getAttribute("data-variant")).toBe("tone");
    const indicator = bar.querySelector<HTMLElement>('[data-slot="progress-indicator"]');
    expect(indicator?.classList.contains("screentone-lines")).toBe(true);
    expect(indicator?.classList.contains("bg-primary")).toBe(false);
  });

  it("has no axe violations in its default demo", async () => {
    await expectNoA11yViolations(<ProgressDefaultDemo />);
  });
});
