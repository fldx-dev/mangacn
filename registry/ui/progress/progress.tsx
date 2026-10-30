"use client";

import { Progress as ProgressPrimitive } from "@base-ui/react/progress";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import { InkFrame } from "@/components/ink-frame";

// Based on shadcn/ui Progress (MIT, https://ui.shadcn.com), base-nova style, fetched 2026-10-31.
// Restyled for mangacn: InkFrame draws the track (h-2.5 instead of h-1, so the outline has an
// inside) and the indicator is solid ink; `variant="tone"` fills it with screentone lines.

const progressIndicatorVariants = cva("h-full transition-all", {
  variants: {
    variant: {
      default: "bg-primary",
      tone: "screentone-lines",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

type ProgressVariantProps = VariantProps<typeof progressIndicatorVariants>;

function Progress({
  className,
  children,
  value,
  variant = "default",
  ...props
}: ProgressPrimitive.Root.Props & ProgressVariantProps) {
  return (
    <ProgressPrimitive.Root
      value={value}
      data-slot="progress"
      data-variant={variant}
      className={cn("flex flex-wrap gap-3", className)}
      {...props}
    >
      {children}
      <ProgressTrack>
        <ProgressIndicator variant={variant} />
      </ProgressTrack>
    </ProgressPrimitive.Root>
  );
}

function ProgressTrack({ className, children, ...props }: ProgressPrimitive.Track.Props) {
  return (
    <ProgressPrimitive.Track
      className={cn(
        "relative isolate flex h-2.5 w-full items-center rounded-full bg-muted has-[>[data-inked=true]]:bg-transparent!",
        className,
      )}
      data-slot="progress-track"
      {...props}
    >
      <InkFrame
        as="span"
        fill="paper"
        className="pointer-events-none absolute inset-0 -z-1 rounded-full"
      />
      {children}
    </ProgressPrimitive.Track>
  );
}

function ProgressIndicator({
  className,
  variant = "default",
  ...props
}: ProgressPrimitive.Indicator.Props & ProgressVariantProps) {
  return (
    <ProgressPrimitive.Indicator
      data-slot="progress-indicator"
      className={cn(progressIndicatorVariants({ variant }), className)}
      {...props}
    />
  );
}

function ProgressLabel({ className, ...props }: ProgressPrimitive.Label.Props) {
  return (
    <ProgressPrimitive.Label
      className={cn("text-sm font-medium", className)}
      data-slot="progress-label"
      {...props}
    />
  );
}

function ProgressValue({ className, ...props }: ProgressPrimitive.Value.Props) {
  return (
    <ProgressPrimitive.Value
      className={cn("ml-auto text-sm text-muted-foreground tabular-nums", className)}
      data-slot="progress-value"
      {...props}
    />
  );
}

export { Progress, ProgressIndicator, ProgressLabel, ProgressTrack, ProgressValue };
