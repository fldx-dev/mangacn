"use client";

import * as React from "react";
import {
  spreadIndexOf,
  spreadPages,
  spreadStarts,
} from "@/components/blocks/spread-viewer/use-spread";

/**
 * Where the reader's page lives in the address: `read` returns the current query string
 * (`window.location.search`, `useSearchParams().toString()`), `write` takes the new one
 * (`?page=5`, other parameters kept) and puts it in the address, with `history.replaceState`
 * or your router's `replace`. The hook never touches `window` or a router itself.
 */
export interface ReaderUrl {
  read: () => string;
  write: (search: string) => void;
}

export interface UseReaderOptions {
  /** How many pages the chapter has. */
  count: number;
  /**
   * The reader's page, controlled: an index into the pages (0 is the first). A turn calls
   * `onPageChange` and waits for the new `page`. Leave it out to let the hook keep the page.
   */
  page?: number;
  /** Called with the new page (an index) whenever the reader turns, controlled or not. */
  onPageChange?: (page: number) => void;
  /**
   * The page to open at when the hook keeps the page and the address has none.
   * @default 0
   */
  start?: number;
  /**
   * One page at a time, as the spread viewer shows it; the progress counts the last page on
   * screen, so it needs to know.
   * @default false
   */
  single?: boolean;
  /**
   * Keeps the page in the address's `?page=` (from 1): read once after mount, written on every
   * turn.
   */
  url?: ReaderUrl;
}

export interface ReaderState {
  /** The reader's page, an index into the pages (0-based), clamped to the chapter. */
  page: number;
  /** Turns to a page (an index); what a spread viewer's `onPageChange` takes. */
  setPage: (page: number) => void;
  /** The last page on screen, from 1: 5 when pages 4–5 are open. */
  current: number;
  /** How many pages the chapter has. */
  count: number;
  /** The progress as text: "Page 5 of 24". */
  progress: string;
}

/** A page index clamped to the chapter (0 when there are no pages). */
function clamp(index: number, count: number): number {
  if (count <= 0) return 0;
  return Math.min(Math.max(Math.trunc(index) || 0, 0), count - 1);
}

/**
 * The page in a query string's `page` parameter, as an index: `?page=5` → 4, clamped to the
 * chapter. `undefined` when there is none or it is not a whole number.
 */
export function readPageParam(search: string, count: number): number | undefined {
  const value = new URLSearchParams(search).get("page");
  if (value === null || !/^\s*-?\d+\s*$/.test(value)) return undefined;
  return clamp(Number(value) - 1, count);
}

/** The query string with `page` set to the page index's number (from 1), others kept. */
export function writePageParam(search: string, page: number): string {
  const params = new URLSearchParams(search);
  params.set("page", String(page + 1));
  return `?${params.toString()}`;
}

/** "Page 5 of 24": the last page on screen (from 1) and the count. */
export function readerProgress(current: number, count: number): string {
  return count > 0 ? `Page ${current} of ${count}` : "";
}

/**
 * The page state of a chapter reader: which page the reader is at (controlled by `page` and
 * `onPageChange`, or its own), kept in the address through `url`, and the progress. `Reader`
 * is built on it; use it in your page to wire the address to your router and pass `page` and
 * `setPage` to the reader.
 */
export function useReader({
  count,
  page: controlled,
  onPageChange,
  start = 0,
  single = false,
  url,
}: UseReaderOptions): ReaderState {
  const [own, setOwn] = React.useState(() => clamp(start, count));
  const isControlled = controlled !== undefined;
  const page = clamp(isControlled ? controlled : own, count);

  const latest = React.useRef({ onPageChange, url, isControlled, count });
  React.useEffect(() => {
    latest.current = { onPageChange, url, isControlled, count };
  });

  // The address wins over `start` once the page has hydrated (the server cannot read it).
  React.useEffect(() => {
    const { url: address, isControlled: held, count: pages } = latest.current;
    if (!address) return;
    const fromUrl = readPageParam(address.read(), pages);
    if (fromUrl === undefined) return;
    if (held) latest.current.onPageChange?.(fromUrl);
    else setOwn(fromUrl);
  }, []);

  const setPage = React.useCallback((next: number) => {
    const { onPageChange: notify, url: address, isControlled: held, count: pages } = latest.current;
    const target = clamp(next, pages);
    if (!held) setOwn(target);
    notify?.(target);
    address?.write(writePageParam(address.read(), target));
  }, []);

  const shown = spreadPages(
    spreadStarts(count, single)[spreadIndexOf(page, count, single)] ?? 0,
    count,
    single,
  );
  const current = count > 0 ? (shown.at(-1) ?? 0) + 1 : 0;

  return { page, setPage, current, count, progress: readerProgress(current, count) };
}
