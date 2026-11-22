import { readFileSync } from "node:fs";
import path from "node:path";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { hasUseClientDirective } from "@/lib/registry/client";
import { installedPageSource } from "@/lib/registry/page-source";
import { expectNoA11yViolations, expectVariantsAccessible } from "@/lib/test/axe";
import Page from "./page";

const source = (file: string) => readFileSync(path.join(__dirname, file), "utf8");

// jsdom has no matchMedia, and the sidebar's useIsMobile reads window.innerWidth against it (as
// in registry/ui/sidebar/sidebar.test.tsx).
beforeEach(() => {
  vi.stubGlobal("innerWidth", 1280);
  vi.stubGlobal("matchMedia", (query: string) => ({
    media: query,
    matches: false,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const openDialog = async () => {
  fireEvent.click(screen.getByRole("button", { name: "Open Dialog" }));
  return screen.findByRole("dialog", { name: "Settings" });
};

describe("sidebar-13 page", () => {
  it("is a whole page: one main with one h1, the dialog closed until its button opens it", () => {
    render(<Page />);
    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(within(screen.getByRole("main")).getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("opens the settings with the sections as a named navigation, and no second main", async () => {
    render(<Page />);
    const dialog = await openDialog();
    const nav = within(dialog).getByRole("navigation", { name: "Settings sections" });
    expect(nav.getAttribute("data-slot")).toBe("sidebar");
    expect(within(nav).getAllByRole("link")).toHaveLength(12);
    const active = within(nav).getByRole("link", { name: "Reading & pages" });
    expect(active.getAttribute("data-active")).not.toBeNull();
    expect(within(dialog).queryByRole("main")).toBeNull();
    expect(within(dialog).getByRole("navigation", { name: "breadcrumb" })).toBeTruthy();
  });

  it("closes with Escape", async () => {
    render(<Page />);
    const dialog = await openDialog();
    fireEvent.keyDown(dialog, { key: "Escape" });
    await vi.waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("has no axe violations as a whole page", async () => {
    await expectNoA11yViolations(<Page />);
  });

  it("has no axe violations with the settings open", async () => {
    await expectNoA11yViolations(<Page />, openDialog);
  });
});

describe("sidebar-13 files", () => {
  it("draws nothing of its own: no SVG, border, fill, shadow or spot classes", () => {
    for (const file of ["page.tsx", "components/settings-dialog.tsx"]) {
      // bg-transparent un-fills the sidebar, so the dialog's frame shows round it.
      const text = source(file).replace("hidden bg-transparent md:flex", "");
      expect(text, file).not.toMatch(/<svg|shadow-|border|bg-|text-spot|gradient/);
    }
  });

  it("keeps stock's client boundary: a server page, a client dialog", () => {
    expect(hasUseClientDirective(source("page.tsx"))).toBe(false);
    expect(hasUseClientDirective(source("components/settings-dialog.tsx"))).toBe(true);
  });

  it("imports settings-dialog relatively, installed at its install path", () => {
    expect(source("page.tsx")).toContain('from "./components/settings-dialog"');
    expect(installedPageSource("sidebar-13")).toContain('from "@/components/settings-dialog"');
  });

  expectVariantsAccessible(import.meta.glob("./variants/*.tsx"));
});
