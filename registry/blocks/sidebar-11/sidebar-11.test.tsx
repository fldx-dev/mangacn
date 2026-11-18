import { readFileSync } from "node:fs";
import path from "node:path";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { hasUseClientDirective } from "@/lib/registry/client";
import { installedPageSource } from "@/lib/registry/page-source";
import { expectDemosAccessible, expectNoA11yViolations } from "@/lib/test/axe";
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
const trigger = () => document.querySelector('[data-slot="sidebar-trigger"]') as HTMLElement;
const nav = () => screen.getByRole("navigation", { name: "Chapter files" });

describe("sidebar-11 page", () => {
  it("is a whole page: one main with one h1, the sidebar and the breadcrumb named navigation", () => {
    render(<Page />);
    const main = screen.getByRole("main");
    expect(main.getAttribute("data-slot")).toBe("sidebar-inset");
    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    const navs = screen.getAllByRole("navigation").map((nav) => nav.getAttribute("aria-label"));
    expect(navs).toEqual(["Chapter files", "breadcrumb"]);
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

  it("lists the changed files with their state", () => {
    render(<Page />);
    const badges = [...document.querySelectorAll('[data-slot="sidebar-menu-badge"]')];
    expect(badges.map((badge) => badge.textContent)).toEqual(["M", "U", "M"]);
  });

  it("opens chapter-12 and pages from the start, the rest closed, and marks the open page", () => {
    render(<Page />);
    const folder = (name: string) => within(nav()).getByRole("button", { name });
    expect(folder("chapter-12").getAttribute("aria-expanded")).toBe("true");
    expect(folder("pages").getAttribute("aria-expanded")).toBe("true");
    expect(folder("roughs").getAttribute("aria-expanded")).toBe("false");
    expect(folder("lettering").getAttribute("aria-expanded")).toBe("false");
    expect(folder("p02.clip").getAttribute("data-active")).not.toBeNull();
    fireEvent.click(folder("lettering"));
    expect(folder("lettering").getAttribute("aria-expanded")).toBe("true");
    expect(folder("dialogue.txt")).toBeTruthy();
  });

  it("puts every file in a list item, so each list holds only items", () => {
    render(<Page />);
    for (const list of nav().querySelectorAll("ul")) {
      for (const child of list.children) expect(child.tagName).toBe("LI");
    }
  });

  it("is a phone's sheet below 768 px, closed until the trigger opens it", async () => {
    stubViewport(360);
    render(<Page />);
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(trigger());
    const sheet = await screen.findByRole("dialog", { name: "Sidebar" });
    expect(within(sheet).getByRole("button", { name: "chapter-12" })).toBeTruthy();
  });

  it("has no axe violations as a whole page", async () => {
    await expectNoA11yViolations(<Page />);
  });
});

describe("sidebar-11 files", () => {
  it("draws nothing of its own: no SVG, border, fill, shadow or spot classes", () => {
    for (const file of ["page.tsx", "components/app-sidebar.tsx"]) {
      expect(source(file), file).not.toMatch(/<svg|shadow-|border|bg-|text-spot|gradient/);
    }
  });

  it("keeps stock's client boundary: a server page, a client sidebar", () => {
    expect(hasUseClientDirective(source("page.tsx"))).toBe(false);
    expect(hasUseClientDirective(source("components/app-sidebar.tsx"))).toBe(true);
  });

  it("imports app-sidebar relatively, installed at its install path", () => {
    expect(source("page.tsx")).toContain('from "./components/app-sidebar"');
    expect(installedPageSource("sidebar-11")).toContain('from "@/components/app-sidebar"');
  });

  expectDemosAccessible(import.meta.glob("./demos/*.tsx"));
});
