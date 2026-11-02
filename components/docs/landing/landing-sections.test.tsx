import { cleanup, render, screen } from "@testing-library/react";
import { FrameworkProvider } from "fumadocs-core/framework";
import { HomeLayout } from "fumadocs-ui/layouts/home";
import { RootProvider } from "fumadocs-ui/provider/base";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { baseOptions } from "@/lib/docs/layout.shared";
import { axe } from "@/lib/test/axe";
import { stubResizeObserver } from "@/lib/test/resize-observer";
import { LandingSections } from "./landing-sections";

beforeEach(() => {
  stubResizeObserver();
  // next-themes reads the colour scheme; jsdom has no matchMedia.
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: false,
    media: query,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
  }));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

vi.setConfig({ testTimeout: 30_000 });

// As app/(site)/layout.tsx and page.tsx compose it, with the framework hooks stubbed (the
// Next.js provider imports `next/navigation`, which Node cannot resolve outside Next).
const framework = {
  usePathname: () => "/",
  useParams: () => ({}),
  useRouter: () => ({ push: () => {}, refresh: () => {} }),
};

function renderLanding() {
  return render(
    <FrameworkProvider {...framework}>
      <RootProvider>
        <HomeLayout {...baseOptions()}>
          <LandingSections />
        </HomeLayout>
      </RootProvider>
    </FrameworkProvider>,
  );
}

describe("the landing", () => {
  it("has its sections in order under the navbar, the footer last", () => {
    const { container } = renderLanding();
    const main = container.querySelector("main");
    expect(main?.querySelector("header")?.textContent).toContain("mangacn");
    const sections = [...(main?.querySelectorAll<HTMLElement>("[data-landing]") ?? [])];
    expect(sections.map((section) => section.dataset.landing)).toEqual([
      "hero",
      "sfx-band",
      "swap-import",
      "bento",
      "mode-split",
      "whole-page",
      "three-commands",
      "agent-ready",
      "footer",
    ]);
    expect(sections.at(-1)?.tagName).toBe("FOOTER");
  });

  it("has one h1, h2 per section and no iframes", () => {
    const { container } = renderLanding();
    expect(container.querySelectorAll("h1")).toHaveLength(1);
    expect(container.querySelector("h1")?.id).toBe("landing-hero");
    expect([...container.querySelectorAll('h2[id^="landing-"]')].map((h) => h.id)).toEqual([
      "landing-swap",
      "landing-bento",
      "landing-modes",
      "landing-page",
      "landing-commands",
      "landing-agents",
    ]);
    expect(container.querySelector("iframe")).toBeNull();
  });

  it("marks Japanese text and hides the decorative band", () => {
    const { container } = renderLanding();
    const band = container.querySelector('[data-landing="sfx-band"]');
    expect(band?.getAttribute("aria-hidden")).toBe("true");
    for (const node of container.querySelectorAll("[data-landing] *")) {
      const text = node.textContent ?? "";
      if (/[぀-ヿ一-鿿]/.test(text) && node.children.length === 0) {
        expect(node.closest("[lang='ja']"), text).not.toBeNull();
      }
    }
  });

  it("swaps the stock card for the drawn one", async () => {
    const { container } = renderLanding();
    const toggle = container.querySelector('[data-slot="swap-toggle"]');
    const stock = toggle?.querySelector('[data-slot="stock-card"]')?.parentElement;
    expect(stock?.hidden).toBe(true);
    screen.getByRole("switch", { name: "Draw with mangacn" }).click();
    await vi.waitFor(() => expect(stock?.hidden).toBe(false));
  });

  it("has no axe violations", async () => {
    const { container } = renderLanding();
    expect(await axe(container)).toHaveNoViolations();
  });
});
