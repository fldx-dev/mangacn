/** How a chapter's number is written: "Chapter 12", or 第12話 (set under `lang="ja"`). */
export type ChapterNumerals = "latin" | "ja";

/** The order rows are listed in: newest first (`desc`) or reading order (`asc`). */
export type ChapterOrder = "desc" | "asc";

/** One chapter of the series, as `ChapterList` takes it. */
export interface Chapter {
  /** The chapter's number: `12`, or a string for one that is not a whole number (`"12.5"`). */
  number: number | string;
  /** The chapter's title. */
  title: string;
  /** Where the row links: the chapter's reader page. */
  href: string;
  /** When it came out, as it should read ("2026-11-02", "Nov 2"); shown as written. */
  date?: string;
  /** Whether the reader has read it: the title is struck through and the state announced. */
  read?: boolean;
}

/** `12` → "Chapter 12", `"12.5"` → 第12.5話: the label a row's number reads as. */
export function chapterLabel(number: number | string, numerals: ChapterNumerals = "latin"): string {
  return numerals === "ja" ? `第${number}話` : `Chapter ${number}`;
}

/** The words for a row's state in the list's language, said only to assistive technology. */
export function stateWords(numerals: ChapterNumerals = "latin"): { read: string; latest: string } {
  return numerals === "ja" ? { read: "既読", latest: "最新" } : { read: "read", latest: "latest" };
}

/** A chapter number's numeric value, or `NaN` for one that is not a number ("Extra"). */
function numericValue(number: number | string): number {
  return typeof number === "number" ? number : Number(number.trim() || Number.NaN);
}

/**
 * The chapters in reading order: by number, ascending, with numbers that are not numbers
 * ("Extra") after the numbered ones in the order given; `desc` reverses it, newest first.
 * The input array is left as it is.
 */
export function orderChapters<T extends Pick<Chapter, "number">>(
  chapters: readonly T[],
  order: ChapterOrder = "desc",
): T[] {
  const reading = chapters
    .map((chapter, index) => ({ chapter, index, value: numericValue(chapter.number) }))
    .sort((a, b) => {
      const aNumbered = !Number.isNaN(a.value);
      const bNumbered = !Number.isNaN(b.value);
      if (aNumbered !== bNumbered) return aNumbered ? -1 : 1;
      return (aNumbered && bNumbered ? a.value - b.value : 0) || a.index - b.index;
    })
    .map(({ chapter }) => chapter);
  return order === "desc" ? reading.reverse() : reading;
}

/**
 * The latest chapter: the highest-numbered one (an "Extra" after it does not take its place),
 * or the last given when none is numbered.
 */
export function latestChapter<T extends Pick<Chapter, "number">>(
  chapters: readonly T[],
): T | undefined {
  const reading = orderChapters(chapters, "asc");
  return (
    reading.findLast((chapter) => !Number.isNaN(numericValue(chapter.number))) ?? reading.at(-1)
  );
}
