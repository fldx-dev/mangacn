import { cleanup, render } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { PowerGauge } from "./power-gauge";

// motion reads `prefers-reduced-motion` through matchMedia (missing in jsdom) once, on first
// use, and caches it for the module; so this file runs with reduced motion throughout, and
// power-gauge.test.tsx without it.
beforeAll(() => {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query.includes("reduce"),
    media: query,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
  }));
});

afterAll(() => {
  vi.unstubAllGlobals();
});

afterEach(cleanup);

describe("PowerGauge under reduced motion", () => {
  it("shows the burst at rest at once when the gauge fills after mount", async () => {
    const { container, rerender } = render(<PowerGauge label="Power" value={60} burst />);
    rerender(<PowerGauge label="Power" value={100} burst />);
    const burst = container.querySelector<HTMLElement>('[data-slot="power-gauge-burst"]');
    const word = burst?.firstElementChild as HTMLElement;
    // One frame, far less than the spring takes to settle.
    await new Promise((resolve) => requestAnimationFrame(resolve));
    await vi.waitFor(() => expect(word.style.opacity).toBe("1"), { timeout: 50 });
    expect(word.style.transform === "" || word.style.transform === "none").toBe(true);
  });
});
