import { readFileSync } from "node:fs";
import path from "node:path";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { hasUseClientDirective } from "@/lib/registry/client";
import { installedPageSource } from "@/lib/registry/page-source";
import { expectNoA11yViolations, expectVariantsAccessible } from "@/lib/test/axe";
import Page from "./page";

const source = (file: string) => readFileSync(path.join(__dirname, file), "utf8");

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

describe("sidebar-04 page", () => {
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

  it("lists each section's pages in a submenu, Thumbnails the current page", () => {
    render(<Page />);
    const nav = screen.getByRole("navigation", { name: "Handbook" });
    expect(within(nav).getByRole("link", { name: /Studio Handbook/ })).toBeTruthy();
    const subs = nav.querySelectorAll('[data-slot="sidebar-menu-sub"]');
    expect(subs).toHaveLength(5);
    const chapter = within(nav).getByRole("link", { name: "Make a chapter" });
    const pages = chapter.closest("li")?.querySelector('[data-slot="sidebar-menu-sub"]');
    expect(within(pages as HTMLElement).getAllByRole("link")).toHaveLength(12);
    expect(within(nav).getByRole("link", { name: "Thumbnails" }).hasAttribute("data-active")).toBe(
      true,
    );
  });

  it("floats 19rem wide, as stock's: a card off the page's edge, submenus without a guide rule", () => {
    render(<Page />);
    expect(sidebar().getAttribute("data-variant")).toBe("floating");
    const wrapper = document.querySelector('[data-slot="sidebar-wrapper"]') as HTMLElement;
    expect(wrapper.style.getPropertyValue("--sidebar-width")).toBe("19rem");
    expect(document.querySelector('[data-slot="sidebar-rail"]')).toBeNull();
    for (const sub of document.querySelectorAll('[data-slot="sidebar-menu-sub"]')) {
      expect(sub.className).toContain("[&>[data-slot=ink-frame]]:hidden");
    }
  });

  it("is a phone's sheet below 768 px, closed until the trigger opens it", async () => {
    stubViewport(360);
    render(<Page />);
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(trigger());
    const sheet = await screen.findByRole("dialog", { name: "Sidebar" });
    expect(within(sheet).getByRole("link", { name: "Thumbnails" })).toBeTruthy();
  });

  it("has no axe violations as a whole page", async () => {
    await expectNoA11yViolations(<Page />);
  });
});

describe("sidebar-04 files", () => {
  it("draws nothing of its own: no SVG, border, fill, shadow or spot classes", () => {
    for (const file of ["page.tsx", "components/app-sidebar.tsx"]) {
      expect(source(file), file).not.toMatch(/<svg|shadow-|border|bg-|text-spot|gradient/);
    }
  });

  it("keeps stock's client boundary: a server page, a client app-sidebar", () => {
    expect(hasUseClientDirective(source("page.tsx"))).toBe(false);
    expect(hasUseClientDirective(source("components/app-sidebar.tsx"))).toBe(true);
  });

  it("imports app-sidebar relatively, installed at its install path", () => {
    expect(source("page.tsx")).toContain('from "./components/app-sidebar"');
    expect(installedPageSource("sidebar-04")).toContain('from "@/components/app-sidebar"');
  });

  expectVariantsAccessible(import.meta.glob("./variants/*.tsx"));
});
