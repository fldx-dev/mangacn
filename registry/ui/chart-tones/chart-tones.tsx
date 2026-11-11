import type * as React from "react";

/**
 * The tone of each pattern, by name. Dots run from sparse (`dots1`) to dense (`dots4`); `hatch`
 * is one set of 45° lines, `crossHatch` two.
 */
export const CHART_TONES = ["dots1", "dots2", "dots3", "dots4", "hatch", "crossHatch"] as const;

export type ChartTone = (typeof CHART_TONES)[number];

/**
 * The pattern ids `<ChartTones />` defines, as plain strings (not `useId`), so a server page or a
 * chart config can name them: `fill="url(#tone-dots-2)"`.
 */
export const CHART_TONE_IDS: Readonly<Record<ChartTone, string>> = {
  dots1: "tone-dots-1",
  dots2: "tone-dots-2",
  dots3: "tone-dots-3",
  dots4: "tone-dots-4",
  hatch: "tone-hatch",
  crossHatch: "tone-cross-hatch",
};

/** `url(#tone-dots-2)` for a `fill`; pass the same `prefix` as the `<ChartTones />` it names. */
export function chartToneFill(tone: ChartTone, prefix = ""): string {
  return `url(#${prefix}${CHART_TONE_IDS[tone]})`;
}

/** Dot screens: cell size and dot radius in px, two dots per cell on a 45° grid. */
const DOTS: Record<"dots1" | "dots2" | "dots3" | "dots4", { cell: number; r: number }> = {
  dots1: { cell: 8, r: 0.9 },
  dots2: { cell: 6, r: 1.1 },
  dots3: { cell: 5, r: 1.35 },
  dots4: { cell: 4, r: 1.4 },
};

/** Line pitch and weight of the hatches, in px. */
const HATCH = { pitch: 5, width: 1.2 };

export interface ChartTonesProps
  extends Omit<React.SVGProps<SVGSVGElement>, "children" | "width" | "height"> {
  /**
   * Prepended to every pattern id, for a second set on one page in another colour
   * (`prefix="spot-"` defines `spot-tone-dots-2`). Name them with `chartToneFill(tone, prefix)`.
   * @default ""
   */
  prefix?: string;
  /**
   * Classes on the hidden `<svg>` that holds the defs. Its text colour is the patterns' colour:
   * they draw in `currentColor` where they are defined, so `className="text-spot"` makes a spot
   * set. The svg takes no space.
   */
  className?: string;
}

/**
 * Screentone fills for charts and any other SVG: renders a zero-size, `aria-hidden` `<svg>` of
 * `<pattern>` defs (dots at four densities, a hatch, a cross-hatch) drawn in `currentColor`, so a
 * shape anywhere on the page takes `fill="url(#tone-dots-2)"`. Render it once per page, beside
 * the charts that use it. A server component; no dependency.
 */
export function ChartTones({ prefix = "", className, style, ...props }: ChartTonesProps) {
  const id = (tone: ChartTone) => `${prefix}${CHART_TONE_IDS[tone]}`;
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      data-slot="chart-tones"
      width="0"
      height="0"
      className={className}
      // Out of the flow and zero-sized, but not display:none: some browsers drop the patterns
      // of an undisplayed svg.
      style={{ position: "absolute", overflow: "hidden", ...style }}
      {...props}
    >
      <defs>
        {(Object.keys(DOTS) as (keyof typeof DOTS)[]).map((tone) => {
          const { cell, r } = DOTS[tone];
          return (
            <pattern
              key={tone}
              id={id(tone)}
              data-tone={tone}
              width={cell}
              height={cell}
              patternUnits="userSpaceOnUse"
            >
              <circle cx={cell / 4} cy={cell / 4} r={r} fill="currentColor" />
              <circle cx={(cell * 3) / 4} cy={(cell * 3) / 4} r={r} fill="currentColor" />
            </pattern>
          );
        })}
        <pattern
          id={id("hatch")}
          data-tone="hatch"
          width={HATCH.pitch}
          height={HATCH.pitch}
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line
            x1={HATCH.pitch / 2}
            y1="0"
            x2={HATCH.pitch / 2}
            y2={HATCH.pitch}
            stroke="currentColor"
            strokeWidth={HATCH.width}
          />
        </pattern>
        <pattern
          id={id("crossHatch")}
          data-tone="crossHatch"
          width={HATCH.pitch}
          height={HATCH.pitch}
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line
            x1={HATCH.pitch / 2}
            y1="0"
            x2={HATCH.pitch / 2}
            y2={HATCH.pitch}
            stroke="currentColor"
            strokeWidth={HATCH.width}
          />
          <line
            x1="0"
            y1={HATCH.pitch / 2}
            x2={HATCH.pitch}
            y2={HATCH.pitch / 2}
            stroke="currentColor"
            strokeWidth={HATCH.width}
          />
        </pattern>
      </defs>
    </svg>
  );
}
