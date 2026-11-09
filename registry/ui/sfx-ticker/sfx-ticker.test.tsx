import { cleanup, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { expectDemosAccessible } from "@/lib/test/axe";
import SfxTickerDefaultDemo from "./demos/default";
import { SfxTicker } from "./sfx-ticker";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

/** Stubs `prefers-reduced-motion` (jsdom has no matchMedia). */
function stubReducedMotion(reduce: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: reduce && query.includes("reduce"),
    media: query,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
  }));
}

const tickerOf = (root: ParentNode) =>
  root.querySelector<HTMLElement>('[data-slot="sfx-ticker"]') as HTMLElement;
const trackOf = (root: ParentNode) =>
  root.querySelector<HTMLElement>('[data-slot="sfx-ticker-track"]') as HTMLElement;
const animationOf = (track: HTMLElement) =>
  [...track.classList].find((name) => name.includes("mangacn-marquee"));

describe("SfxTicker", () => {
  it("renders the words twice, as sfx-text, for a seamless loop", () => {
    stubReducedMotion(false);
    const { container } = render(<SfxTicker className="custom-class" words={["DON!", "BAM!"]} />);
    const ticker = tickerOf(container);
    expect(ticker.classList.contains("custom-class")).toBe(true);
    expect(ticker.classList.contains("overflow-hidden")).toBe(true);
    const groups = ticker.querySelectorAll('[data-slot="sfx-ticker-group"]');
    expect(groups).toHaveLength(2);
    for (const group of groups) {
      const words = [...group.querySelectorAll<HTMLElement>('[data-slot="sfx-text"]')];
      expect(words.map((word) => word.textContent)).toEqual(["DON!", "BAM!"]);
    }
    expect(groups[0].innerHTML).toBe(groups[1].innerHTML);
  });

  it("tilts the words alternately", () => {
    stubReducedMotion(false);
    const { container } = render(<SfxTicker words={["A", "B", "C"]} />);
    const group = container.querySelector('[data-slot="sfx-ticker-group"]') as HTMLElement;
    const rotations = [...group.querySelectorAll<HTMLElement>('[data-slot="sfx-text"]')].map(
      (word) => word.style.rotate,
    );
    expect(rotations).toEqual(["-5deg", "5deg", "-5deg"]);
  });

  it("colours words with the band colour unless a word brings its own, and keeps lang", () => {
    stubReducedMotion(false);
    const { container } = render(
      <SfxTicker
        words={["DON!", { text: "BAM!", color: "spot" }, { text: "ドン", lang: "ja" }]}
        color="paper"
      />,
    );
    const words = [
      ...(container.querySelector('[data-slot="sfx-ticker-group"]') as HTMLElement).children,
    ] as HTMLElement[];
    expect(words.map((word) => word.dataset.color)).toEqual(["paper", "spot", "paper"]);
    expect(words[2].getAttribute("lang")).toBe("ja");
    expect(words[0].hasAttribute("lang")).toBe(false);
  });

  it("defaults to ink words, normal speed, travelling left", () => {
    stubReducedMotion(false);
    const { container } = render(<SfxTicker words={["DON!"]} />);
    const ticker = tickerOf(container);
    expect(ticker.dataset.speed).toBe("normal");
    expect(ticker.dataset.direction).toBe("left");
    expect(ticker.querySelector<HTMLElement>('[data-slot="sfx-text"]')?.dataset.color).toBe("ink");
    const track = trackOf(container);
    expect(track.classList.contains("[--sfx-ticker-duration:40s]")).toBe(true);
    expect(animationOf(track)).toBe(
      "motion-safe:animate-[mangacn-marquee_var(--sfx-ticker-duration)_linear_infinite]",
    );
    expect(track.classList.contains("hover:[animation-play-state:paused]")).toBe(true);
  });

  it.each([
    ["slow", "60s"],
    ["normal", "40s"],
    ["fast", "20s"],
  ] as const)("sets the %s speed", (speed, duration) => {
    stubReducedMotion(false);
    const { container } = render(<SfxTicker words={["DON!"]} speed={speed} />);
    expect(tickerOf(container).dataset.speed).toBe(speed);
    expect(trackOf(container).classList.contains(`[--sfx-ticker-duration:${duration}]`)).toBe(true);
  });

  it("sets the words at the md size by default", () => {
    stubReducedMotion(false);
    const { container } = render(<SfxTicker words={["DON!", "BAM!"]} />);
    expect(tickerOf(container).dataset.size).toBe("md");
    const words = [...container.querySelectorAll<HTMLElement>('[data-slot="sfx-text"]')];
    expect(words.map((word) => word.dataset.size)).toEqual(["md", "md", "md", "md"]);
  });

  it.each([
    ["sm", "text-2xl"],
    ["md", "text-4xl"],
    ["lg", "text-5xl"],
  ] as const)("maps size %s to sfx-text's size, each group still a viewport wide", (size, text) => {
    stubReducedMotion(false);
    const { container } = render(<SfxTicker words={["DON!"]} size={size} />);
    expect(tickerOf(container).dataset.size).toBe(size);
    for (const word of container.querySelectorAll<HTMLElement>('[data-slot="sfx-text"]')) {
      expect(word.dataset.size).toBe(size);
      expect(word.classList.contains(text)).toBe(true);
    }
    const groups = container.querySelectorAll('[data-slot="sfx-ticker-group"]');
    expect(groups).toHaveLength(2);
    for (const group of groups) expect(group.classList.contains("min-w-screen")).toBe(true);
  });

  it("reverses the animation for direction right", () => {
    stubReducedMotion(false);
    const { container } = render(<SfxTicker words={["DON!"]} direction="right" />);
    expect(tickerOf(container).dataset.direction).toBe("right");
    expect(animationOf(trackOf(container))).toMatch(/_linear_infinite_reverse\]$/);
  });

  it("hides the whole band from assistive tech without a label", () => {
    stubReducedMotion(false);
    const { container } = render(<SfxTicker words={["DON!"]} />);
    expect(tickerOf(container).getAttribute("aria-hidden")).toBe("true");
    expect(container.querySelector('[data-slot="sfx-ticker-label"]')).toBeNull();
  });

  it("with a label, reads the label and the words once, still hiding the moving track", () => {
    stubReducedMotion(false);
    const { container } = render(
      <SfxTicker label="Fight sounds" words={["POW!", { text: "ドン", lang: "ja" }]} />,
    );
    const ticker = tickerOf(container);
    expect(ticker.hasAttribute("aria-hidden")).toBe(false);
    expect(trackOf(container).getAttribute("aria-hidden")).toBe("true");
    const label = screen.getByText(/Fight sounds/);
    expect(label.dataset.slot).toBe("sfx-ticker-label");
    expect(label.classList.contains("sr-only")).toBe(true);
    expect(label.textContent).toBe("Fight sounds: POW!, ドン");
    expect(label.querySelector('[lang="ja"]')?.textContent).toBe("ドン");
  });

  it("server-renders the motion-safe animation class (CSS holds it still under reduced motion)", () => {
    const html = renderToString(<SfxTicker words={["DON!"]} />);
    expect(html).toContain("motion-safe:animate-[mangacn-marquee");
    expect(html).toContain('data-animated="true"');
  });

  it("marks every Japanese word in the default demo", () => {
    stubReducedMotion(false);
    const { container } = render(<SfxTickerDefaultDemo />);
    const words = [...container.querySelectorAll<HTMLElement>('[data-slot="sfx-text"]')];
    expect(words).toHaveLength(16);
    for (const word of words) {
      if (/[぀-ヿ]/.test(word.textContent ?? "")) expect(word.getAttribute("lang")).toBe("ja");
    }
  });

  expectDemosAccessible(import.meta.glob("./demos/*.tsx"), {
    setup: () => stubReducedMotion(false),
  });
});

describe("SfxTicker under reduced motion", () => {
  it("drops the animation class while the user prefers reduced motion", () => {
    stubReducedMotion(true);
    const { container } = render(<SfxTicker words={["DON!", "BAM!"]} direction="right" />);
    const track = trackOf(container);
    expect(animationOf(track)).toBeUndefined();
    expect([...track.classList].some((name) => name.includes("animate"))).toBe(false);
    expect(tickerOf(container).dataset.animated).toBe("false");
    // The words are still there, standing still.
    expect(track.querySelectorAll('[data-slot="sfx-text"]')).toHaveLength(4);
  });
});
