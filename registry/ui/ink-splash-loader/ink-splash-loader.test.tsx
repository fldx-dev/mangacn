import { cleanup, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { expectNoA11yViolations } from "@/lib/test/axe";
import InkSplashLoaderDefaultDemo from "./demos/default";
import { InkSplashLoader } from "./ink-splash-loader";

// motion reads `prefers-reduced-motion` through matchMedia (missing in jsdom) once, on first
// use, and caches it for the module; so the whole file runs with reduced motion.
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

describe("InkSplashLoader", () => {
  it("is a polite status with a visually hidden Loading label", () => {
    render(<InkSplashLoader className="custom-class" />);
    const status = screen.getByRole("status", { name: "" });
    expect(status.dataset.slot).toBe("ink-splash-loader");
    expect(status.getAttribute("aria-live")).toBe("polite");
    expect(status.classList.contains("custom-class")).toBe(true);
    const label = screen.getByText("Loading");
    expect(label.classList.contains("sr-only")).toBe(true);
    expect(status.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
  });

  it("announces a custom label", () => {
    render(<InkSplashLoader label="Inking page 3" />);
    expect(screen.getByRole("status").textContent).toBe("Inking page 3");
  });

  it.each([
    ["sm", "size-6"],
    ["md", "size-10"],
    ["lg", "size-16"],
  ] as const)("maps size %s to %s", (size, name) => {
    render(<InkSplashLoader size={size} />);
    const status = screen.getByRole("status");
    expect(status.dataset.size).toBe(size);
    expect(status.classList.contains(name)).toBe(true);
  });

  it("renders a still blot on the server", () => {
    const html = renderToString(<InkSplashLoader />);
    expect(html).toContain('role="status"');
    expect(html).toContain("Loading");
    expect(html).not.toMatch(/transform:\s*scale\((?!1\))/);
  });

  it("keeps the blot still under reduced motion", async () => {
    render(<InkSplashLoader />);
    const blot = screen.getByRole("status").querySelector("path") as SVGPathElement;
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(blot.style.transform, blot.getAttribute("style") ?? "").toMatch(/^(none)?$/);
  });

  it("has no axe violations in its default demo", async () => {
    await expectNoA11yViolations(<InkSplashLoaderDefaultDemo />);
  });
});
