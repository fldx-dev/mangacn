import { cn } from "cn";
import type * as React from "react";
import { useId } from "react";
import { CaptionBox } from "@/components/caption-box";
import { InkMark } from "@/components/ink-mark";
import { Stamp } from "@/components/stamp";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
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
 * stamped. Each row is an `item` (outlined while unread, muted once read) with the number in a
 * caption box; a hand-drawn rule marks each place the read state changes ("read up to here"),
 * inside the list item below it, so the list holds only list items. A server component; it
 * composes item, caption-box, stamp, ink-mark and separator
 * and draws nothing of its own.
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
  const id = useId();

  return (
    <nav
      data-slot="chapter-list"
      data-order={order}
      aria-label={label}
      className={cn("w-full max-w-xl text-ink", className)}
      {...props}
    >
      <ol className="flex flex-col gap-2">
        {rows.map((chapter, index) => {
          const isLatest = chapter === newest;
          const turn = index > 0 && Boolean(chapter.read) !== Boolean(rows[index - 1].read);
          const numberId = `${id}-${index}-number`;
          const linkId = `${id}-${index}-link`;
          return (
            <li
              key={`${chapter.number}-${chapter.href}`}
              data-slot="chapter-list-row"
              data-read={chapter.read ? "true" : undefined}
              data-latest={isLatest ? "true" : undefined}
              className="flex flex-col"
            >
              {/* Where the read state turns, a rule; inside the list item, since a separator
                  straight under <ol> is not a list item (axe aria-required-children). */}
              {turn && <Separator className="mb-2" />}
              <Item
                variant={chapter.read ? "muted" : "outline"}
                size="sm"
                className={cn(
                  "flex-nowrap gap-3 has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-solid has-[a:focus-visible]:outline-ring has-[a:focus-visible]:outline-offset-2",
                  chapter.read ? "has-[a:hover]:bg-tone-2" : "has-[a:hover]:[--paper:var(--muted)]",
                )}
              >
                <ItemMedia>
                  <CaptionBox font="body" className="whitespace-nowrap">
                    <span id={numberId} lang={lang}>
                      {chapterLabel(chapter.number, numerals)}
                    </span>
                  </CaptionBox>
                </ItemMedia>
                <ItemContent className="min-w-0 gap-0.5">
                  <ItemTitle className="line-clamp-none block w-auto text-base wrap-break-word">
                    {/* Named by the number and its own text (title, then the hidden state); its
                        ::after covers the row, so the whole card is the link's hit area. */}
                    <a
                      id={linkId}
                      href={chapter.href}
                      aria-labelledby={`${numberId} ${linkId}`}
                      className={cn(
                        "outline-none after:absolute after:inset-0",
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
                  </ItemTitle>
                  {chapter.date && (
                    <ItemDescription className="text-xs">{chapter.date}</ItemDescription>
                  )}
                </ItemContent>
                {isLatest && (
                  <ItemActions className="shrink-0">
                    <Stamp size="sm" rotate={-8} aria-hidden lang={lang} className="-my-3">
                      {numerals === "ja" ? "最新" : "NEW"}
                    </Stamp>
                  </ItemActions>
                )}
              </Item>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
