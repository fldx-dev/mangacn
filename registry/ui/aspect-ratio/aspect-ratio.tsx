import { cn } from "cn";
import type * as React from "react";

// Based on shadcn/ui Aspect Ratio (MIT, https://ui.shadcn.com), base-nova style, fetched 2026-11-09.
// Unchanged for mangacn: a sizing box with no outline of its own. Listed so
// `@mangacn/aspect-ratio` resolves for blocks and agents; frame what goes inside it.

function AspectRatio({
  ratio,
  className,
  ...props
}: React.ComponentProps<"div"> & { ratio: number }) {
  return (
    <div
      data-slot="aspect-ratio"
      style={
        {
          "--ratio": ratio,
        } as React.CSSProperties
      }
      className={cn("relative aspect-(--ratio)", className)}
      {...props}
    />
  );
}

export { AspectRatio };
