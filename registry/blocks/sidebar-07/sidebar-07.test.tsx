import { readFileSync } from "node:fs";
import path from "node:path";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { hasUseClientDirective } from "@/lib/registry/client";
import { expectDemosAccessible, expectNoA11yViolations } from "@/lib/test/axe";
import Page from "./page";

const source = (file: string) => readFileSync(path.join(__dirname, file), "utf8");

const COMPONENTS = ["app-sidebar", "nav-main", "nav-projects", "nav-user", "team-switcher"];

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

describe("sidebar-07 page", () => {
  it("is a whole page: one main with one h1, the sidebar and the breadcrumb named navigation", () => {
    render(<Page />);
    const main = screen.getByRole("main");
    expect(main.getAttribute("data-slot")).toBe("sidebar-inset");
    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(within(main).getByRole("heading", { level: 1 }).classList).toContain("font-display");
    const navs = screen.getAllByRole("navigation").map((nav) => nav.getAttribute("aria-label"));
    expect(navs).toEqual(["Studio", "breadcrumb"]);
  });

  it("collapses to icons with Ctrl+B and with the trigger, and opens again", () => {
    render(<Page />);
    expect(sidebar().getAttribute("data-state")).toBe("expanded");
    act(() => {
      fireEvent.keyDown(window, { key: "b", ctrlKey: true });
    });
    expect(sidebar().getAttribute("data-state")).toBe("collapsed");
    expect(sidebar().getAttribute("data-collapsible")).toBe("icon");
    fireEvent.click(trigger());
    expect(sidebar().getAttribute("data-state")).toBe("expanded");
  });

  it("opens and closes a section: Series open from the start, Chapters closed", () => {
    render(<Page />);
    const series = screen.getByRole("button", { name: "Series" });
    const chapters = screen.getByRole("button", { name: "Chapters" });
    expect(series.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("link", { name: "Ongoing" })).toBeTruthy();
    expect(chapters.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(chapters);
    expect(chapters.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("link", { name: "Drafts" })).toBeTruthy();
    fireEvent.click(series);
    expect(series.getAttribute("aria-expanded")).toBe("false");
  });

  it("switches the studio from the team menu", async () => {
    render(<Page />);
    const trigger = screen.getByRole("button", { name: /Inkpot Studio/ });
    fireEvent.click(trigger);
    const menu = await screen.findByRole("menu");
    fireEvent.click(within(menu).getByRole("menuitem", { name: /Night Owl Press/ }));
    expect(await screen.findByRole("button", { name: /Night Owl Press/ })).toBeTruthy();
  });

  it("shows the editor's initials while there is no photo", () => {
    render(<Page />);
    const user = screen.getByRole("button", { name: /Hana Mori/ });
    expect(user.querySelector('[data-slot="avatar-fallback"]')?.textContent).toBe("HM");
    expect(user.querySelector("img")).toBeNull();
  });

  it("names each series' menu by its series", () => {
    render(<Page />);
    for (const series of ["Moonlit Ronin", "Kitchen Spirits", "Starboard Academy"]) {
      expect(screen.getByRole("button", { name: `More for ${series}` })).toBeTruthy();
    }
  });

  it("is a phone's sheet below 768 px, closed until the trigger opens it", async () => {
    stubViewport(360);
    render(<Page />);
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(trigger());
    const sheet = await screen.findByRole("dialog", { name: "Sidebar" });
    expect(within(sheet).getByRole("button", { name: /Inkpot Studio/ })).toBeTruthy();
  });

  it("has no axe violations as a whole page", async () => {
    await expectNoA11yViolations(<Page />);
  });
});

describe("sidebar-07 files", () => {
  it("draws nothing of its own: no SVG, border, fill, shadow or spot classes", () => {
    for (const file of ["page.tsx", ...COMPONENTS.map((name) => `components/${name}.tsx`)]) {
      expect(source(file), file).not.toMatch(/<svg|shadow-|border|bg-|text-spot|gradient/);
    }
  });

  it("keeps stock's client boundary: a server page, client components", () => {
    expect(hasUseClientDirective(source("page.tsx"))).toBe(false);
    for (const name of COMPONENTS) {
      expect(hasUseClientDirective(source(`components/${name}.tsx`)), name).toBe(true);
    }
  });

  it("imports app-sidebar from its install path, and the parts beside it relatively", () => {
    expect(source("page.tsx")).toContain('from "@/components/app-sidebar"');
    const appSidebar = source("components/app-sidebar.tsx");
    for (const name of COMPONENTS.slice(1)) {
      expect(appSidebar).toMatch(new RegExp(`from "\\./${name}"`));
    }
  });

  expectDemosAccessible(import.meta.glob("./demos/*.tsx"));
});
