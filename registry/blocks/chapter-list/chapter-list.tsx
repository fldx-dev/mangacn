import { cn } from "cn";
import type * as React from "react";
import { CaptionBox } from "@/components/caption-box";
import { InkMark } from "@/components/ink-mark";
import { Stamp } from "@/components/stamp";
import { Separator } from "@/components/ui/separator";
import {
  type Chapter,
  type ChapterNumerals,
  type ChapterOrder,
  chapterLabel,
  latestChapter,
  orderChapters,
  stateWords,
} from "./chapter-numeral";

export type { Chapter, ChapterNumerals, ChapterOrder };

export interface ChapterListProps extends Omit<React.ComponentProps<"nav">, "children"> {
  /** The series' chapters, in any order; each row links to its `href`. */
  chapters: Chapter[];
  /**
   * `desc` lists the newest chapter first; `asc` in reading order. Rows are ordered by number,
   * with numbers that are not numbers ("Extra") after the numbered ones.
   * @default "desc"
   */
  order?: ChapterOrder;
  /**
   * Stamps the highest-numbered chapter (NEW, or 最新 with `numerals="ja"`), the first row of a
   * `desc` list.
   * @default true
   */
  latest?: boolean;
  /**
   * `latin` writes "Chapter 12"; `ja` writes 第12話 under `lang="ja"`, with the stamp and the
   * announced read state in Japanese too.
   * @default "latin"
   */
  numerals?: ChapterNumerals;
  /**
   * The navigation landmark's name, which tells it apart from the page's other navs.
   * @default "Chapters"
   */
  label?: string;
}

/**
 * A chapter index for a series: a named `<nav>` around an ordered list, one link per chapter
 * named by its number and title, the read state struck through and announced, the latest
 * stamped. A server component; it composes caption-box, stamp, ink-mark and separator and draws
 * nothing of its own.
 */
export function ChapterList({
  chapters,
  order = "desc",
  latest = true,
  numerals = "latin",
  label = "Chapters",
  className,
  ...props
}: ChapterListProps) {
  const rows = orderChapters(chapters, order);
  const newest = latest ? latestChapter(chapters) : undefined;
  const words = stateWords(numerals);
  const lang = numerals === "ja" ? "ja" : undefined;

  return (
    <nav
      data-slot="chapter-list"
      data-order={order}
      aria-label={label}
      className={cn("w-full max-w-xl text-ink", className)}
      {...props}
    >
      <ol className="flex flex-col">
        {rows.map((chapter, index) => {
          const isLatest = chapter === newest;
          return (
            <li
              key={`${chapter.number}-${chapter.href}`}
              data-slot="chapter-list-row"
              data-read={chapter.read ? "true" : undefined}
              data-latest={isLatest ? "true" : undefined}
              className="relative flex flex-col"
            >
              {index > 0 && <Separator />}
              <div className="flex items-center gap-3 py-3">
                {/* The link covers the row (its ::after), so the date and stamp click through. */}
                <a
                  href={chapter.href}
                  className="flex min-w-0 flex-1 items-center gap-3 rounded-sm after:absolute after:inset-0 focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
                >
                  <CaptionBox font="body" className="shrink-0 whitespace-nowrap">
                    <span lang={lang}>{chapterLabel(chapter.number, numerals)}</span>
                  </CaptionBox>
                  <span
                    className={cn(
                      "min-w-0 font-display text-base",
                      chapter.read && "text-muted-foreground",
                    )}
                  >
                    {chapter.read ? (
                      <InkMark kind="strike" color="tone">
                        {chapter.title}
                      </InkMark>
                    ) : (
                      chapter.title
                    )}
                  </span>
                  {chapter.read && (
                    <span className="sr-only" lang={lang}>
                      {`, ${words.read}`}
                    </span>
                  )}
                  {isLatest && (
                    <span className="sr-only" lang={lang}>
                      {`, ${words.latest}`}
                    </span>
                  )}
                </a>
                {chapter.date && (
                  <span className="shrink-0 text-xs text-muted-foreground">{chapter.date}</span>
                )}
                {isLatest && (
                  <Stamp size="sm" rotate={-8} aria-hidden lang={lang} className="shrink-0">
                    {numerals === "ja" ? "最新" : "NEW"}
                  </Stamp>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
