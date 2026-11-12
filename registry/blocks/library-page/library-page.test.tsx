import { readFileSync } from "node:fs";
import path from "node:path";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { hasUseClientDirective } from "@/lib/registry/client";
import { expectDemosAccessible, expectNoA11yViolations } from "@/lib/test/axe";
import { ContinueReading, progressText } from "./components/continue-reading";
import { Shelf, volumeCount } from "./components/shelf";
import Page from "./page";

const source = (file: string) => readFileSync(path.join(__dirname, file), "utf8");

const COMPONENTS = ["components/shelf.tsx", "components/continue-reading.tsx"];

// jsdom has no matchMedia, and the shell's sidebar reads the viewport through it (as in
// registry/blocks/sidebar-07/sidebar-07.test.tsx).
function stubViewport(width: number) {
  vi.stubGlobal("innerWidth", width);
  vi.stubGlobal("matchMedia", (query: string) => ({
    media: query,
    matches: width < 768,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

beforeEach(() => stubViewport(1280));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const sections = () =>
  screen
    .getAllByRole("region")
    .map((section) => within(section).getAllByRole("heading", { level: 2 })[0].textContent);

describe("library-page", () => {
  it("is a whole page in sidebar-07's shell: one main, one h1, the sidebar named Studio", () => {
    render(<Page />);
    const main = screen.getByRole("main");
    expect(main.getAttribute("data-slot")).toBe("sidebar-inset");
    expect(screen.getAllByRole("main")).toHaveLength(1);
    const h1s = screen.getAllByRole("heading", { level: 1 });
    expect(h1s.map((h) => h.textContent)).toEqual(["Library"]);
    expect(main.contains(h1s[0])).toBe(true);
    const navs = screen.getAllByRole("navigation").map((nav) => nav.getAttribute("aria-label"));
    expect(navs).toEqual(["Studio", "breadcrumb", "Reading volumes", "Finished volumes"]);
    expect(main.querySelector('[data-slot="sidebar-trigger"]')).toBeTruthy();
  });

  it("names each section by its heading: continue reading, then the three shelves", () => {
    render(<Page />);
    expect(sections()).toEqual(["Continue reading", "Reading", "Finished", "Wishlist"]);
    for (const name of ["Continue reading", "Reading", "Finished", "Wishlist"]) {
      expect(screen.getByRole("region", { name })).toBeTruthy();
    }
    // Headings in order: the h1, then h2 per section, h3 per open chapter.
    const levels = [...document.querySelectorAll("main h1, main h2, main h3")].map((h) =>
      Number(h.tagName[1]),
    );
    expect(levels[0]).toBe(1);
    for (let i = 1; i < levels.length; i++) expect(levels[i] - levels[i - 1]).toBeLessThan(2);
  });

  it("shows the shelves' volumes as cover links and their counts", () => {
    render(<Page />);
    const reading = screen.getByRole("region", { name: "Reading" });
    expect(within(reading).getByText("4 volumes")).toBeTruthy();
    expect(within(reading).getAllByRole("link")).toHaveLength(4);
    const finished = screen.getByRole("region", { name: "Finished" });
    expect(within(finished).getByText("5 volumes")).toBeTruthy();
    expect(within(finished).getAllByRole("link")).toHaveLength(5);
  });

  it("shows empty on the empty shelf, with its line and its action", () => {
    render(<Page />);
    const wishlist = screen.getByRole("region", { name: "Wishlist" });
    expect(wishlist.querySelector('[data-slot="empty"]')).toBeTruthy();
    expect(within(wishlist).queryByRole("navigation")).toBeNull();
    expect(within(wishlist).getByText("Volumes you want to read next wait here.")).toBeTruthy();
    expect(within(wishlist).getByRole("link", { name: "Browse series" })).toBeTruthy();
  });

  it("gives every progress bar its value in words, and a Resume link named by its series", () => {
    render(<Page />);
    const section = screen.getByRole("region", { name: "Continue reading" });
    const bars = within(section).getAllByRole("progressbar");
    expect(bars.map((bar) => bar.getAttribute("aria-valuetext"))).toEqual([
      "Chapter 12, page 5 of 24",
      "Chapter 31, page 18 of 20",
      "Chapter 4, page 2 of 32",
    ]);
    expect(bars.map((bar) => bar.getAttribute("aria-valuenow"))).toEqual(["5", "18", "2"]);
    expect(bars[0].getAttribute("aria-valuemax")).toBe("24");
    // Each bar is named by its visible label.
    expect(screen.getByRole("progressbar", { name: "Page 5 of 24" })).toBe(bars[0]);
    for (const series of ["Moonlit Ronin", "Kitchen Spirits", "Starboard Academy"]) {
      const link = within(section).getByRole("link", { name: `Resume ${series}` });
      expect(link.getAttribute("href")).toMatch(/^#/);
    }
  });

  it("loads the open chapters' covers and the first shelf's first row at once, the rest lazily", () => {
    render(<Page />);
    const covers = (name: string) =>
      [...screen.getByRole("region", { name }).querySelectorAll("img")].map((img) =>
        img.getAttribute("loading"),
      );
    expect(covers("Continue reading")).toEqual([null, null, null]);
    // The first shelf's first row can be on a phone's first screen (and hold the largest paint).
    expect(covers("Reading")).toEqual([null, null, null, null]);
    expect(new Set(covers("Finished"))).toEqual(new Set(["lazy"]));
  });

  it("has no axe violations as a whole page", async () => {
    await expectNoA11yViolations(<Page />);
  });
});

describe("Shelf and ContinueReading", () => {
  it("render what they are given: an empty shelf with no action offers none", () => {
    render(<Shelf title="Dropped" volumes={[]} />);
    const shelf = screen.getByRole("region", { name: "Dropped" });
    expect(shelf.querySelector('[data-slot="empty"]')).toBeTruthy();
    expect(within(shelf).getByText("Nothing on this shelf")).toBeTruthy();
    expect(within(shelf).queryByRole("link")).toBeNull();
    cleanup();
    render(<ContinueReading items={[]} title="Up next" />);
    expect(screen.getByRole("region", { name: "Up next" })).toBeTruthy();
  });

  it("say counts and progress in words", () => {
    expect(volumeCount(1)).toBe("1 volume");
    expect(volumeCount(12)).toBe("12 volumes");
    expect(
      progressText({
        series: "S",
        chapter: 12,
        page: 5,
        pages: 24,
        cover: { src: "x", alt: "" },
        href: "#",
      }),
    ).toBe("Chapter 12, page 5 of 24");
  });

  expectDemosAccessible(import.meta.glob("./demos/*.tsx"));
});

describe("library-page files", () => {
  it("draws nothing of its own: no SVG, border, fill, shadow or spot classes", () => {
    for (const file of COMPONENTS) {
      expect(source(file), file).not.toMatch(/<svg|shadow-|border|bg-|text-spot|gradient/);
    }
    // The page's sample covers are SVG data, not drawing; its classes draw nothing either.
    const classes = source("page.tsx").match(/className="[^"]*"/g) ?? [];
    expect(classes.join(" ")).not.toMatch(/shadow-|border|bg-|text-spot|gradient/);
  });

  it("is a server page with server components: no state, no directive", () => {
    for (const file of ["page.tsx", ...COMPONENTS]) {
      expect(hasUseClientDirective(source(file)), file).toBe(false);
      expect(source(file), file).not.toMatch(/useState|useEffect|useReducer/);
    }
  });

  it("imports the shell and its own components from their install paths", () => {
    const page = source("page.tsx");
    expect(page).toContain('from "@/components/app-sidebar"');
    expect(page).toContain('from "@/components/shelf"');
    expect(page).toContain('from "@/components/continue-reading"');
    expect(page).toMatch(/^const library: Library = \{/m);
  });
});
