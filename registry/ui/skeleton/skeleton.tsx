import { cn } from "cn";
import { InkFrame } from "@/components/ink-frame";

// Based on shadcn/ui Skeleton (MIT, https://ui.shadcn.com), base-nova style, fetched 2026-10-31.
// Restyled for mangacn: a pencilled placeholder, a rough tone outline with hatched shading,
// pulsing; `shape="ellipse"` for round ones (an avatar).

interface SkeletonProps extends React.ComponentProps<"div"> {
  shape?: "rect" | "ellipse";
}

function Skeleton({ className, shape = "rect", ...props }: SkeletonProps) {
  return (
    <div
      data-slot="skeleton"
      data-shape={shape}
      className={cn(
        "relative isolate animate-pulse rounded-md [--ink:var(--tone-3)]",
        shape === "ellipse" && "rounded-full",
        className,
      )}
      {...props}
    >
      <InkFrame
        as="span"
        shape={shape}
        fill="hatch"
        className="pointer-events-none absolute inset-0 -z-1"
      />
    </div>
  );
}

export { Skeleton };
