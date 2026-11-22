import { readFileSync } from "node:fs";
import path from "node:path";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { hasUseClientDirective } from "@/lib/registry/client";
import { installedPageSource } from "@/lib/registry/page-source";
import { expectNoA11yViolations, expectVariantsAccessible } from "@/lib/test/axe";
import Page from "./page";

const source = (file: string) => readFileSync(path.join(__dirname, file), "utf8");

const COMPONENTS = ["app-sidebar", "nav-main", "sidebar-opt-in-form"];

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
/** The header's trigger; the rail on the sidebar's edge shares its name but not the tab order. */
const trigger = () => document.querySelector('[data-slot="sidebar-trigger"]') as HTMLElement;

describe("sidebar-06 page", () => {
  it("is a whole page: one main with one h1, the sidebar and the breadcrumb named navigation", () => {
    render(<Page />);
    const main = screen.getByRole("main");
    expect(main.getAttribute("data-slot")).toBe("sidebar-inset");
    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(within(main).getByRole("heading", { level: 1 }).classList).toContain("font-display");
    const navs = screen.getAllByRole("navigation").map((nav) => nav.getAttribute("aria-label"));
    expect(navs).toEqual(["Handbook", "breadcrumb"]);
  });

  it("slides away with Ctrl+B and with the trigger, and comes back", () => {
    render(<Page />);
    expect(sidebar().getAttribute("data-state")).toBe("expanded");
    act(() => {
      fireEvent.keyDown(window, { key: "b", ctrlKey: true });
    });
    expect(sidebar().getAttribute("data-state")).toBe("collapsed");
    expect(sidebar().getAttribute("data-collapsible")).toBe("offcanvas");
    fireEvent.click(trigger());
    expect(sidebar().getAttribute("data-state")).toBe("expanded");
  });

  it("opens each section's pages as a menu", async () => {
    render(<Page />);
    const nav = screen.getByRole("navigation", { name: "Handbook" });
    expect(within(nav).queryByRole("link", { name: "Thumbnails" })).toBeNull();
    fireEvent.click(within(nav).getByRole("button", { name: "Make a chapter" }));
    const menu = await screen.findByRole("menu");
    const thumbnails = within(menu).getByRole("menuitem", { name: "Thumbnails" });
    expect(thumbnails.tagName).toBe("A");
    expect(within(menu).getAllByRole("menuitem")).toHaveLength(12);
  });

  it("signs up for the studio letter in a card at the sidebar's foot", () => {
    render(<Page />);
    const footer = document.querySelector('[data-slot="sidebar-footer"]') as HTMLElement;
    const card = footer.querySelector('[data-slot="card"]') as HTMLElement;
    expect(within(card).getByText("Get the studio letter")).toBeTruthy();
    expect(within(card).getByRole("form", { name: "Get the studio letter" })).toBeTruthy();
    expect(within(card).getByPlaceholderText("Email").getAttribute("type")).toBe("email");
    expect(within(card).getByRole("button", { name: "Subscribe" })).toBeTruthy();
  });

  it("is a phone's sheet below 768 px, closed until the trigger opens it", async () => {
    stubViewport(360);
    render(<Page />);
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(trigger());
    const sheet = await screen.findByRole("dialog", { name: "Sidebar" });
    expect(within(sheet).getByRole("button", { name: "Make a chapter" })).toBeTruthy();
  });

  it("has no axe violations as a whole page", async () => {
    await expectNoA11yViolations(<Page />);
  });
});

describe("sidebar-06 files", () => {
  it("draws nothing of its own: no SVG, border, grey box, shadow or spot classes", () => {
    for (const file of ["page.tsx", ...COMPONENTS.map((name) => `components/${name}.tsx`)]) {
      expect(source(file), file).not.toMatch(
        /<svg|shadow-|border|bg-muted\/50|bg-sidebar-primary|text-spot|gradient/,
      );
    }
  });

  it("keeps stock's client boundary: no directive on the page or opt-in form, client sidebar and menus", () => {
    expect(hasUseClientDirective(source("page.tsx"))).toBe(false);
    expect(hasUseClientDirective(source("components/sidebar-opt-in-form.tsx"))).toBe(false);
    for (const name of ["app-sidebar", "nav-main"]) {
      expect(hasUseClientDirective(source(`components/${name}.tsx`)), name).toBe(true);
    }
  });

  it("imports app-sidebar relatively, installed at its install path; the parts relatively", () => {
    expect(source("page.tsx")).toContain('from "./components/app-sidebar"');
    expect(installedPageSource("sidebar-06")).toContain('from "@/components/app-sidebar"');
    const appSidebar = source("components/app-sidebar.tsx");
    for (const name of COMPONENTS.slice(1)) {
      expect(appSidebar).toMatch(new RegExp(`from "\\./${name}"`));
    }
  });

  expectVariantsAccessible(import.meta.glob("./variants/*.tsx"));
});
