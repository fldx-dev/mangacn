import { cn } from "cn";

// Based on shadcn/ui Skeleton (MIT, https://ui.shadcn.com), base-nova style, fetched 2026-10-31.
// Restyled for mangacn: a pulsing light halftone instead of a flat fill; no outline.

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("halftone-light animate-pulse rounded-md", className)}
      {...props}
    />
  );
}

export { Skeleton };
