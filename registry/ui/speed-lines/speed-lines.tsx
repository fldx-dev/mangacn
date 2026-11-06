import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import type * as React from "react";

// Radial lines are the theme's `speed-lines` pattern with a movable centre and density;
// horizontal ones are two stripe sets of different periods, faded towards the motion.
const STRIPES =
  "[background-image:repeating-linear-gradient(to_bottom,var(--speed-color)_0_var(--speed-line-width),transparent_var(--speed-line-width)_var(--speed-gap)),repeating-linear-gradient(to_bottom,var(--speed-color)_0_calc(var(--speed-line-width)/2),transparent_calc(var(--speed-line-width)/2)_calc(var(--speed-gap)*1.618))]";

// The lines are backgrounds, painted inside the layer; `overflow-hidden` keeps it that way for
// anything a user adds, so a host that does not clip (a `panel`) stays inside the page.
const speedLinesVariants = cva("pointer-events-none absolute inset-0 -z-1 overflow-hidden", {
  variants: {
    direction: {
      radial:
        "[background-image:repeating-conic-gradient(from_0deg_at_var(--speed-x)_var(--speed-y),var(--speed-color)_0deg_0.6deg,transparent_0.6deg_var(--speed-period))] [mask-image:radial-gradient(circle_at_var(--speed-x)_var(--speed-y),transparent_22%,black_70%)]",
      left: `${STRIPES} [mask-image:linear-gradient(to_left,black_15%,transparent_85%)]`,
      right: `${STRIPES} [mask-image:linear-gradient(to_right,black_15%,transparent_85%)]`,
    },
    // The period of the pattern: degrees between radial lines, spacing between stripes.
    density: {
      sparse: "[--speed-gap:calc(var(--speed-line-width)*9)] [--speed-period:10deg]",
      normal: "[--speed-gap:calc(var(--speed-line-width)*6)] [--speed-period:6deg]",
      dense: "[--speed-gap:calc(var(--speed-line-width)*3.5)] [--speed-period:3.5deg]",
    },
    color: {
      ink: "[--speed-color:var(--ink)]",
      tone: "[--speed-color:var(--tone-3)]",
    },
  },
  defaultVariants: { direction: "radial", density: "normal", color: "ink" },
});

export interface SpeedLinesProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "color" | "children">,
    VariantProps<typeof speedLinesVariants> {
  /**
   * Lines radiating from `center`, or horizontal streaks fading towards the left or the right.
   * @default "radial"
   */
  direction?: VariantProps<typeof speedLinesVariants>["direction"];
  /**
   * How close together the lines are drawn.
   * @default "normal"
   */
  density?: VariantProps<typeof speedLinesVariants>["density"];
  /**
   * Line colour: ink, or the mid tone for a quieter background.
   * @default "ink"
   */
  color?: VariantProps<typeof speedLinesVariants>["color"];
  /**
   * Where radial lines converge, in percent of the box: `[x, y]`.
   * @default [50, 50]
   */
  center?: readonly [number, number];
  /**
   * Classes for the layer. It fills its `relative isolate` parent (`absolute inset-0 -z-1`) and
   * clips the lines to its own box, so the parent need not clip; an `inset-*` class moves its
   * edges (`inset-(--outline-width-heavy)` keeps the lines inside a panel's stroke).
   */
  className?: string;
}

/**
 * Motion lines behind content. Decorative and `aria-hidden`: the layer fills its
 * `relative isolate` parent (place it as the first child) and clips to its own box, so the
 * parent need not be `overflow-hidden`.
 */
export function SpeedLines({
  className,
  direction,
  density,
  color,
  center = [50, 50],
  style,
  ...props
}: SpeedLinesProps) {
  return (
    <div
      aria-hidden="true"
      data-slot="speed-lines"
      data-direction={direction ?? "radial"}
      data-density={density ?? "normal"}
      className={cn(speedLinesVariants({ direction, density, color }), className)}
      style={
        {
          "--speed-x": `${center[0]}%`,
          "--speed-y": `${center[1]}%`,
          ...style,
        } as React.CSSProperties
      }
      {...props}
    />
  );
}
