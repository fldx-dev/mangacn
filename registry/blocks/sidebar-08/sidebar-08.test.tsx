import { readFileSync } from "node:fs";
import path from "node:path";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { hasUseClientDirective } from "@/lib/registry/client";
import { installedPageSource } from "@/lib/registry/page-source";
import { expectNoA11yViolations, expectVariantsAccessible } from "@/lib/test/axe";
import { SidebarProvider } from "@/registry/ui/sidebar/sidebar";
import { AppSidebar } from "./components/app-sidebar";
import { NavUser } from "./components/nav-user";
import Page from "./page";

const source = (file: string) => readFileSync(path.join(__dirname, file), "utf8");

const COMPONENTS = ["app-sidebar", "nav-main", "nav-projects", "nav-secondary", "nav-user"];

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

describe("sidebar-08 page", () => {
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

  it("is stock's inset variant", () => {
    render(<Page />);
    expect(sidebar().getAttribute("data-variant")).toBe("inset");
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

  it("opens a section's sub-links from its own named chevron", () => {
    render(<Page />);
    const series = screen.getByRole("button", { name: "Toggle Series" });
    const chapters = screen.getByRole("button", { name: "Toggle Chapters" });
    // The current section's link is active and the current page; the others are neither.
    const seriesLink = screen.getByRole("link", { name: "Series" });
    expect(seriesLink.hasAttribute("data-active")).toBe(true);
    expect(seriesLink.getAttribute("aria-current")).toBe("page");
    const chaptersLink = screen.getByRole("link", { name: "Chapters" });
    expect(chaptersLink.hasAttribute("data-active")).toBe(false);
    expect(chaptersLink.hasAttribute("aria-current")).toBe(false);
    expect(series.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("link", { name: "Ongoing" })).toBeTruthy();
    expect(chapters.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(chapters);
    expect(chapters.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("link", { name: "Drafts" })).toBeTruthy();
  });

  it("has the secondary links at the sidebar's foot", () => {
    render(<Page />);
    for (const name of ["Support", "Feedback"]) {
      expect(screen.getByRole("link", { name })).toBeTruthy();
    }
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
    expect(within(sheet).getByRole("link", { name: /Inkpot Studio/ })).toBeTruthy();
  });

  it("has no axe violations as a whole page", async () => {
    await expectNoA11yViolations(<Page />);
  });
});

describe("sidebar-08 AppSidebar props", () => {
  it("draws the brand, sections, projects, links, user and label it is given", () => {
    render(
      <SidebarProvider>
        <AppSidebar
          label="Workspace"
          brand={{ name: "Ink Club", logo: <span />, plan: "Free", url: "/home" }}
          navMain={[{ title: "Boards", url: "/boards", icon: <span /> }]}
          projects={[{ name: "Comet Run", url: "/comet", icon: <span /> }]}
          navSecondary={[{ title: "Help", url: "/help", icon: <span /> }]}
          user={{ name: "Sora Ito", email: "sora@example.com", avatar: "" }}
        />
      </SidebarProvider>,
    );
    expect(screen.getByRole("navigation", { name: "Workspace" })).toBeTruthy();
    expect(screen.getByRole("link", { name: /Ink Club/ }).getAttribute("href")).toBe("/home");
    expect(screen.getByRole("link", { name: "Boards" }).getAttribute("href")).toBe("/boards");
    expect(screen.getByRole("link", { name: "Comet Run" }).getAttribute("href")).toBe("/comet");
    expect(screen.getByRole("link", { name: "Help" }).getAttribute("href")).toBe("/help");
    expect(screen.getByRole("button", { name: /Sora Ito/ })).toBeTruthy();
    expect(screen.queryByText("Inkpot Studio")).toBeNull();
    expect(screen.queryByText("Support")).toBeNull();
  });

  it("runs NavUser's onLogout and the other account actions from the menu", async () => {
    const onLogout = vi.fn();
    const onAccount = vi.fn();
    render(
      <SidebarProvider>
        <AppSidebar userActions={{ onLogout, onAccount }} />
      </SidebarProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: /Hana Mori/ }));
    fireEvent.click(await screen.findByRole("menuitem", { name: "Account" }));
    expect(onAccount).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: /Hana Mori/ }));
    fireEvent.click(await screen.findByRole("menuitem", { name: "Log out" }));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it("fires onLogout from NavUser on its own", async () => {
    const onLogout = vi.fn();
    render(
      <SidebarProvider>
        <NavUser
          user={{ name: "Sora Ito", email: "sora@example.com", avatar: "" }}
          onLogout={onLogout}
        />
      </SidebarProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: /Sora Ito/ }));
    fireEvent.click(await screen.findByRole("menuitem", { name: "Log out" }));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });
});

describe("sidebar-08 files", () => {
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

  it("imports app-sidebar relatively, installed at its install path; the parts relatively", () => {
    expect(source("page.tsx")).toContain('from "./components/app-sidebar"');
    expect(installedPageSource("sidebar-08")).toContain('from "@/components/app-sidebar"');
    const appSidebar = source("components/app-sidebar.tsx");
    for (const name of COMPONENTS.slice(1)) {
      expect(appSidebar).toMatch(new RegExp(`from "\\./${name}"`));
    }
  });

  expectVariantsAccessible(import.meta.glob("./variants/*.tsx"));
});
