import { cleanup, render, screen } from "@testing-library/react";
import { FrameworkProvider } from "fumadocs-core/framework";
import { HomeLayout } from "fumadocs-ui/layouts/home";
import { RootProvider } from "fumadocs-ui/provider/base";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { baseOptions } from "@/lib/docs/layout.shared";
import { axe } from "@/lib/test/axe";
import { stubResizeObserver } from "@/lib/test/resize-observer";
import { landingCatalog } from "./catalog";
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

// The page renders every non-overlay default demo; the first import of them is slow.
vi.setConfig({ testTimeout: 30_000 });

// As app/(site)/layout.tsx and page.tsx compose it, with the framework hooks stubbed (the
// Next.js provider imports `next/navigation`, which Node cannot resolve outside Next). The page
// itself renders LandingSections as an async element, which only the server can.
const framework = {
  usePathname: () => "/",
  useParams: () => ({}),
  useRouter: () => ({ push: () => {}, refresh: () => {} }),
};

async function renderLanding() {
  const sections = await LandingSections();
  return render(
    <FrameworkProvider {...framework}>
      <RootProvider>
        <HomeLayout {...baseOptions()}>{sections}</HomeLayout>
      </RootProvider>
    </FrameworkProvider>,
  );
}

describe("the landing", () => {
  it("has the ten sections in order, the navbar first", async () => {
    const { container } = await renderLanding();
    const main = container.querySelector("main");
    const nav = main?.querySelector("header");
    expect(nav?.textContent).toContain("mangacn");
    const sections = [...(main?.querySelectorAll<HTMLElement>("[data-landing]") ?? [])];
    expect(["nav", ...sections.map((section) => section.dataset.landing)]).toEqual([
      "nav",
      "hero",
      "three-commands",
      "component-wall",
      "any-app",
      "why",
      "theme",
      "whole-page",
      "agent-ready",
      "footer",
    ]);
    // The navbar precedes every section in document order.
    expect(
      nav &&
        sections[0] &&
        nav.compareDocumentPosition(sections[0]) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(sections.at(-1)?.tagName).toBe("FOOTER");
  });

  it("reads its counts from the catalog", async () => {
    const { items, primitives } = landingCatalog();
    await renderLanding();
    expect(
      screen.getByRole("heading", { name: `${items.length} items. Two kinds.` }),
    ).not.toBeNull();
    expect(screen.getByRole("link", { name: `All ${items.length} →` })).not.toBeNull();
    expect(screen.getByRole("tab", { name: `Primitives ${primitives}` })).not.toBeNull();
    expect(screen.getByText(new RegExp(`^The ${primitives} restyled primitives`))).not.toBeNull();
    expect(
      screen.getByText(new RegExp(`^The ${primitives} primitives keep shadcn`)),
    ).not.toBeNull();
  });

  it("has one h1 and section headings at h2, with no iframes", async () => {
    const { container } = await renderLanding();
    expect(container.querySelectorAll("h1")).toHaveLength(1);
    expect(container.querySelector("h1")?.id).toBe("landing-hero");
    const headings = [...container.querySelectorAll('h2[id^="landing-"]')].map((h) => h.id);
    expect(headings).toEqual([
      "landing-commands",
      "landing-wall",
      "landing-any-app",
      "landing-why",
      "landing-theme",
      "landing-page",
      "landing-agents",
    ]);
    expect(container.querySelector("iframe")).toBeNull();
  });

  it("has no axe violations", async () => {
    const { container } = await renderLanding();
    expect(await axe(container)).toHaveNoViolations();
  });
});
