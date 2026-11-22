import { readFileSync } from "node:fs";
import path from "node:path";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { hasUseClientDirective } from "@/lib/registry/client";
import { installedPageSource } from "@/lib/registry/page-source";
import { expectNoA11yViolations, expectVariantsAccessible } from "@/lib/test/axe";
import Page from "./page";

const source = (file: string) => readFileSync(path.join(__dirname, file), "utf8");

const COMPONENTS = ["app-sidebar", "nav-user"];

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

/** The outer sidebar: the one that collapses (the inner two have no state of their own). */
const sidebar = () => document.querySelector('[data-slot="sidebar"][data-state]') as HTMLElement;
const trigger = () => document.querySelector('[data-slot="sidebar-trigger"]') as HTMLElement;

describe("sidebar-09 page", () => {
  it("is a whole page: one main with one h1, and three navigation landmarks, each named once", () => {
    render(<Page />);
    const main = screen.getByRole("main");
    expect(main.getAttribute("data-slot")).toBe("sidebar-inset");
    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    const navs = screen.getAllByRole("navigation").map((nav) => nav.getAttribute("aria-label"));
    expect(navs).toEqual(["Mailboxes", "Inbox messages", "breadcrumb"]);
  });

  it("collapses to the rail with Ctrl+B and with the trigger, and opens again", () => {
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

  it("opens a mailbox from the rail: it is marked, names the list and opens a collapsed sidebar", () => {
    render(<Page />);
    act(() => {
      fireEvent.keyDown(window, { key: "b", ctrlKey: true });
    });
    const rail = screen.getByRole("navigation", { name: "Mailboxes" });
    fireEvent.click(within(rail).getByRole("button", { name: "Drafts" }));
    expect(
      within(rail).getByRole("button", { name: "Drafts" }).getAttribute("data-active"),
    ).not.toBeNull();
    expect(screen.getByRole("navigation", { name: "Drafts messages" })).toBeTruthy();
    expect(sidebar().getAttribute("data-state")).toBe("expanded");
  });

  it("lists the studio's letters as mail links, with the Unreads switch named", () => {
    render(<Page />);
    const list = screen.getByRole("navigation", { name: "Inbox messages" });
    const letters = within(list).getAllByRole("link");
    expect(letters).toHaveLength(10);
    expect(letters[0].getAttribute("href")).toBe("mailto:kenji@example.com");
    expect(within(list).getByRole("switch", { name: "Unreads" })).toBeTruthy();
  });

  it("shows the artist's initials while there is no photo", () => {
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
    expect(within(sheet).getByRole("navigation", { name: "Mailboxes" })).toBeTruthy();
  });

  it("has no axe violations as a whole page", async () => {
    await expectNoA11yViolations(<Page />);
  });
});

describe("sidebar-09 files", () => {
  it("draws nothing of its own: no SVG, border, shadow or spot classes; no fill but the header's paper", () => {
    for (const file of ["page.tsx", ...COMPONENTS.map((name) => `components/${name}.tsx`)]) {
      const text = source(file).replace("bg-background p-4", "");
      expect(text, file).not.toMatch(/<svg|shadow-|border|bg-|text-spot|gradient/);
    }
  });

  it("keeps stock's client boundary: a server page, client components", () => {
    expect(hasUseClientDirective(source("page.tsx"))).toBe(false);
    for (const name of COMPONENTS) {
      expect(hasUseClientDirective(source(`components/${name}.tsx`)), name).toBe(true);
    }
  });

  it("imports app-sidebar relatively, installed at its install path; nav-user relatively", () => {
    expect(source("page.tsx")).toContain('from "./components/app-sidebar"');
    expect(installedPageSource("sidebar-09")).toContain('from "@/components/app-sidebar"');
    expect(source("components/app-sidebar.tsx")).toContain('from "./nav-user"');
  });

  expectVariantsAccessible(import.meta.glob("./variants/*.tsx"));
});
