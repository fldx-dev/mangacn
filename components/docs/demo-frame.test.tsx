import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { axe, expectNoA11yViolations } from "@/lib/test/axe";
import { stubResizeObserver } from "@/lib/test/resize-observer";
import { DemoFrame } from "./demo-frame";

// `cacheLife` only runs inside a Next.js "use cache" scope; Vitest ignores the directive.
vi.mock("next/cache", () => ({ cacheLife: () => {} }));

beforeEach(() => {
  stubResizeObserver();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  document.documentElement.classList.remove("dark");
});

describe("DemoFrame", () => {
  it("renders an inline demo in the Preview tab, with a link to its stage", async () => {
    const { container } = render(await DemoFrame({ item: "speech-bubble", demo: "tails" }));
    expect(screen.getByRole("tab", { name: "Preview" })).toHaveProperty("ariaSelected", "true");
    // Three shapes × seven tails, drawn in the page itself rather than an iframe.
    expect(container.querySelectorAll('[data-slot="speech-bubble"]')).toHaveLength(21);
    expect(container.querySelector("iframe")).toBeNull();
    expect(screen.getByRole("link", { name: "Open stage: speech-bubble / tails" })).toHaveProperty(
      "pathname",
      "/demo/speech-bubble/tails",
    );
  });

  it("shows the demo source with the install import in the Code tab", async () => {
    const { container } = render(await DemoFrame({ item: "speech-bubble", demo: "tails" }));
    fireEvent.mouseDown(screen.getByRole("tab", { name: "Code" }));
    const code = container.querySelector("pre")?.textContent ?? "";
    expect(code).toContain('import { SpeechBubble } from "@/components/ui/speech-bubble";');
    expect(code).not.toContain("@/registry/");
  });

  it("renders an overlay item as a titled iframe of its stage", async () => {
    render(await DemoFrame({ item: "dialog", demo: "default", height: "20rem" }));
    const frame = screen.getByTitle("dialog / default");
    expect(frame.tagName).toBe("IFRAME");
    expect(frame.getAttribute("src")).toBe("/demo/dialog/default");
    expect(frame.style.height).toBe("20rem");
  });

  it("follows the site theme in the iframe", async () => {
    document.documentElement.classList.add("dark");
    render(await DemoFrame({ item: "sheet", demo: "default", title: "A sheet" }));
    const frame = screen.getByTitle("A sheet");
    expect(frame.getAttribute("src")).toBe("/demo/sheet/default?mode=dark");

    await act(async () => {
      document.documentElement.classList.remove("dark");
      // MutationObserver callbacks run as microtasks.
      await Promise.resolve();
    });
    expect(frame.getAttribute("src")).toBe("/demo/sheet/default");
  });

  it("throws on an unknown demo or item", async () => {
    await expect(DemoFrame({ item: "speech-bubble", demo: "nope" })).rejects.toThrow(
      /Unknown demo "nope" for item "speech-bubble"/,
    );
    await expect(DemoFrame({ item: "nope", demo: "default" })).rejects.toThrow(
      /Unknown item "nope"/,
    );
  });

  it("has no axe violations, inline and as an iframe", async () => {
    await expectNoA11yViolations(await DemoFrame({ item: "speech-bubble", demo: "tails" }));
    // axe cannot message into a jsdom iframe; the stage inside has its own axe checks.
    const { baseElement } = render(await DemoFrame({ item: "tooltip", demo: "default" }));
    expect(await axe(baseElement, { iframes: false })).toHaveNoViolations();
  });
});
