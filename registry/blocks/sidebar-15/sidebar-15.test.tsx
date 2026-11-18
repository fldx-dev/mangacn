import { readFileSync } from "node:fs";
import path from "node:path";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { hasUseClientDirective } from "@/lib/registry/client";
import { installedPageSource } from "@/lib/registry/page-source";
import { expectDemosAccessible, expectNoA11yViolations } from "@/lib/test/axe";
import Page from "./page";

const source = (file: string) => readFileSync(path.join(__dirname, file), "utf8");

const COMPONENTS = [
  "calendars",
  "date-picker",
  "nav-favorites",
  "nav-main",
  "nav-secondary",
  "nav-user",
  "nav-workspaces",
  "sidebar-left",
  "sidebar-right",
  "team-switcher",
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

const left = () =>
  screen
    .getByRole("navigation", { name: "Notebook" })
    .closest('[data-slot="sidebar"]') as HTMLElement;
const right = () => screen.getByRole("navigation", { name: "Schedule" });
const trigger = () => document.querySelector('[data-slot="sidebar-trigger"]') as HTMLElement;

describe("sidebar-15 page", () => {
  it("is a whole page: one main with one h1 between two named sidebars", () => {
    render(<Page />);
    const main = screen.getByRole("main");
    expect(main.getAttribute("data-slot")).toBe("sidebar-inset");
    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(within(main).getByRole("heading", { level: 1 }).classList).toContain("font-display");
    // The calendar's month navigation is the library's own "Navigation bar".
    const navs = screen.getAllByRole("navigation").map((nav) => nav.getAttribute("aria-label"));
    expect(navs).toEqual(["Notebook", "breadcrumb", "Schedule", "Navigation bar"]);
    // Left, main, right, in document order.
    expect(left().compareDocumentPosition(main) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(main.compareDocumentPosition(right()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("puts both sidebars away with Ctrl+B and with the trigger, and brings both back", () => {
    render(<Page />);
    expect(left().getAttribute("data-state")).toBe("expanded");
    expect(right().className).toContain("lg:flex");
    act(() => {
      fireEvent.keyDown(window, { key: "b", ctrlKey: true });
    });
    expect(left().getAttribute("data-state")).toBe("collapsed");
    expect(right().className.split(" ")).toContain("hidden");
    expect(right().className).not.toContain("lg:flex");
    fireEvent.click(trigger());
    expect(left().getAttribute("data-state")).toBe("expanded");
    expect(right().className).toContain("lg:flex");
  });

  it("keeps the right sidebar out of the way under lg, as stock does", () => {
    render(<Page />);
    expect(right().className.split(" ")).toEqual(
      expect.arrayContaining(["hidden", "lg:flex", "sticky"]),
    );
  });

  it("is a phone's sheet on the left below 768 px; the right stays hidden", async () => {
    stubViewport(360);
    render(<Page />);
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(trigger());
    const sheet = await screen.findByRole("dialog", { name: "Sidebar" });
    expect(within(sheet).getByRole("button", { name: /Inkpot Studio/ })).toBeTruthy();
    expect(within(sheet).queryByRole("grid")).toBeNull();
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
  });

  it("switches the studio from the team menu", async () => {
    render(<Page />);
    fireEvent.click(screen.getByRole("button", { name: /Inkpot Studio/ }));
    const menu = await screen.findByRole("menu");
    fireEvent.click(within(menu).getByRole("menuitem", { name: /Night Owl Press/ }));
    expect(await screen.findByRole("button", { name: /Night Owl Press/ })).toBeTruthy();
  });

  it("names each favourite's menu and each workspace's actions by their row", () => {
    render(<Page />);
    expect(
      screen.getByRole("button", { name: "More for Moonlit Ronin: series bible" }),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Toggle Kitchen Spirits" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Add a page to Kitchen Spirits" })).toBeTruthy();
  });

  it("opens a workspace's pages", () => {
    render(<Page />);
    const toggle = screen.getByRole("button", { name: "Toggle Moonlit Ronin" });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("link", { name: /Sword designs/ })).toBeTruthy();
  });

  it("shows the sample month with its day picked, and the editor's initials", () => {
    render(<Page />);
    expect(screen.getByRole("grid").getAttribute("aria-label")).toMatch(/October 2026/);
    const day = screen.getByRole("button", { name: /October 12, 2026/ });
    expect(day.dataset.selectedSingle).toBe("true");
    const user = screen.getByRole("button", { name: /Hana Mori/ });
    expect(user.querySelector('[data-slot="avatar-fallback"]')?.textContent).toBe("HM");
  });

  it("has no axe violations as a whole page", async () => {
    await expectNoA11yViolations(<Page />);
  });
});

describe("sidebar-15 files", () => {
  it("draws nothing of its own: no SVG, border, shadow or spot classes", () => {
    for (const file of ["page.tsx", ...COMPONENTS.map((name) => `components/${name}.tsx`)]) {
      expect(source(file), file).not.toMatch(/<svg|shadow-|border|text-spot|gradient/);
    }
  });

  it("keeps stock's client boundary: a server page, client components but date-picker", () => {
    expect(hasUseClientDirective(source("page.tsx"))).toBe(false);
    for (const name of COMPONENTS) {
      expect(hasUseClientDirective(source(`components/${name}.tsx`)), name).toBe(
        name !== "date-picker",
      );
    }
  });

  it("imports its sidebars relatively, installed at their install paths", () => {
    expect(source("page.tsx")).toContain('from "./components/sidebar-left"');
    expect(source("page.tsx")).toContain('from "./components/sidebar-right"');
    const installed = installedPageSource("sidebar-15");
    expect(installed).toContain('from "@/components/sidebar-left"');
    expect(installed).toContain('from "@/components/sidebar-right"');
    expect(source("components/sidebar-right.tsx")).toContain('from "./date-picker"');
  });

  expectDemosAccessible(import.meta.glob("./demos/*.tsx"));
});
