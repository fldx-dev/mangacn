"use client";

import { cn } from "cn";
import { ListIcon } from "lucide-react";
import type * as React from "react";
import { useId } from "react";
import { type Chapter, ChapterList } from "@/components/blocks/chapter-list/chapter-list";
import {
  type SpreadDirection,
  type SpreadPage,
  SpreadViewer,
} from "@/components/blocks/spread-viewer/spread-viewer";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Kbd } from "@/components/ui/kbd";
import { Progress, ProgressLabel } from "@/components/ui/progress";
import { useReader } from "./use-reader";

// The page state, for wiring the address to your router.
export type { ReaderState, ReaderUrl, UseReaderOptions } from "./use-reader";
export { readerProgress, readPageParam, useReader, writePageParam } from "./use-reader";

/** The chapter being read. */
export interface ReaderChapter {
  /** Its number, as the chapter list shows it. */
  number: number | string;
  /** Its title. */
  title: string;
}

export interface ReaderProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "children" | "onChange"> {
  /** The series' name, above the chapter's. */
  series: string;
  /** The chapter on the page. */
  chapter: ReaderChapter;
  /** The chapter's pages in reading order, as spread-viewer takes them. */
  pages: SpreadPage[];
  /** Every chapter of the series, for the drawer's chapter list (as chapter-list takes them). */
  chapters: Chapter[];
  /**
   * `rtl` reads like a manga, `ltr` like a western book.
   * @default "rtl"
   */
  direction?: SpreadDirection;
  /**
   * The reader's page, controlled: an index into `pages`. Wire it to the address with
   * `useReader` (its `url` option) and pass `page` and `setPage` here. Leave it out to let the
   * reader keep the page.
   */
  page?: number;
  /** Called with the new page (an index) whenever the reader turns. */
  onPageChange?: (page: number) => void;
  /**
   * One page at a time, for phones; pass it from a media query.
   * @default false
   */
  single?: boolean;
  /**
   * `main` makes the reader the page's one main region, as a chapter page is. Use `section`
   * (a region named by the chapter) inside a page that has a main of its own.
   * @default "main"
   */
  as?: "main" | "section";
}

/**
 * A chapter page: the series and chapter in a header, the pages in a spread viewer (its keys,
 * buttons and swipe turn them; nothing else takes the arrow keys), the progress ("Page 5 of
 * 24") and a drawer with the series' chapter list, which returns focus to its trigger when it
 * closes. The page is `useReader`'s: controlled with `page` and `onPageChange` (to keep it in
 * the address), or the reader's own. Composes spread-viewer and chapter-list with drawer,
 * progress, button and kbd, and draws nothing of its own.
 */
export function Reader({
  series,
  chapter,
  pages,
  chapters,
  direction = "rtl",
  page,
  onPageChange,
  single = false,
  as: Root = "main",
  className,
  ...props
}: ReaderProps) {
  const id = useId();
  const headingId = `${id}-heading`;
  const reader = useReader({ count: pages.length, page, onPageChange, single });
  const Heading = Root === "main" ? "h1" : "h2";
  const chapterName = `Chapter ${chapter.number}`;

  return (
    <Root
      data-slot="reader"
      aria-labelledby={headingId}
      className={cn("flex w-full max-w-3xl flex-col gap-4 text-ink", className)}
      {...props}
    >
      <header data-slot="reader-header" className="flex flex-wrap items-end justify-between gap-3">
        <Heading id={headingId} className="flex min-w-0 flex-col gap-1">
          <span className="text-sm text-muted-foreground">{series}</span>
          {/* Keeps the two apart when read or copied; the flex column ignores it. */}{" "}
          <span className="font-display text-2xl leading-tight wrap-break-word sm:text-3xl">
            {`${chapterName}: ${chapter.title}`}
          </span>
        </Heading>
        <Drawer>
          <DrawerTrigger render={<Button variant="outline" />}>
            <ListIcon data-icon="inline-start" aria-hidden />
            Chapters
          </DrawerTrigger>
          <DrawerContent>
            <div className="mx-auto flex max-h-[80vh] w-full max-w-xl flex-col">
              <DrawerHeader>
                <DrawerTitle>{series}</DrawerTitle>
                <DrawerDescription>{`Reading ${chapterName}, ${reader.progress}`}</DrawerDescription>
              </DrawerHeader>
              <div className="min-h-0 overflow-y-auto px-4 py-1">
                <ChapterList chapters={chapters} label={`${series} chapters`} />
              </div>
              <DrawerFooter className="flex-row items-center justify-between gap-3">
                <p
                  data-slot="reader-help"
                  className="text-xs text-muted-foreground pointer-coarse:hidden"
                >
                  <Kbd>Esc</Kbd> closes
                </p>
                <DrawerClose render={<Button variant="outline" />}>Close</DrawerClose>
              </DrawerFooter>
            </div>
          </DrawerContent>
        </Drawer>
      </header>
      <SpreadViewer
        pages={pages}
        direction={direction}
        single={single}
        page={reader.page}
        onPageChange={reader.setPage}
        label={chapterName}
        className="mx-auto"
      />
      <Progress
        value={reader.current}
        max={Math.max(pages.length, 1)}
        getAriaValueText={() => reader.progress}
        className="w-full"
      >
        <ProgressLabel data-slot="reader-progress">{reader.progress}</ProgressLabel>
      </Progress>
    </Root>
  );
}
