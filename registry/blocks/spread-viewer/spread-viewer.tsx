"use client";

import { cn } from "cn";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import { useReducedMotion } from "motion/react";
import * as React from "react";
import { preload } from "react-dom";
import { MangaFrame } from "@/components/manga-frame";
import { PageNumber } from "@/components/page-number";
import { PageTurn } from "@/components/page-turn";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import {
  type SpreadDirection,
  type SpreadSide,
  spreadPages,
  spreadStarts,
  useSpread,
} from "./use-spread";

// The paging state, for chrome of your own around the pages.
export type { Spread, SpreadDirection, SpreadSide, UseSpreadOptions } from "./use-spread";
export { useSpread } from "./use-spread";

/** One page of the book. */
export interface SpreadPage {
  /** The page image's URL, passed to a plain `<img>`. */
  src: string;
  /** What the page shows, for readers who cannot see it. */
  alt: string;
}

export interface SpreadViewerProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange" | "children"> {
  /** The pages in reading order. Portrait images read best (each frame is 3:4). */
  pages: SpreadPage[];
  /**
   * `rtl` reads like a manga: the earlier page on the right, Left arrow for the next spread;
   * `ltr` like a western book.
   * @default "rtl"
   */
  direction?: SpreadDirection;
  /**
   * The page to open at, as an index into `pages` (0 is the first); the viewer opens the spread
   * that holds it.
   * @default 0
   */
  start?: number;
  /** Called with the index of the new spread's first page whenever the reader turns. */
  onChange?: (first: number) => void;
  /**
   * The reader's page, controlled: an index into `pages`. The viewer opens the spread that
   * holds it, and a turn calls `onPageChange` instead of moving on its own. A page outside the
   * book is clamped and reported once through `onPageChange`. Leave it out to use `start`.
   */
  page?: number;
  /**
   * Called with the index of the new spread's first page whenever the reader turns, controlled
   * or not.
   */
  onPageChange?: (page: number) => void;
  /**
   * One page at a time, for phones; pass it from a media query.
   * @default false
   */
  single?: boolean;
  /**
   * What fills the side facing a lone page (the first page, an even last page): a halftone, the
   * inside of the cover. It fills a 3:4 box beside the page.
   * @default plain paper
   */
  blank?: React.ReactNode;
  /**
   * The region's name, which says what is being read ("Chapter 12").
   * @default "Pages"
   */
  label?: string;
}

/** How far (px) a finger has to travel sideways before a swipe turns the page. */
const SWIPE = 40;

/**
 * A two-page manga spread: two facing pages in manga-frames that meet at the spine and bleed to
 * the viewer's outer edges, a folio under each, a page-turn between spreads (instant under
 * reduced motion), previous and next buttons, and a help line. Reads right to left by default.
 * A `role="region"` named by `label`: the arrow keys page in reading order (Left is next in
 * `rtl`), Home and End go to the ends, a swipe turns the page, and a polite live region says
 * "Pages 4–5 of 24". The paging state is `useSpread`, exported for custom chrome.
 */
export function SpreadViewer({
  pages,
  direction = "rtl",
  start = 0,
  onChange,
  page,
  onPageChange,
  single = false,
  blank,
  label = "Pages",
  className,
  onKeyDown,
  ...props
}: SpreadViewerProps) {
  const count = pages.length;
  const spread = useSpread({ count, direction, single, start, onChange, page, onPageChange });
  const reduce = useReducedMotion() ?? false;

  // The current pages load first; the next spread is fetched ahead so a turn shows it at once.
  // Pages further on are not rendered at all, so they load only when the reader gets there.
  const starts = spreadStarts(count, single);
  const upcoming = starts[spread.index + 1];
  if (upcoming !== undefined) {
    for (const index of spreadPages(upcoming, count, single)) {
      preload(pages[index].src, { as: "image" });
    }
  }

  const swipe = React.useRef<{ id: number; x: number; y: number } | null>(null);
  const onPointerDown = (event: React.PointerEvent) => {
    if (!event.isPrimary) return;
    swipe.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
  };
  const onPointerUp = (event: React.PointerEvent) => {
    const from = swipe.current;
    swipe.current = null;
    if (!from || from.id !== event.pointerId) return;
    const dx = event.clientX - from.x;
    const dy = event.clientY - from.y;
    if (Math.abs(dx) < SWIPE || Math.abs(dx) < Math.abs(dy)) return;
    // A finger moving right drags the left-hand side into view, as the Left arrow does.
    const key = dx > 0 ? "ArrowLeft" : "ArrowRight";
    if (key === spread.nextKey) spread.next();
    else spread.previous();
  };

  const sides: SpreadSide[] = single ? ["left"] : ["left", "right"];
  // Which button sits on which side: the one that reads on points the way the book reads.
  const leftIsNext = direction === "rtl";
  const nextButton = (
    <Button variant="outline" onClick={spread.next} disabled={!spread.canNext}>
      {leftIsNext && <ArrowLeftIcon data-icon="inline-start" aria-hidden />}
      Next
      {!leftIsNext && <ArrowRightIcon data-icon="inline-end" aria-hidden />}
    </Button>
  );
  const previousButton = (
    <Button variant="outline" onClick={spread.previous} disabled={!spread.canPrevious}>
      {!leftIsNext && <ArrowLeftIcon data-icon="inline-start" aria-hidden />}
      Previous
      {leftIsNext && <ArrowRightIcon data-icon="inline-end" aria-hidden />}
    </Button>
  );
  // The arrows drawn as icons (a font's arrow glyph is tiny in the key cap), named in words.
  const arrow = (key: "ArrowLeft" | "ArrowRight") => (
    <Kbd>
      {key === "ArrowLeft" ? <ArrowLeftIcon aria-hidden /> : <ArrowRightIcon aria-hidden />}
      <span className="sr-only">{key === "ArrowLeft" ? "Left arrow" : "Right arrow"}</span>
    </Kbd>
  );

  return (
    // biome-ignore lint/a11y/useSemanticElements: a <section> has no roledescription; the region role is the point.
    <div
      role="region"
      aria-roledescription="spread"
      aria-label={label}
      // biome-ignore lint/a11y/noNoninteractiveTabindex: the region takes the arrow keys, so it takes focus.
      tabIndex={0}
      data-slot="spread-viewer"
      data-direction={direction}
      data-single={single ? "true" : undefined}
      className={cn(
        "flex w-full flex-col gap-3 rounded-sm text-ink outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring",
        single ? "max-w-sm" : "max-w-3xl",
        className,
      )}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (!event.defaultPrevented) spread.onKeyDown(event);
      }}
      {...props}
    >
      <div
        data-slot="spread-viewer-pages"
        className={cn("grid touch-pan-y select-none", single ? "grid-cols-1" : "grid-cols-2")}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          swipe.current = null;
        }}
      >
        {sides.map((side) => {
          const index = spread.sides[side];
          // The folio hugs the page's outer corner: away from the spine.
          const folioSide: SpreadSide = single ? (direction === "rtl" ? "left" : "right") : side;
          return (
            <div
              key={side}
              data-slot="spread-viewer-page"
              data-side={side}
              className="flex min-w-0 flex-col gap-1.5"
            >
              {/* Each half swings away around the spine (single: the binding edge). */}
              <PageTurn
                pageKey={index ?? "blank"}
                direction={single ? direction : side === "left" ? "rtl" : "ltr"}
                duration={reduce ? 0 : 0.5}
              >
                {index === null ? (
                  <div data-slot="spread-viewer-blank" className="grid aspect-3/4 w-full">
                    {blank}
                  </div>
                ) : (
                  <MangaFrame
                    src={pages[index].src}
                    alt={pages[index].alt}
                    aspect="3/4"
                    fetchPriority="high"
                    draggable={false}
                  />
                )}
              </PageTurn>
              {index !== null && (
                <PageNumber
                  page={index + 1}
                  of={count}
                  side={folioSide}
                  className={folioSide === "right" ? "self-end" : "self-start"}
                />
              )}
            </div>
          );
        })}
      </div>
      <div
        data-slot="spread-viewer-controls"
        // A container: the help line goes between the buttons only when the controls are wide
        // enough (a two-page spread on a desktop), whatever the viewport; else it takes its own row.
        className="@container flex flex-wrap items-center justify-between gap-x-3 gap-y-2"
      >
        {leftIsNext ? nextButton : previousButton}
        <p
          data-slot="spread-viewer-help"
          className="order-last basis-full text-center text-xs text-muted-foreground @2xl:order-none @2xl:basis-auto"
        >
          {arrow(spread.nextKey)} next, {arrow(spread.previousKey)} previous, <Kbd>Home</Kbd>{" "}
          <Kbd>End</Kbd> first and last
        </p>
        {leftIsNext ? previousButton : nextButton}
      </div>
      <p data-slot="spread-viewer-status" aria-live="polite" className="sr-only">
        {spread.announcement}
      </p>
    </div>
  );
}
