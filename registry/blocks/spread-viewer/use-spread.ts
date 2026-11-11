"use client";

import * as React from "react";

/** Reading direction: `rtl` like a manga (the earlier page on the right), `ltr` like a western book. */
export type SpreadDirection = "rtl" | "ltr";

/** A side of the spine. */
export type SpreadSide = "left" | "right";

export interface UseSpreadOptions {
  /** How many pages the book has. */
  count: number;
  /**
   * Reading direction: which side the earlier page sits on and which arrow key reads on.
   * @default "rtl"
   */
  direction?: SpreadDirection;
  /**
   * One page at a time (phones) instead of two facing pages.
   * @default false
   */
  single?: boolean;
  /**
   * The page to open at, as an index into the pages (0 is the first); the viewer opens the
   * spread that holds it.
   * @default 0
   */
  start?: number;
  /** Called with the index of the new spread's first page whenever the reader turns. */
  onChange?: (first: number) => void;
  /**
   * The reader's page, controlled: an index into the pages (0 is the first). The spread that
   * holds it is open; a turn calls `onPageChange` and waits for the new `page`. A page outside
   * the book is clamped, and `onPageChange` is called once with the clamped index. Leave it
   * out to let the hook keep the page itself (from `start`).
   */
  page?: number;
  /**
   * Called with the index of the new spread's first page whenever the reader turns (both
   * modes), and once with the clamped index when a controlled `page` is out of bounds.
   */
  onPageChange?: (page: number) => void;
}

export interface Spread {
  /** The reader's page (0-based): the controlled `page` clamped to the book, or the hook's own. */
  page: number;
  /** The indices of the pages shown, in reading order: one or two. Empty when there are none. */
  pages: number[];
  /** The page on each side of the spine (`null` for a side left blank), for laying them out. */
  sides: Record<SpreadSide, number | null>;
  /** Which spread this is, from 0, and how many there are. */
  index: number;
  total: number;
  /** What a polite live region says: "Pages 4–5 of 24", or "Page 1 of 24". */
  announcement: string;
  canNext: boolean;
  canPrevious: boolean;
  next: () => void;
  previous: () => void;
  /** Opens the spread that holds page `index` (0-based). */
  goTo: (index: number) => void;
  goToFirst: () => void;
  goToLast: () => void;
  /**
   * Pages in reading order from the keyboard: the arrow that points the way the book reads is
   * next (Left in `rtl`), the other one previous, Home and End the first and last spreads.
   * Returns whether it handled the key (and then prevents its default).
   */
  onKeyDown: (event: React.KeyboardEvent) => boolean;
  /** The arrow key that reads on, and the one that reads back, for help text and swipes. */
  nextKey: "ArrowLeft" | "ArrowRight";
  previousKey: "ArrowLeft" | "ArrowRight";
  direction: SpreadDirection;
  single: boolean;
}

/**
 * The first page of every spread, as indices. One page at a time: every page. Two facing pages,
 * as a printed book: the first page alone (it faces the inside of the cover), then pairs that
 * start on an even page number (pages 2–3, 4–5, …), and a last even page alone.
 */
export function spreadStarts(count: number, single = false): number[] {
  if (count <= 0) return [];
  if (single) return Array.from({ length: count }, (_, index) => index);
  const starts = [0];
  for (let index = 1; index < count; index += 2) starts.push(index);
  return starts;
}

/** The pages of the spread that starts at `first`, in reading order. */
export function spreadPages(first: number, count: number, single = false): number[] {
  if (count <= 0) return [];
  if (single || first === 0 || first + 1 >= count) return [first];
  return [first, first + 1];
}

/** Which spread (its position in `spreadStarts`) holds page `index`, clamped to the book. */
export function spreadIndexOf(index: number, count: number, single = false): number {
  const starts = spreadStarts(count, single);
  if (starts.length === 0) return 0;
  const page = Math.min(Math.max(Math.trunc(index) || 0, 0), count - 1);
  let found = 0;
  starts.forEach((start, position) => {
    if (start <= page) found = position;
  });
  return found;
}

/**
 * Where each page of a spread sits. Pages with an odd number (the first, third, …) are on the
 * side the book reads towards, even ones on the side it reads from, as in print: in `rtl` page 2
 * is on the right and 3 on the left. One page at a time is reported on `left`, the only side
 * drawn.
 */
export function spreadSides(
  pages: number[],
  direction: SpreadDirection = "rtl",
  single = false,
): Record<SpreadSide, number | null> {
  const sides: Record<SpreadSide, number | null> = { left: null, right: null };
  if (single) {
    sides.left = pages[0] ?? null;
    return sides;
  }
  const later: SpreadSide = direction === "rtl" ? "left" : "right";
  const earlier: SpreadSide = later === "left" ? "right" : "left";
  for (const page of pages) sides[page % 2 === 0 ? later : earlier] = page;
  return sides;
}

/** "Pages 4–5 of 24" for two pages, "Page 1 of 24" for one (numbers from 1). */
export function spreadAnnouncement(pages: number[], count: number): string {
  if (pages.length === 0) return "";
  if (pages.length === 1) return `Page ${pages[0] + 1} of ${count}`;
  return `Pages ${pages[0] + 1}–${pages[pages.length - 1] + 1} of ${count}`;
}

/** A page index clamped to the book: a whole number from 0 to `count - 1` (0 for no pages). */
function clampPage(index: number, count: number): number {
  if (count <= 0) return 0;
  return Math.min(Math.max(Math.trunc(index) || 0, 0), count - 1);
}

/**
 * The paging state of a manga reader: which pages are open, in which order they sit, what to
 * announce, and the keyboard. `SpreadViewer` is built on it; use it on its own to draw your own
 * chrome around the pages.
 */
export function useSpread({
  count,
  direction = "rtl",
  single = false,
  start = 0,
  onChange,
  page: controlled,
  onPageChange,
}: UseSpreadOptions): Spread {
  // The page the reader is at; the spread is derived from it, so switching `single` keeps the
  // reader on the same page. Controlled, it is the `page` prop clamped to the book.
  const [own, setOwn] = React.useState(() => {
    const starts = spreadStarts(count, single);
    return starts[spreadIndexOf(start, count, single)] ?? 0;
  });
  const isControlled = controlled !== undefined;
  const page = isControlled ? clampPage(controlled, count) : own;
  const starts = spreadStarts(count, single);
  const index = spreadIndexOf(page, count, single);
  const first = starts[index] ?? 0;
  const pages = spreadPages(first, count, single);
  const total = starts.length;

  const onChangeRef = React.useRef(onChange);
  const onPageChangeRef = React.useRef(onPageChange);
  React.useEffect(() => {
    onChangeRef.current = onChange;
    onPageChangeRef.current = onPageChange;
  });

  // A controlled page outside the book is reported once with its clamped value, so the owner
  // can correct its state; the same wrong value is not reported again on every render.
  const reported = React.useRef<number | undefined>(undefined);
  React.useEffect(() => {
    if (!isControlled || count <= 0 || controlled === page) {
      reported.current = undefined;
      return;
    }
    if (reported.current === controlled) return;
    reported.current = controlled;
    onPageChangeRef.current?.(page);
  }, [isControlled, controlled, page, count]);

  const goToSpread = React.useCallback(
    (target: number) => {
      const list = spreadStarts(count, single);
      if (list.length === 0) return;
      const next = list[Math.min(Math.max(target, 0), list.length - 1)];
      if (next === first) return;
      if (!isControlled) setOwn(next);
      onChangeRef.current?.(next);
      onPageChangeRef.current?.(next);
    },
    [count, single, first, isControlled],
  );

  const next = React.useCallback(() => goToSpread(index + 1), [goToSpread, index]);
  const previous = React.useCallback(() => goToSpread(index - 1), [goToSpread, index]);
  const goToFirst = React.useCallback(() => goToSpread(0), [goToSpread]);
  const goToLast = React.useCallback(() => goToSpread(total - 1), [goToSpread, total]);
  const goTo = React.useCallback(
    (target: number) => goToSpread(spreadIndexOf(target, count, single)),
    [goToSpread, count, single],
  );

  const nextKey = direction === "rtl" ? "ArrowLeft" : "ArrowRight";
  const previousKey = direction === "rtl" ? "ArrowRight" : "ArrowLeft";

  const onKeyDown = React.useCallback(
    (event: React.KeyboardEvent) => {
      // Alt+Arrow is the browser's back and forward; leave modified keys alone.
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return false;
      const actions: Record<string, () => void> = {
        [nextKey]: next,
        [previousKey]: previous,
        Home: goToFirst,
        End: goToLast,
      };
      const action = actions[event.key];
      if (!action) return false;
      event.preventDefault();
      action();
      return true;
    },
    [nextKey, previousKey, next, previous, goToFirst, goToLast],
  );

  return {
    page,
    pages,
    sides: spreadSides(pages, direction, single),
    index,
    total,
    announcement: spreadAnnouncement(pages, count),
    canNext: index < total - 1,
    canPrevious: index > 0,
    next,
    previous,
    goTo,
    goToFirst,
    goToLast,
    onKeyDown,
    nextKey,
    previousKey,
    direction,
    single,
  };
}
