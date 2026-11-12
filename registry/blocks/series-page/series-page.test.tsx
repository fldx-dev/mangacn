import { readFileSync } from "node:fs";
import path from "node:path";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { hasUseClientDirective } from "@/lib/registry/client";
import { expectDemosAccessible, expectNoA11yViolations } from "@/lib/test/axe";
import { SeriesHeader, type SeriesInfo } from "./components/series-header";
import Page from "./page";

afterEach(cleanup);

const source = (file: string) => readFileSync(path.join(__dirname, file), "utf8");

const info: SeriesInfo = {
  title: "Lantern Keepers",
  originalTitle: "灯守り",
  reading: "ひもり",
  author: "Hana Mori",
  artist: "Kei Arata",
  synopsis: "Lanterns go out one by one.",
  status: "ongoing",
  cover: { src: "data:image/gif;base64,R0lGODlhAQABAAAAACw=", alt: "The cover" },
  startHref: "#chapter-1",
};

describe("SeriesHeader", () => {
  it("is the page's one h1, with the original title and its reading as ruby under lang=ja", () => {
    render(<SeriesHeader series={info} />);
    const headings = screen.getAllByRole("heading");
    expect(headings).toHaveLength(1);
    expect(headings[0].tagName).toBe("H1");
    expect(headings[0].textContent).toBe("Lantern Keepers");
    const ruby = document.querySelector("ruby") as HTMLElement;
    expect(ruby.closest("[lang]")?.getAttribute("lang")).toBe("ja");
    expect(ruby.querySelector("rt")?.textContent).toBe("ひもり");
  });

  it("stamps the status on the cover, in Japanese, named in English", () => {
    render(<SeriesHeader series={info} />);
    const stamp = screen.getByRole("img", { name: "Ongoing" });
    expect(stamp.getAttribute("data-slot")).toBe("stamp");
    expect(stamp.getAttribute("lang")).toBe("ja");
    expect(stamp.textContent).toContain("連載中");
    expect(stamp.closest('[data-slot="series-header-cover"]')).toBeTruthy();
    expect(screen.getByRole("img", { name: "The cover" }).getAttribute("loading")).toBeNull();
  });

  it("leaves the stamp out without a status, and the Art credit without an artist", () => {
    const { container } = render(
      <SeriesHeader series={{ ...info, status: undefined, artist: undefined }} />,
    );
    expect(container.querySelector('[data-slot="stamp"]')).toBeNull();
    expect(screen.getByText("By")).toBeTruthy();
    expect(screen.queryByText("Art")).toBeNull();
  });

  it("links Start reading to the first chapter and toggles Follow with aria-pressed", () => {
    const onFollowingChange = vi.fn();
    render(<SeriesHeader series={info} onFollowingChange={onFollowingChange} />);
    const start = screen.getByRole("link", { name: "Start reading" });
    expect(start.getAttribute("href")).toBe("#chapter-1");
    expect(start.getAttribute("data-slot")).toBe("button");
    const follow = screen.getByRole("button", { name: "Follow" });
    expect(follow.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(follow);
    expect(follow.getAttribute("aria-pressed")).toBe("true");
    expect(onFollowingChange).toHaveBeenLastCalledWith(true);
    fireEvent.click(follow);
    expect(follow.getAttribute("aria-pressed")).toBe("false");
  });

  it("follows a controlled following prop", () => {
    const onFollowingChange = vi.fn();
    render(<SeriesHeader series={info} following onFollowingChange={onFollowingChange} />);
    const follow = screen.getByRole("button", { name: "Follow" });
    expect(follow.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(follow);
    expect(onFollowingChange).toHaveBeenLastCalledWith(false);
    expect(follow.getAttribute("aria-pressed")).toBe("true");
  });

  expectDemosAccessible(import.meta.glob("./demos/*.tsx"));
});

describe("series-page page", () => {
  it("is the page's one main, with one h1 and an h2 in the open panel", () => {
    render(<Page />);
    expect(screen.getAllByRole("main")).toHaveLength(1);
    const h1s = screen.getAllByRole("heading", { level: 1 });
    expect(h1s.map((h) => h.textContent)).toEqual(["Lantern Keepers"]);
    const panel = screen.getByRole("tabpanel", { name: "Volumes" });
    expect(within(panel).getByRole("heading", { level: 2 }).textContent).toBe("5 volumes");
  });

  it("switches between Volumes, Chapters and Cast; each panel named by its tab", async () => {
    render(<Page />);
    const tabs = screen.getAllByRole("tab").map((tab) => tab.textContent);
    expect(tabs).toEqual(["Volumes", "Chapters", "Cast"]);
    const volumes = screen.getByRole("tabpanel", { name: "Volumes" });
    expect(
      within(volumes).getByRole("navigation", { name: "Lantern Keepers volumes" }),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("tab", { name: "Chapters" }));
    await act(async () => {});
    const chapters = screen.getByRole("tabpanel", { name: "Chapters" });
    expect(
      within(chapters).getByRole("navigation", { name: "Lantern Keepers chapters" }),
    ).toBeTruthy();
    expect(screen.queryByRole("tabpanel", { name: "Volumes" })).toBeNull();

    fireEvent.click(screen.getByRole("tab", { name: "Cast" }));
    await act(async () => {});
    const cast = screen.getByRole("tabpanel", { name: "Cast" });
    const members = within(cast).getAllByRole("article");
    expect(members.map((member) => member.getAttribute("aria-label"))).toEqual([
      "Mio Amano",
      "Ren Kuroda",
      "Old Tomo",
    ]);
  });

  it("moves between tabs with the arrow keys, as mangacn's tabs do", async () => {
    render(<Page />);
    const [volumes, chapters] = screen.getAllByRole("tab");
    act(() => volumes.focus());
    fireEvent.keyDown(volumes, { key: "ArrowRight" });
    await act(async () => {});
    expect(document.activeElement).toBe(chapters);
  });

  it("imports its header and the blocks it composes from their install paths", () => {
    const code = source("page.tsx");
    expect(code).toContain('from "@/components/series-header"');
    for (const block of ["volume-grid", "chapter-list", "character-card"]) {
      expect(code).toContain(`from "@/components/blocks/${block}/${block}"`);
    }
  });

  it("draws nothing of its own: no SVG element, border, shadow or colour class in markup", () => {
    for (const file of ["page.tsx", "components/series-header.tsx"]) {
      // The sample pictures are SVG data URLs inside strings; markup is what is checked.
      const code = source(file).replace(/`[^`]*`/g, "``");
      expect(code, file).not.toMatch(/<svg|shadow-|border-|bg-|text-spot|gradient/);
    }
  });

  it("keeps the page a server component and the header a client one", () => {
    expect(hasUseClientDirective(source("page.tsx"))).toBe(false);
    expect(hasUseClientDirective(source("components/series-header.tsx"))).toBe(true);
  });

  it("has no axe violations as a whole page", async () => {
    await expectNoA11yViolations(<Page />);
  });
});
