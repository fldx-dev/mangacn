"use client";

import { Separator as SeparatorPrimitive } from "@base-ui/react/separator";
import { cn } from "cn";
import { InkFrame } from "@/components/ink-frame";

// Based on shadcn/ui Separator (MIT, https://ui.shadcn.com), base-nova style, fetched 2026-10-30.
// Restyled for mangacn: one rough InkFrame stroke along an outline-width box.

function Separator({ className, orientation = "horizontal", ...props }: SeparatorPrimitive.Props) {
  return (
    <SeparatorPrimitive
      data-slot="separator"
      orientation={orientation}
      className={cn(
        "relative isolate shrink-0 bg-border has-[>[data-inked=true]]:bg-transparent! data-horizontal:h-(--outline-width) data-horizontal:w-full data-vertical:w-(--outline-width) data-vertical:self-stretch",
        className,
      )}
      {...props}
    >
      <InkFrame
        as="span"
        shape="line"
        fill="none"
        className="pointer-events-none absolute inset-0 -z-1"
      />
    </SeparatorPrimitive>
  );
}

export { Separator };
