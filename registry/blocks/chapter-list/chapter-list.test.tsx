import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { expectDemosAccessible } from "@/lib/test/axe";
import { ChapterList } from "./chapter-list";
import { chapterLabel, latestChapter, orderChapters } from "./chapter-numeral";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const chapters = [
  { number: 2, title: "Second", href: "/c/2", read: true },
  { number: 10, title: "Tenth", href: "/c/10", date: "2026-11-02" },
  { number: "Extra", title: "Omake", href: "/c/extra" },
  { number: 1, title: "First", href: "/c/1", read: true },
  { number: "9.5", title: "Interlude", href: "/c/9-5" },
];

/** The rows' links, top to bottom, checked against their accessible names (aria-labelledby). */
function expectLinkNames(names: string[]) {
  const links = screen.getAllByRole("link");
  expect(links).toHaveLength(names.length);
  names.forEach((name, index) => {
    expect(screen.getByRole("link", { name })).toBe(links[index]);
  });
}

describe("orderChapters", () => {
  it("sorts by number, numbered first, and reverses for desc", () => {
    expect(orderChapters(chapters, "asc").map((c) => c.number)).toEqual([1, 2, "9.5", 10, "Extra"]);
    expect(orderChapters(chapters).map((c) => c.number)).toEqual(["Extra", 10, "9.5", 2, 1]);
  });

  it("keeps unnumbered chapters in the order given and leaves the input alone", () => {
    const input = [{ number: "B" }, { number: "A" }, { number: " " }, { number: 3 }] as const;
    expect(orderChapters(input, "asc").map((c) => c.number)).toEqual([3, "B", "A", " "]);
    expect(input[0].number).toBe("B");
  });
});

describe("latestChapter", () => {
  it("is the highest-numbered chapter, never an Extra after it", () => {
    expect(latestChapter(chapters)?.title).toBe("Tenth");
  });

  it("falls back to the last one when none is numbered, and to nothing when empty", () => {
    expect(latestChapter([{ number: "A" }, { number: "B" }])?.number).toBe("B");
    expect(latestChapter([])).toBeUndefined();
  });
});

describe("chapterLabel", () => {
  it("writes Latin or Japanese numerals", () => {
    expect(chapterLabel(12)).toBe("Chapter 12");
    expect(chapterLabel("12.5", "ja")).toBe("第12.5話");
  });
});

describe("ChapterList", () => {
  it("renders a named nav around an ordered list, one link per chapter, newest first", () => {
    render(<ChapterList chapters={chapters} label="Series chapters" />);
    const nav = screen.getByRole("navigation", { name: "Series chapters" });
    expect(nav?.getAttribute("data-slot")).toBe("chapter-list");
    expect(nav?.getAttribute("data-order")).toBe("desc");
    const list = within(nav).getByRole("list");
    expect(list.tagName).toBe("OL");
    expect(within(list).getAllByRole("listitem")).toHaveLength(5);
    expect(screen.getAllByRole("link").map((link) => link.getAttribute("href"))).toEqual([
      "/c/extra",
      "/c/10",
      "/c/9-5",
      "/c/2",
      "/c/1",
    ]);
  });

  it("names each link by number and title, with read and latest state in hidden text", () => {
    render(<ChapterList chapters={chapters} order="asc" />);
    expect(screen.getByRole("navigation", { name: "Chapters" })).toBeTruthy();
    expectLinkNames([
      "Chapter 1 First, read",
      "Chapter 2 Second, read",
      "Chapter 9.5 Interlude",
      "Chapter 10 Tenth, latest",
      "Chapter Extra Omake",
    ]);
    for (const state of screen.getAllByText(/^, (read|latest)$/)) {
      expect(state?.classList.contains("sr-only")).toBe(true);
    }
  });

  it("strikes read titles in tone and marks the row", () => {
    render(<ChapterList chapters={chapters} />);
    const rows = screen.getAllByRole("listitem");
    const read = rows.filter((row) => row.dataset.read === "true");
    expect(read).toHaveLength(2);
    for (const row of read) {
      const mark = row.querySelector("[data-slot=ink-mark]");
      expect(mark?.getAttribute("data-kind")).toBe("strike");
      expect(mark?.getAttribute("data-color")).toBe("tone");
    }
    expect(
      rows.find((row) => row.dataset.read !== "true")?.querySelector("[data-slot=ink-mark]"),
    ).toBeNull();
  });

  it("draws each row as an item: outlined while unread, muted once read", () => {
    render(<ChapterList chapters={chapters} />);
    for (const row of screen.getAllByRole("listitem")) {
      const item = row.querySelector("[data-slot=item]");
      expect(item?.getAttribute("data-variant")).toBe(row.dataset.read ? "muted" : "outline");
      expect(item?.getAttribute("data-size")).toBe("sm");
      // Every row takes the list's columns, so the titles line up past the widest number.
      expect(row.classList.contains("grid-cols-subgrid")).toBe(true);
      expect(item?.classList.contains("grid-cols-subgrid")).toBe(true);
      // The number sits in a caption box, outside the link but in its name.
      const number = item?.querySelector("[data-slot=caption-box] span[id]");
      const link = within(row).getByRole("link");
      expect(link.getAttribute("aria-labelledby")).toBe(`${number?.id} ${link.id}`);
    }
  });

  it("rules off each turn of the read state, inside the list items", () => {
    // desc: Extra, 10, 9.5 unread; 2, 1 read → one turn, above chapter 2.
    render(<ChapterList chapters={chapters} />);
    const list = screen.getByRole("list");
    for (const child of list.children) expect(child.tagName).toBe("LI");
    const ruled = screen
      .getAllByRole("listitem")
      .filter((row) => row.firstElementChild?.getAttribute("data-slot") === "separator");
    expect(ruled.map((row) => within(row).getByRole("link").getAttribute("href"))).toEqual([
      "/c/2",
    ]);
  });

  it("rules every turn, and none when the state never changes", () => {
    const mixed = [
      { number: 1, title: "A", href: "/1", read: true },
      { number: 2, title: "B", href: "/2" },
      { number: 3, title: "C", href: "/3", read: true },
      { number: 4, title: "D", href: "/4" },
    ];
    const { unmount } = render(<ChapterList chapters={mixed} order="asc" />);
    expect(document.querySelectorAll("[data-slot=separator]")).toHaveLength(3);
    unmount();
    render(<ChapterList chapters={mixed.map((c) => ({ ...c, read: false }))} />);
    expect(document.querySelectorAll("[data-slot=separator]")).toHaveLength(0);
  });

  it("gives every row's link a unique id, across two lists on one page", () => {
    render(
      <>
        <ChapterList chapters={chapters} label="One" />
        <ChapterList chapters={chapters} label="Two" />
      </>,
    );
    const ids = [...document.querySelectorAll("[id]")].map((node) => node.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("stamps the latest chapter only, and nothing with latest={false}", () => {
    const { unmount } = render(<ChapterList chapters={chapters} />);
    const latest = screen.getAllByRole("listitem").filter((row) => row.dataset.latest === "true");
    expect(latest).toHaveLength(1);
    expect(within(latest[0]).getByRole("link")?.getAttribute("href")).toBe("/c/10");
    const stamps = document.querySelectorAll("[data-slot=stamp]");
    expect(stamps).toHaveLength(1);
    expect(stamps[0]?.textContent).toContain("NEW");
    expect(stamps[0]?.getAttribute("aria-hidden")).toBe("true");
    unmount();

    render(<ChapterList chapters={chapters} latest={false} />);
    expect(document.querySelectorAll("[data-slot=stamp]")).toHaveLength(0);
    expect(screen.queryByText(", latest")).toBeNull();
  });

  it("writes 第N話 under lang=ja with the stamp and the states in Japanese", () => {
    render(<ChapterList chapters={chapters} numerals="ja" label="話一覧" />);
    const label = screen.getByText("第10話");
    expect(label?.getAttribute("lang")).toBe("ja");
    expect(screen.getAllByText(", 既読")).toHaveLength(2);
    expect(screen.getByText(", 最新")?.getAttribute("lang")).toBe("ja");
    const stamp = document.querySelector("[data-slot=stamp]");
    expect(stamp?.textContent).toContain("最新");
    expect(stamp?.getAttribute("lang")).toBe("ja");
  });

  it("shows the date under the title, outside the link's name", () => {
    render(<ChapterList chapters={chapters} className="mx-auto" />);
    const date = screen.getByText("2026-11-02");
    expect(date.getAttribute("data-slot")).toBe("item-description");
    expect(date.closest("a")).toBeNull();
    expect(screen.getByRole("navigation")?.classList.contains("mx-auto")).toBe(true);
  });

  expectDemosAccessible(import.meta.glob("./demos/*.tsx"));
});
