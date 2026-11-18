import { readFileSync } from "node:fs";
import path from "node:path";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { hasUseClientDirective } from "@/lib/registry/client";
import { installedPageSource } from "@/lib/registry/page-source";
import { expectDemosAccessible, expectNoA11yViolations } from "@/lib/test/axe";
import Page from "./page";

const source = (file: string) => readFileSync(path.join(__dirname, file), "utf8");

const COMPONENTS = ["app-sidebar", "calendars", "date-picker", "nav-user"];
/** Stock's client files; date-picker has no directive in stock and runs inside app-sidebar's. */
const CLIENT = ["app-sidebar", "calendars", "nav-user"];

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
/** The day button for `day` of the sample month, by its accessible name ("October 12, 2026"). */
const day = (n: number) => screen.getByRole("button", { name: new RegExp(`October ${n}, 2026`) });
/** The header's trigger; the rail on the sidebar's edge shares its name but not the tab order. */
const trigger = () => document.querySelector('[data-slot="sidebar-trigger"]') as HTMLElement;

describe("sidebar-12 page", () => {
  it("is a whole page: one main with one h1, the sidebar and the breadcrumb named navigation", () => {
    render(<Page />);
    const main = screen.getByRole("main");
    expect(main.getAttribute("data-slot")).toBe("sidebar-inset");
    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(within(main).getByRole("heading", { level: 1 }).classList).toContain("font-display");
    const navs = screen.getAllByRole("navigation").map((nav) => nav.getAttribute("aria-label"));
    // The calendar's month navigation is the library's own "Navigation bar".
    expect(navs).toEqual(["Schedule", "Navigation bar", "breadcrumb"]);
  });

  it("slides away with Ctrl+B and with the trigger, and opens again", () => {
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

  it("shows the sample month with its day picked, the same every day", () => {
    render(<Page />);
    expect(screen.getByRole("grid").getAttribute("aria-label")).toMatch(/October 2026/);
    expect(day(12).dataset.selectedSingle).toBe("true");
  });

  it("picks another day", () => {
    render(<Page />);
    fireEvent.click(day(20));
    expect(day(20).dataset.selectedSingle).toBe("true");
    expect(day(12).dataset.selectedSingle).not.toBe("true");
  });

  it("opens and closes a calendar group: Studio open from the start, Favorites closed", () => {
    render(<Page />);
    const studio = screen.getByRole("button", { name: "Studio" });
    const favorites = screen.getByRole("button", { name: "Favorites" });
    expect(studio.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("button", { name: "Serial deadlines" })).toBeTruthy();
    expect(favorites.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(favorites);
    expect(favorites.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("button", { name: "Release days" })).toBeTruthy();
  });

  it("shows the editor's initials while there is no photo", () => {
    render(<Page />);
    const user = screen.getByRole("button", { name: /Hana Mori/ });
    expect(user.querySelector('[data-slot="avatar-fallback"]')?.textContent).toBe("HM");
    expect(user.querySelector("img")).toBeNull();
  });

  it("is a phone's sheet below 768 px, closed until the trigger opens it", async () => {
    stubViewport(360);
    render(<Page />);
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(trigger());
    const sheet = await screen.findByRole("dialog", { name: "Sidebar" });
    expect(within(sheet).getByRole("button", { name: /Hana Mori/ })).toBeTruthy();
  });

  it("has no axe violations as a whole page", async () => {
    await expectNoA11yViolations(<Page />);
  });
});

describe("sidebar-12 files", () => {
  it("draws nothing of its own: no SVG, border, shadow or spot classes", () => {
    for (const file of ["page.tsx", ...COMPONENTS.map((name) => `components/${name}.tsx`)]) {
      expect(source(file), file).not.toMatch(/<svg|shadow-|border|text-spot|gradient/);
    }
  });

  it("keeps stock's client boundary: a server page, client components but date-picker", () => {
    expect(hasUseClientDirective(source("page.tsx"))).toBe(false);
    for (const name of COMPONENTS) {
      expect(hasUseClientDirective(source(`components/${name}.tsx`)), name).toBe(
        CLIENT.includes(name),
      );
    }
  });

  it("imports app-sidebar relatively, installed at its install path; the parts relatively", () => {
    expect(source("page.tsx")).toContain('from "./components/app-sidebar"');
    expect(installedPageSource("sidebar-12")).toContain('from "@/components/app-sidebar"');
    const appSidebar = source("components/app-sidebar.tsx");
    for (const name of COMPONENTS.slice(1)) {
      expect(appSidebar).toMatch(new RegExp(`from "\\./${name}"`));
    }
  });

  expectDemosAccessible(import.meta.glob("./demos/*.tsx"));
});
