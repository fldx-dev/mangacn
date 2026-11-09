import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { expectNoA11yViolations } from "@/lib/test/axe";
import { stubResizeObserver } from "@/lib/test/resize-observer";
import { ChapterList } from "./chapter-list";
import { chapterLabel, latestChapter, orderChapters } from "./chapter-numeral";
import ChapterListDefaultDemo from "./demos/default";

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

/** The rows' link names, top to bottom. */
function linkNames(): string[] {
  return screen.getAllByRole("link").map((link) => link.textContent ?? "");
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
    expect(linkNames()).toEqual([
      "Chapter 1First, read",
      "Chapter 2Second, read",
      "Chapter 9.5Interlude",
      "Chapter 10Tenth, latest",
      "Chapter ExtraOmake",
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

  it("separates rows with hand-drawn rules and shows the date", () => {
    render(<ChapterList chapters={chapters} className="mx-auto" />);
    expect(document.querySelectorAll("[data-slot=separator]")).toHaveLength(4);
    expect(screen.getByText("2026-11-02")).toBeTruthy();
    expect(screen.getByRole("navigation")?.classList.contains("mx-auto")).toBe(true);
  });

  it("has no axe violations in its default demo", async () => {
    stubResizeObserver();
    await expectNoA11yViolations(<ChapterListDefaultDemo />);
  });
});
