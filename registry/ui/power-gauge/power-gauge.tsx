import { cn } from "cn";
import type * as React from "react";
import { useId } from "react";
import { InkFrame } from "@/components/ink-frame";
import { PowerGaugeBurst } from "./power-gauge-burst";

export interface PowerGaugeProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "color"> {
  /** The stat's name, set in the display face above the bar; it also names the meter. */
  label: string;
  /** The current value, clamped to `0`…`max`. */
  value: number;
  /**
   * The value of a full bar.
   * @default 100
   */
  max?: number;
  /**
   * `0` (or none) draws one solid ink fill; a number splits the bar into that many ink blocks
   * with paper gaps, filling whole blocks only.
   * @default 0
   */
  segments?: number;
  /**
   * The fill: ink, or spot red for the one stat that matters.
   * @default "ink"
   */
  color?: "ink" | "spot";
  /**
   * Shows a tilted "MAX" beside the bar once the value reaches `max`. Its room is kept while
   * the bar is short of full, so gauges stacked in a column stay the same length. A gauge that
   * renders full shows it at once; one that fills (or turns `burst` on) later pops it in with
   * sfx-text's `enter="pop"`, at once under reduced motion.
   * @default false
   */
  burst?: boolean;
  /**
   * The value as text, shown beside the label and read as the meter's value. Defaults to
   * `7 / 10` on screen and "7 of 10" for assistive tech.
   */
  format?: (value: number, max: number) => string;
}

/**
 * An anime-style stat bar: a display-face label, an ink fill (solid or in blocks) on a
 * hand-drawn rule, a tick at the end of the track and, when full, a "MAX" burst. It is a
 * `meter` named by its label, with the value as text too.
 */
export function PowerGauge({
  label,
  value,
  max = 100,
  segments = 0,
  color = "ink",
  burst = false,
  format,
  className,
  ...props
}: PowerGaugeProps) {
  const labelId = useId();
  const top = max > 0 ? max : 0;
  const current = Math.min(Math.max(value, 0), top);
  const ratio = top > 0 ? current / top : 0;
  const maxed = top > 0 && current >= top;
  const count = Math.max(0, Math.floor(segments));
  const filled = Math.floor(ratio * count + 1e-9);
  const shown = format ? format(current, top) : `${current} / ${top}`;
  const spoken = format ? shown : `${current} of ${top}`;

  return (
    // biome-ignore lint/a11y/useSemanticElements: a native <meter> draws its own bar and shows children only as fallback.
    <div
      role="meter"
      aria-labelledby={labelId}
      aria-valuenow={current}
      aria-valuemin={0}
      aria-valuemax={top}
      aria-valuetext={spoken}
      data-slot="power-gauge"
      data-color={color}
      data-maxed={maxed}
      className={cn("flex w-full min-w-0 flex-col gap-1.5 font-display text-ink", className)}
      {...props}
    >
      <div data-slot="power-gauge-header" className="flex items-baseline justify-between gap-3">
        <span
          id={labelId}
          data-slot="power-gauge-label"
          className="min-w-0 text-sm leading-tight tracking-wide uppercase"
        >
          {label}
        </span>
        <span data-slot="power-gauge-value" className="shrink-0 text-xs leading-tight tabular-nums">
          {shown}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div data-slot="power-gauge-track" className="relative isolate h-3 min-w-0 grow">
          {/* The track: one rule through the middle, like `slider`'s. */}
          <InkFrame
            as="span"
            shape="line"
            fill="none"
            className="pointer-events-none absolute inset-x-0 top-1/2 -z-1 h-(--outline-width) -translate-y-1/2"
          />
          <div
            data-slot="power-gauge-fill"
            className={cn(
              "absolute inset-y-0 left-0 isolate flex gap-1",
              color === "spot" && "[--ink:var(--spot)]",
            )}
            style={{ width: count > 0 ? "100%" : `${ratio * 100}%` }}
          >
            {count > 0
              ? Array.from({ length: count }, (_, index) => (
                  <span
                    // biome-ignore lint/suspicious/noArrayIndexKey: the blocks never reorder
                    key={index}
                    data-slot="power-gauge-segment"
                    data-filled={index < filled}
                    className="relative isolate min-w-0 flex-1"
                  >
                    {index < filled && <Block />}
                  </span>
                ))
              : ratio > 0 && <Block />}
          </div>
          {/* The max marker: a short upright stroke at the heavy pen where a full bar ends. */}
          <span
            data-slot="power-gauge-max"
            className="pointer-events-none absolute top-1/2 right-0 h-5 w-(--outline-width-heavy) translate-x-1/2 -translate-y-1/2"
          >
            <InkFrame
              as="span"
              shape="line"
              fill="none"
              className="absolute inset-0 [--outline-width:var(--outline-width-heavy)]"
            />
          </span>
        </div>
        <PowerGaugeBurst burst={burst} maxed={maxed} color={color} />
      </div>
    </div>
  );
}

/** One solid ink block, filling its box. */
function Block() {
  return (
    <InkFrame
      as="span"
      fill="ink"
      className="pointer-events-none absolute inset-0 -z-1 rounded-none"
    />
  );
}
