/**
 * The registry table's container scrolls by the overhang of its ink row rules (about 10 px past
 * the right edge, on the item's own stage too), which shows a scrollbar under a table that fits.
 * The landing's tables are sized to fit, so their containers let the ink hang over instead.
 */
export const TABLE_FITS = "[&_[data-slot=table-container]]:overflow-visible";

/** Commands wrap at their spaces instead of scrolling sideways in a box narrower than them. */
export const CODE_WRAPS =
  "[&_pre]:w-full [&_pre]:whitespace-pre-wrap [&_pre]:[overflow-wrap:anywhere] [&_pre_.line]:min-w-0";
