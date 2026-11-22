"use client";

import { useState } from "react";
import { DirectionProvider } from "@/registry/ui/direction/direction";
import { Slider } from "@/registry/ui/slider/slider";

const PAGES = 18;

export default function DirectionReadingOrderVariant() {
  const [page, setPage] = useState(5);

  return (
    <div className="grid w-full max-w-xs gap-3">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span id="direction-reading-order-label" className="font-medium">
          Chapter 12
        </span>
        <span className="text-muted-foreground">
          Page {page} of {PAGES}
        </span>
      </div>
      {/* An English reader for a manga: only the page scrubber runs right to left, so page 1
          is at the right edge and the left arrow key turns to the next page. */}
      <DirectionProvider direction="rtl">
        <div dir="rtl">
          <Slider
            aria-labelledby="direction-reading-order-label"
            min={1}
            max={PAGES}
            value={[page]}
            onValueChange={(value) => setPage(Array.isArray(value) ? value[0] : value)}
          />
        </div>
      </DirectionProvider>
    </div>
  );
}
