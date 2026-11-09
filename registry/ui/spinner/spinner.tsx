import { cn } from "cn";
import type * as React from "react";

// Based on shadcn/ui Spinner (MIT, https://ui.shadcn.com), base-nova style, fetched 2026-11-09.
// Restyled for mangacn: stock's lucide loader becomes the `ink-splash-loader` blot with its
// droplets, one SVG at icon size (16 px by default; `size-5`, `size-6` for 20 and 24 px). It
// turns with stock's `animate-spin` and stands still under reduced motion; no `motion`.

/** The blot: a lumpy ink drop on a 48 × 48 grid (the same drop as `ink-splash-loader`). */
const BLOT =
  "M24 9c4 0 5.5 3.5 8.5 4.5s7.5-.5 8.5 3.5-2.5 6-2 9 4 5.5 1.5 8.5-6.5 1-9 3-3 5.5-7.5 5.5-5-4-7.5-5.5-6.5.5-8.5-3 1.5-5.5 1-8.5-4-5-2-8.5 5.5-1.5 8-3.5S20 9 24 9Z";

/** Droplets flung out by the splash: centre and radius. */
const DROPS = [
  { cx: 43, cy: 9, r: 2.5 },
  { cx: 6, cy: 13, r: 2 },
  { cx: 41, cy: 42, r: 1.75 },
  { cx: 8, cy: 40, r: 2.25 },
] as const;

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <svg
      data-slot="spinner"
      role="status"
      aria-label="Loading"
      viewBox="0 0 48 48"
      fill="currentColor"
      className={cn("size-4 shrink-0 animate-spin motion-reduce:animate-none", className)}
      {...props}
    >
      <path d={BLOT} />
      {DROPS.map((drop) => (
        <circle key={`${drop.cx}-${drop.cy}`} {...drop} />
      ))}
    </svg>
  );
}

export { Spinner };
