import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { expectVariantsAccessible } from "@/lib/test/axe";
import {
  StatCard,
  StatCardChange,
  StatCardLabel,
  StatCardSparkline,
  StatCardValue,
} from "./stat-card";

afterEach(cleanup);

const change = () => document.querySelector<HTMLElement>('[data-slot="stat-card-change"]');

describe("StatCard", () => {
  expectVariantsAccessible(import.meta.glob("./variants/*.tsx"));

  it("is card's ink frame with a data-slot on every part", () => {
    render(
      <StatCard className="custom">
        <StatCardLabel>Readers</StatCardLabel>
        <StatCardValue>48,210</StatCardValue>
        <StatCardChange value={12.5}>vs last month</StatCardChange>
        <StatCardSparkline data={[1, 2, 3]} />
      </StatCard>,
    );
    const root = document.querySelector<HTMLElement>('[data-slot="stat-card"]');
    expect(root?.classList.contains("custom")).toBe(true);
    expect(root?.querySelector(':scope > [data-slot="ink-frame"]')).not.toBeNull();
    for (const slot of [
      "stat-card-label",
      "stat-card-value",
      "stat-card-change",
      "stat-card-sparkline",
    ]) {
      expect(root?.querySelector(`[data-slot="${slot}"]`), slot).not.toBeNull();
    }
  });

  it("sets the value in the display face, the one display face on the card", () => {
    render(
      <StatCard>
        <StatCardLabel>Readers</StatCardLabel>
        <StatCardValue>48,210</StatCardValue>
      </StatCard>,
    );
    expect(screen.getByText("48,210").className).toContain("font-display");
    expect(screen.getByText("Readers").className).not.toContain("font-display");
  });

  it('reads the change as words: "up 12.5% vs last month", the arrow hidden', () => {
    render(<StatCardChange value={12.5}>vs last month</StatCardChange>);
    expect(change()?.textContent).toBe("up 12.5%vs last month");
    expect(change()?.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
    expect(change()?.dataset.trend).toBe("up");
  });

  it("marks the trend down and flat", () => {
    const { rerender } = render(<StatCardChange value={-3} />);
    expect(change()?.dataset.trend).toBe("down");
    expect(change()?.textContent).toBe("down 3%");
    rerender(<StatCardChange value={0} />);
    expect(change()?.dataset.trend).toBe("flat");
    expect(change()?.textContent).toBe("no change 0%");
  });

  it("renders NaN as the flat state, in ink, not as NaN%", () => {
    render(<StatCardChange value={Number.NaN} goodDirection="down" />);
    expect(change()?.dataset.trend).toBe("flat");
    expect(change()?.hasAttribute("data-good")).toBe(true);
    expect(change()?.textContent).toBe("no change 0%");
  });

  it("draws the change in spot only when it goes the bad way", () => {
    const { rerender } = render(<StatCardChange value={5} />);
    expect(change()?.hasAttribute("data-good")).toBe(true);
    expect(change()?.className).not.toContain("text-spot");
    rerender(<StatCardChange value={-5} />);
    expect(change()?.hasAttribute("data-good")).toBe(false);
    expect(change()?.className).toContain("text-spot");
    rerender(<StatCardChange value={5} goodDirection="down" />);
    expect(change()?.className).toContain("text-spot");
    rerender(<StatCardChange value={-5} goodDirection="down" />);
    expect(change()?.className).not.toContain("text-spot");
    rerender(<StatCardChange value={0} goodDirection="down" />);
    expect(change()?.className).not.toContain("text-spot");
  });

  it("takes the direction words from labels and formats in a locale", () => {
    render(
      <StatCardChange value={-2.25} locale="de-DE" labels={{ down: "runter" }}>
        zum Vormonat
      </StatCardChange>,
    );
    expect(change()?.textContent).toBe("runter 2,3 %zum Vormonat");
  });

  it("hides the sparkline from assistive tech, as an area by default or a line", () => {
    const { rerender } = render(<StatCardSparkline data={[1, 3, 2]} />);
    const sparkline = document.querySelector<HTMLElement>('[data-slot="stat-card-sparkline"]');
    expect(sparkline?.getAttribute("aria-hidden")).toBe("true");
    expect(sparkline?.dataset.variant).toBe("area");
    expect(sparkline?.querySelector('[data-slot="chart"]')?.className).toContain("h-12");
    rerender(<StatCardSparkline data={[1, 3, 2]} variant="line" />);
    expect(sparkline?.dataset.variant).toBe("line");
  });
});
