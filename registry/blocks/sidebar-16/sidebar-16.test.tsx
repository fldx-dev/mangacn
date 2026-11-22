import { readFileSync } from "node:fs";
import path from "node:path";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { hasUseClientDirective } from "@/lib/registry/client";
import { installedPageSource } from "@/lib/registry/page-source";
import { expectNoA11yViolations, expectVariantsAccessible } from "@/lib/test/axe";
import Page from "./page";

const source = (file: string) => readFileSync(path.join(__dirname, file), "utf8");

const COMPONENTS = [
  "app-sidebar",
  "nav-main",
  "nav-projects",
  "nav-secondary",
  "nav-user",
  "search-form",
  "site-header",
];

// jsdom has no matchMedia, and the sidebar's useIsMobile reads window.innerWidth against it (as
// in registry/ui/sidebar/sidebar.test.tsx).
function stubViewport(width: number) {
  vi.stubGlobal("innerWidth", width);
  vi.stubGlobal("matchMedia", (query: string) => ({
    media: query,
    matches: width < 768,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

beforeEach(() => {
  stubViewport(1280);
  // biome-ignore lint/suspicious/noDocumentCookie: clears the cookie the sidebar writes, between tests.
  document.cookie = "sidebar_state=; path=/; max-age=0";
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const sidebar = () => document.querySelector('[data-slot="sidebar"]') as HTMLElement;
const toggle = () => screen.getByRole("button", { name: "Toggle Sidebar" });

describe("sidebar-16 page", () => {
  it("is a whole page: one banner above the shell, one main with one h1, named navigation", () => {
    render(<Page />);
    const banner = screen.getByRole("banner");
    expect(screen.getAllByRole("banner")).toHaveLength(1);
    const search = within(banner).getByRole("form", { name: "Search the studio" });
    expect(within(search).getByRole("textbox", { name: "Search" })).toBeTruthy();
    const main = screen.getByRole("main");
    expect(main.getAttribute("data-slot")).toBe("sidebar-inset");
    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(within(main).getByRole("heading", { level: 1 }).classList).toContain("font-display");
    // The header comes first in the document, before the sidebar and the main beside it.
    expect(banner.compareDocumentPosition(main) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const navs = screen.getAllByRole("navigation").map((nav) => nav.getAttribute("aria-label"));
    expect(navs).toEqual(["breadcrumb", "Studio"]);
  });

  it("starts the sidebar under the header", () => {
    render(<Page />);
    const container = document.querySelector('[data-slot="sidebar-container"]') as HTMLElement;
    expect(container.className).toContain("top-(--header-height)");
  });

  it("slides the sidebar away with Ctrl+B and with the header's toggle, and opens it again", () => {
    render(<Page />);
    expect(sidebar().getAttribute("data-state")).toBe("expanded");
    act(() => {
      fireEvent.keyDown(window, { key: "b", ctrlKey: true });
    });
    expect(sidebar().getAttribute("data-state")).toBe("collapsed");
    expect(sidebar().getAttribute("data-collapsible")).toBe("offcanvas");
    fireEvent.click(toggle());
    expect(sidebar().getAttribute("data-state")).toBe("expanded");
  });

  it("opens and closes a section by its own chevron: Series open from the start", () => {
    render(<Page />);
    const series = screen.getByRole("button", { name: "Toggle Series" });
    const chapters = screen.getByRole("button", { name: "Toggle Chapters" });
    expect(series.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("link", { name: "Ongoing" })).toBeTruthy();
    expect(chapters.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(chapters);
    expect(chapters.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("link", { name: "Drafts" })).toBeTruthy();
    // The section's own name stays a link.
    expect(screen.getByRole("link", { name: "Series" })).toBeTruthy();
  });

  it("names each series' menu by its series", () => {
    render(<Page />);
    for (const series of ["Moonlit Ronin", "Kitchen Spirits", "Starboard Academy"]) {
      expect(screen.getByRole("button", { name: `More for ${series}` })).toBeTruthy();
    }
  });

  it("shows the editor's initials while there is no photo", () => {
    render(<Page />);
    const user = screen.getByRole("button", { name: /Hana Mori/ });
    expect(user.querySelector('[data-slot="avatar-fallback"]')?.textContent).toBe("HM");
    expect(user.querySelector("img")).toBeNull();
  });

  it("is a phone's sheet below 768 px, closed until the header's toggle opens it", async () => {
    stubViewport(360);
    render(<Page />);
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(toggle());
    const sheet = await screen.findByRole("dialog", { name: "Sidebar" });
    expect(within(sheet).getByRole("link", { name: /Inkpot Studio/ })).toBeTruthy();
  });

  it("has no axe violations as a whole page", async () => {
    await expectNoA11yViolations(<Page />);
  });
});

describe("sidebar-16 files", () => {
  it("draws nothing of its own: no SVG, border, shadow or spot classes", () => {
    for (const file of ["page.tsx", ...COMPONENTS.map((name) => `components/${name}.tsx`)]) {
      expect(source(file), file).not.toMatch(/<svg|shadow-|border|text-spot|gradient/);
    }
  });

  it("keeps stock's client boundary and exports: a server page, client components", () => {
    expect(hasUseClientDirective(source("page.tsx"))).toBe(false);
    expect(source("page.tsx")).toContain('export const iframeHeight = "800px"');
    for (const name of COMPONENTS) {
      expect(hasUseClientDirective(source(`components/${name}.tsx`)), name).toBe(true);
    }
  });

  it("imports its components relatively, installed at their install paths", () => {
    expect(source("page.tsx")).toContain('from "./components/app-sidebar"');
    expect(source("page.tsx")).toContain('from "./components/site-header"');
    const installed = installedPageSource("sidebar-16");
    expect(installed).toContain('from "@/components/app-sidebar"');
    expect(installed).toContain('from "@/components/site-header"');
    expect(source("components/site-header.tsx")).toContain('from "./search-form"');
  });

  expectVariantsAccessible(import.meta.glob("./variants/*.tsx"));
});
