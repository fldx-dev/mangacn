import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import type * as React from "react";

const verticalTextVariants = cva("inline-block [writing-mode:vertical-rl]", {
  variants: {
    orientation: {
      // Japanese upright, Latin turned on its side: the usual tategaki mix.
      mixed: "[text-orientation:mixed]",
      // Every character upright, Latin letters stacked one per line.
      upright: "[text-orientation:upright]",
      // Everything turned on its side, as if the line were rotated.
      sideways: "[text-orientation:sideways]",
    },
  },
  defaultVariants: { orientation: "mixed" },
});

export interface VerticalTextProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof verticalTextVariants> {}

/** Vertical writing, top to bottom and right to left (`vertical-rl`), as in manga. */
export function VerticalText({ className, orientation, ...props }: VerticalTextProps) {
  return (
    <span
      data-slot="vertical-text"
      data-orientation={orientation ?? "mixed"}
      className={cn(verticalTextVariants({ orientation }), className)}
      {...props}
    />
  );
}
