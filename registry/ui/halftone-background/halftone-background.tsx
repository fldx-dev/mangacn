import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import type * as React from "react";

// `sm` is the theme's screen; `md` and `lg` scale dots and cells together. The scaled values
// are computed on this element from the theme's and handed to the dot layer below: setting
// `--halftone-size` from itself on one element would be a cycle.
const halftoneBackgroundVariants = cva("pointer-events-none absolute inset-0 -z-1", {
  variants: {
    size: {
      sm: "[--halftone-bg-dot:var(--halftone-dot)] [--halftone-bg-size:var(--halftone-size)]",
      md: "[--halftone-bg-dot:calc(var(--halftone-dot)*1.5)] [--halftone-bg-size:calc(var(--halftone-size)*1.5)]",
      lg: "[--halftone-bg-dot:calc(var(--halftone-dot)*2.5)] [--halftone-bg-size:calc(var(--halftone-size)*2.5)]",
    },
    fade: {
      none: "",
      top: "[mask-image:linear-gradient(to_bottom,transparent,black_75%)]",
      bottom: "[mask-image:linear-gradient(to_top,transparent,black_75%)]",
      radial: "[mask-image:radial-gradient(ellipse_at_center,black,transparent_72%)]",
    },
  },
  defaultVariants: { size: "md", fade: "none" },
});

const TONES = {
  light: "halftone-light",
  mid: "halftone",
  dark: "halftone-dark",
} as const;

export interface HalftoneBackgroundProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children">,
    VariantProps<typeof halftoneBackgroundVariants> {
  tone?: keyof typeof TONES;
}

/**
 * A full-bleed halftone screen with an optional fade. Decorative and `aria-hidden`; place it
 * as the first child of a `relative isolate` container.
 */
export function HalftoneBackground({
  className,
  tone = "mid",
  size,
  fade,
  ...props
}: HalftoneBackgroundProps) {
  return (
    <div
      aria-hidden="true"
      data-slot="halftone-background"
      data-tone={tone}
      data-fade={fade ?? "none"}
      className={cn(halftoneBackgroundVariants({ size, fade }), className)}
      {...props}
    >
      <div
        className={cn(
          "absolute inset-0 [--halftone-dot:var(--halftone-bg-dot)] [--halftone-size:var(--halftone-bg-size)]",
          TONES[tone],
        )}
      />
    </div>
  );
}
