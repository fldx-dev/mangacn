import { cleanup, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { expectDemosAccessible } from "@/lib/test/axe";
import { stubResizeObserver } from "@/lib/test/resize-observer";
import PowerGaugeStatCardDemo from "./demos/stat-card";
import { PowerGauge } from "./power-gauge";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const gaugeOf = (root: ParentNode) => root.querySelector<HTMLElement>('[data-slot="power-gauge"]');
const fillOf = (gauge: HTMLElement) =>
  gauge.querySelector<HTMLElement>('[data-slot="power-gauge-fill"]') as HTMLElement;
const segmentsOf = (gauge: HTMLElement) => [
  ...gauge.querySelectorAll<HTMLElement>('[data-slot="power-gauge-segment"]'),
];

describe("PowerGauge", () => {
  it("is a meter named by its visible label, with its value, bounds and value text", () => {
    render(<PowerGauge label="Power" value={70} />);
    const meter = screen.getByRole("meter", { name: "Power" });
    expect(meter.dataset.slot).toBe("power-gauge");
    expect(meter.getAttribute("aria-valuenow")).toBe("70");
    expect(meter.getAttribute("aria-valuemin")).toBe("0");
    expect(meter.getAttribute("aria-valuemax")).toBe("100");
    expect(meter.getAttribute("aria-valuetext")).toBe("70 of 100");
    // The name comes from the label element on screen, not a copy of it.
    const label = document.getElementById(meter.getAttribute("aria-labelledby") ?? "");
    expect(label?.dataset.slot).toBe("power-gauge-label");
    expect(label?.textContent).toBe("Power");
  });

  it("shows the value as text beside the label", () => {
    const { container } = render(<PowerGauge label="Speed" value={7} max={10} />);
    const value = container.querySelector('[data-slot="power-gauge-value"]');
    expect(value?.textContent).toBe("7 / 10");
    expect(screen.getByRole("meter").getAttribute("aria-valuemax")).toBe("10");
  });

  it("uses format for the text on screen and the value read out", () => {
    const { container } = render(
      <PowerGauge label="Ink" value={45} format={(value, max) => `${(value / max) * 100}%`} />,
    );
    expect(container.querySelector('[data-slot="power-gauge-value"]')?.textContent).toBe("45%");
    expect(screen.getByRole("meter").getAttribute("aria-valuetext")).toBe("45%");
  });

  it("clamps the value to 0…max", () => {
    const { rerender } = render(<PowerGauge label="Power" value={140} />);
    expect(screen.getByRole("meter").getAttribute("aria-valuenow")).toBe("100");
    rerender(<PowerGauge label="Power" value={-5} />);
    expect(screen.getByRole("meter").getAttribute("aria-valuenow")).toBe("0");
  });

  it("forwards className and props, and sets the label in the display face", () => {
    const { container } = render(
      <PowerGauge label="Power" value={10} className="custom-class" id="power" />,
    );
    const gauge = gaugeOf(container) as HTMLElement;
    expect(gauge.classList.contains("custom-class")).toBe(true);
    expect(gauge.id).toBe("power");
    expect(gauge.classList.contains("font-display")).toBe(true);
  });

  it("draws a solid ink fill as wide as the value on a hand-drawn rule", () => {
    const observers = stubResizeObserver();
    const { container } = render(<PowerGauge label="Power" value={70} />);
    const gauge = gaugeOf(container) as HTMLElement;
    expect(gauge.dataset.color).toBe("ink");
    const fill = fillOf(gauge);
    expect(fill.style.width).toBe("70%");
    expect(segmentsOf(gauge)).toHaveLength(0);
    const block = fill.querySelector<HTMLElement>(':scope > [data-slot="ink-frame"]');
    expect(block?.dataset.fill).toBe("ink");
    const track = gauge.querySelector('[data-slot="power-gauge-track"]') as HTMLElement;
    const rule = track.querySelector<HTMLElement>(':scope > [data-slot="ink-frame"]');
    expect(rule?.dataset.shape).toBe("line");
    observers.drawAll(200, 12);
    expect(block?.dataset.inked).toBe("true");
    expect(rule?.dataset.inked).toBe("true");
  });

  it("draws no fill at zero", () => {
    const { container } = render(<PowerGauge label="Power" value={0} />);
    expect(fillOf(gaugeOf(container) as HTMLElement).children).toHaveLength(0);
  });

  it("ends the track with a heavy upright tick, the max marker", () => {
    const { container } = render(<PowerGauge label="Power" value={10} />);
    const marker = container.querySelector<HTMLElement>('[data-slot="power-gauge-max"]');
    expect(marker?.className).toContain("right-0");
    const tick = marker?.querySelector<HTMLElement>('[data-slot="ink-frame"]');
    expect(tick?.dataset.shape).toBe("line");
    expect(tick?.className).toContain("[--outline-width:var(--outline-width-heavy)]");
  });

  it("splits the bar into ink blocks with paper gaps, filling whole blocks only", () => {
    const { container } = render(<PowerGauge label="Stamina" value={69} segments={10} />);
    const gauge = gaugeOf(container) as HTMLElement;
    const fill = fillOf(gauge);
    expect(fill.style.width).toBe("100%");
    expect(fill.classList.contains("gap-1")).toBe(true);
    const segments = segmentsOf(gauge);
    expect(segments).toHaveLength(10);
    expect(segments.map((segment) => segment.dataset.filled)).toEqual([
      ...Array(6).fill("true"),
      ...Array(4).fill("false"),
    ]);
    for (const [index, segment] of segments.entries()) {
      const block = segment.querySelector<HTMLElement>('[data-slot="ink-frame"]');
      expect(block?.dataset.fill ?? null).toBe(index < 6 ? "ink" : null);
    }
  });

  it("fills every block at max", () => {
    const { container } = render(<PowerGauge label="Focus" value={5} max={5} segments={5} />);
    const segments = segmentsOf(gaugeOf(container) as HTMLElement);
    expect(segments.every((segment) => segment.dataset.filled === "true")).toBe(true);
  });

  it("turns the fill spot red for color spot, and only the fill", () => {
    const { container } = render(<PowerGauge label="Power" value={50} color="spot" />);
    const gauge = gaugeOf(container) as HTMLElement;
    expect(gauge.dataset.color).toBe("spot");
    expect(fillOf(gauge).className).toContain("[--ink:var(--spot)]");
    expect(gauge.className).not.toContain("--spot");
  });

  it("has no burst unless asked for", () => {
    const { container } = render(<PowerGauge label="Power" value={100} />);
    expect(container.querySelector('[data-slot="power-gauge-burst"]')).toBeNull();
  });

  it("shows a tilted MAX burst at max", () => {
    const { container } = render(<PowerGauge label="Power" value={100} burst />);
    const gauge = gaugeOf(container) as HTMLElement;
    expect(gauge.dataset.maxed).toBe("true");
    const burst = container.querySelector<HTMLElement>('[data-slot="power-gauge-burst"]');
    expect(burst?.textContent).toBe("MAX");
    expect(burst?.classList.contains("invisible")).toBe(false);
    expect(burst?.style.rotate).toBe("-8deg");
    expect(burst?.dataset.color).toBe("paper");
  });

  it("keeps the burst's room but hides it short of max", () => {
    const { container } = render(<PowerGauge label="Power" value={99} burst />);
    expect(gaugeOf(container)?.dataset.maxed).toBe("false");
    const burst = container.querySelector<HTMLElement>('[data-slot="power-gauge-burst"]');
    expect(burst?.classList.contains("invisible")).toBe(true);
  });

  it("bursts in spot red on a spot gauge", () => {
    const { container } = render(<PowerGauge label="Power" value={100} color="spot" burst />);
    const burst = container.querySelector<HTMLElement>('[data-slot="power-gauge-burst"]');
    expect(burst?.dataset.color).toBe("spot");
  });

  it("renders on the server with the same label id it hydrates with", () => {
    const html = renderToString(<PowerGauge label="Power" value={70} />);
    const labelledBy = /aria-labelledby="([^"]+)"/.exec(html)?.[1];
    expect(labelledBy).toBeTruthy();
    expect(html).toContain(`id="${labelledBy}"`);
  });

  it("gives each gauge in the stat card its own name", () => {
    render(<PowerGaugeStatCardDemo />);
    const meters = screen.getAllByRole("meter");
    expect(new Set(meters.map((meter) => meter.getAttribute("aria-labelledby"))).size).toBe(3);
    for (const name of ["Power", "Speed", "Ink"]) {
      expect(screen.getByRole("meter", { name })).toBeTruthy();
    }
    expect(screen.getByRole("meter", { name: "Ink" }).dataset.maxed).toBe("true");
  });

  expectDemosAccessible(import.meta.glob("./demos/*.tsx"));
});
