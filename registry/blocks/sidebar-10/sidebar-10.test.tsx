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
  "app-sidebar",
  "nav-actions",
  "nav-favorites",
  "nav-main",
  "nav-secondary",
  "nav-workspaces",
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

const sidebar = () => document.querySelector('[data-slot="sidebar"][data-state]') as HTMLElement;
const trigger = () => document.querySelector('[data-slot="sidebar-trigger"]') as HTMLElement;

describe("sidebar-10 page", () => {
  it("is a whole page: one main with one h1, the sidebar and the breadcrumb named navigation", () => {
    render(<Page />);
    const main = screen.getByRole("main");
    expect(main.getAttribute("data-slot")).toBe("sidebar-inset");
    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(within(main).getAllByRole("heading", { level: 1 })).toHaveLength(1);
    const navs = screen.getAllByRole("navigation").map((nav) => nav.getAttribute("aria-label"));
    expect(navs).toEqual(["Notebook", "breadcrumb"]);
  });

  it("collapses with Ctrl+B and with the trigger, and opens again", () => {
    render(<Page />);
    expect(sidebar().getAttribute("data-state")).toBe("expanded");
    act(() => {
      fireEvent.keyDown(window, { key: "b", ctrlKey: true });
    });
    expect(sidebar().getAttribute("data-state")).toBe("collapsed");
    fireEvent.click(trigger());
    expect(sidebar().getAttribute("data-state")).toBe("expanded");
  });

  it("opens the page actions from their named button, not on load", async () => {
    render(<Page />);
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Page actions" }));
    const popup = await screen.findByRole("dialog");
    expect(within(popup).getByRole("button", { name: "Move to Trash" })).toBeTruthy();
    expect(popup.querySelectorAll('[data-slot="sidebar-separator"]')).toHaveLength(3);
    expect(screen.getByRole("button", { name: "Add to favorites" })).toBeTruthy();
  });

  it("opens a workspace's pages from its named chevron, and names each add button", () => {
    render(<Page />);
    const chevron = screen.getByRole("button", { name: "Pages of Kitchen Spirits" });
    expect(chevron.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(chevron);
    expect(chevron.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("link", { name: /Recipe of the Week/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Add a page to Kitchen Spirits" })).toBeTruthy();
  });

  it("puts each workspace in a list item, so each list holds only items", () => {
    render(<Page />);
    const nav = screen.getByRole("navigation", { name: "Notebook" });
    for (const list of nav.querySelectorAll("ul")) {
      for (const child of list.children) expect(child.tagName).toBe("LI");
    }
  });

  it("names each favourite's menu by its note", () => {
    render(<Page />);
    expect(screen.getByRole("button", { name: "More for Anime Adaptation Notes" })).toBeTruthy();
  });

  it("switches the studio from the team menu", async () => {
    render(<Page />);
    fireEvent.click(screen.getByRole("button", { name: /Inkpot Studio/ }));
    const menu = await screen.findByRole("menu");
    fireEvent.click(within(menu).getByRole("menuitem", { name: /Night Owl Press/ }));
    expect(await screen.findByRole("button", { name: /Night Owl Press/ })).toBeTruthy();
  });

  it("is a phone's sheet below 768 px, closed until the trigger opens it", async () => {
    stubViewport(360);
    render(<Page />);
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(trigger());
    const sheet = await screen.findByRole("dialog", { name: "Sidebar" });
    expect(within(sheet).getByRole("link", { name: "Home" })).toBeTruthy();
  });

  it("has no axe violations as a whole page", async () => {
    await expectNoA11yViolations(<Page />);
  });
});

describe("sidebar-10 files", () => {
  it("draws nothing of its own: no SVG, border, shadow or spot classes; only stock's two fills", () => {
    for (const file of ["page.tsx", ...COMPONENTS.map((name) => `components/${name}.tsx`)]) {
      // Stock's own two: the chevron's hover tone over the workspace emoji, and the popover's
      // sidebar letting the popover's paper through.
      const text = source(file)
        .replace("left-2 bg-sidebar-accent", "")
        .replace('className="bg-transparent"', "");
      expect(text, file).not.toMatch(/<svg|shadow-|border|bg-|text-spot|gradient/);
    }
  });

  it("keeps stock's client boundary: a server page, client components", () => {
    expect(hasUseClientDirective(source("page.tsx"))).toBe(false);
    for (const name of COMPONENTS) {
      expect(hasUseClientDirective(source(`components/${name}.tsx`)), name).toBe(true);
    }
  });

  it("imports its two components relatively, installed at their install paths", () => {
    const page = source("page.tsx");
    const installed = installedPageSource("sidebar-10");
    for (const name of ["app-sidebar", "nav-actions"]) {
      expect(page).toContain(`from "./components/${name}"`);
      expect(installed).toContain(`from "@/components/${name}"`);
    }
  });

  expectDemosAccessible(import.meta.glob("./demos/*.tsx"));
});
