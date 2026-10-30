"use client";

import { Separator as SeparatorPrimitive } from "@base-ui/react/separator";
import { cn } from "cn";

// Based on shadcn/ui Separator (MIT, https://ui.shadcn.com), base-nova style, fetched 2026-10-30.
// Restyled for mangacn.

function Separator({ className, orientation = "horizontal", ...props }: SeparatorPrimitive.Props) {
  return (
    <SeparatorPrimitive
      data-slot="separator"
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border data-horizontal:h-(--outline-width) data-horizontal:w-full data-vertical:w-(--outline-width) data-vertical:self-stretch",
        className,
      )}
      {...props}
    />
  );
}

export { Separator };
