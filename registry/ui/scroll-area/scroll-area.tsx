"use client";

import { ScrollArea as ScrollAreaPrimitive } from "@base-ui/react/scroll-area";
import { cn } from "cn";
import { InkFrame } from "@/components/ink-frame";

// Based on shadcn/ui Scroll Area (MIT, https://ui.shadcn.com), base-nova style, fetched 2026-11-09.
// Restyled for mangacn: the thumb is a short ink bar with rounded ends drawn by the pen, the
// track a thin hand-drawn rule along the scrollbar; the viewport keeps stock's classes and is
// named as a region (below).

/** A bar with round ends (a stadium) in the thumb's border box, for the pen to draw. */
function roundedBar(width: number, height: number): string {
  const r = Math.min(width, height) / 2;
  return width >= height
    ? `M ${r} 0 H ${width - r} A ${r} ${r} 0 0 1 ${width - r} ${height} H ${r} A ${r} ${r} 0 0 1 ${r} 0 Z`
    : `M 0 ${r} A ${r} ${r} 0 0 1 ${width} ${r} V ${height - r} A ${r} ${r} 0 0 1 0 ${height - r} Z`;
}

// Unlike stock, the viewport (the scroll container) is a named region, as `table`'s container
// is, so a keyboard user who tabs to it hears what scrolls. Base UI already puts it in the tab
// order whenever it scrolls (and takes it out when it does not), so `tabIndex` stays its own.
function ScrollArea({
  className,
  children,
  label = "Scrollable content",
  ...props
}: ScrollAreaPrimitive.Root.Props & {
  /**
   * Accessible name of the scroll region, read when it takes focus. Give each scroll area on
   * a page its own, as for any landmark.
   * @default "Scrollable content"
   */
  label?: string;
}) {
  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      className={cn("relative", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        data-slot="scroll-area-viewport"
        role="region"
        aria-label={label}
        className="size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1"
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );
}

function ScrollBar({
  className,
  orientation = "vertical",
  ...props
}: ScrollAreaPrimitive.Scrollbar.Props) {
  return (
    <ScrollAreaPrimitive.Scrollbar
      data-slot="scroll-area-scrollbar"
      data-orientation={orientation}
      orientation={orientation}
      className={cn(
        "flex touch-none p-px transition-colors select-none data-horizontal:h-2.5 data-horizontal:flex-col data-horizontal:border-t data-horizontal:border-t-transparent data-vertical:h-full data-vertical:w-2.5 data-vertical:border-l data-vertical:border-l-transparent",
        className,
      )}
      {...props}
    >
      {/* The track: one thin rule down (or across) the middle of the scrollbar. */}
      <InkFrame
        as="span"
        shape="line"
        fill="none"
        className={cn(
          "pointer-events-none absolute [--ink:var(--tone-3)]",
          orientation === "horizontal"
            ? "inset-x-1 top-1/2 h-(--outline-width) -translate-y-1/2"
            : "inset-y-1 left-1/2 w-(--outline-width) -translate-x-1/2",
        )}
      />
      <ScrollAreaPrimitive.Thumb
        data-slot="scroll-area-thumb"
        className="relative flex-1 rounded-full"
      >
        <InkFrame
          as="span"
          fill="ink"
          outline={roundedBar}
          className="pointer-events-none absolute inset-0 rounded-full"
        />
      </ScrollAreaPrimitive.Thumb>
    </ScrollAreaPrimitive.Scrollbar>
  );
}

export { ScrollArea, ScrollBar };
