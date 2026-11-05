import { cn } from "cn";
import type * as React from "react";

export interface PageNumberProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** The number of this page. */
  page: number;
  /** The number of pages, printed after the page as `7 / 24` and read as "Page 7 of 24". */
  of?: number;
  /**
   * The page's outer corner, which the folio hugs: `right` for a right-hand page (the
   * default, as on most manga pages), `left` for a left-hand one. It aligns the text; place
   * the folio itself with `absolute` and the corner's edges.
   * @default "right"
   */
  side?: "left" | "right";
  /**
   * A small chapter mark above the number ("Ch. 12", or `<span lang="ja">第12話</span>`),
   * read before the page.
   */
  chapter?: React.ReactNode;
}

/**
 * A folio: the page number in the display face, with an optional page count and chapter mark.
 * Real text, read as "Page 7 of 24"; in flow on its own, or absolutely placed by the consumer
 * in a panel or page corner.
 */
export function PageNumber({ page, of, side, chapter, className, ...props }: PageNumberProps) {
  const resolvedSide = side ?? "right";
  return (
    <span
      data-slot="page-number"
      data-side={resolvedSide}
      className={cn(
        "inline-flex flex-col gap-0.5 font-display leading-none text-ink",
        resolvedSide === "right" ? "items-end text-right" : "items-start text-left",
        className,
      )}
      {...props}
    >
      {chapter != null && (
        <span data-slot="page-number-chapter" className="text-xs leading-none tracking-wide">
          {chapter}
        </span>
      )}
      {/* Keeps the chapter and the page apart when read or copied; a flex column ignores it. */}
      {chapter != null && " "}
      <span data-slot="page-number-page" className="text-base leading-none tabular-nums">
        {/* Read as words; the figures on screen are the same text without the words. */}
        <span className="sr-only">{of == null ? `Page ${page}` : `Page ${page} of ${of}`}</span>
        <span aria-hidden="true">
          {page}
          {of != null && (
            <span data-slot="page-number-of" className="text-xs">
              {" "}
              / {of}
            </span>
          )}
        </span>
      </span>
    </span>
  );
}
