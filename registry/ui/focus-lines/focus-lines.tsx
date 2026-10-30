import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import type * as React from "react";

const focusLinesVariants = cva("pointer-events-none absolute inset-0 -z-1 size-full", {
  variants: {
    color: {
      ink: "text-ink",
      tone: "text-tone-3",
    },
  },
  defaultVariants: { color: "ink" },
});

/** Inner end of a line, as a share of the distance from the centre to the box edge. */
const INNER = { short: 0.68, long: 0.32 };

/** Deterministic jitter in [-1, 1) per line, so server and client draw the same burst. */
function jitter(index: number): number {
  const x = Math.sin(index * 12.9898 + 78.233) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
}

export interface FocusLinesProps
  extends Omit<React.SVGAttributes<SVGSVGElement>, "color" | "children">,
    VariantProps<typeof focusLinesVariants> {
  /** Where the lines converge, in percent of the box: `[x, y]`. */
  center?: readonly [number, number];
  /** Number of lines. */
  count?: number;
  /** How far the lines reach in towards the centre. */
  length?: "short" | "long";
}

/**
 * Concentration lines bursting in towards a point, drawn as inline SVG at
 * `--speed-line-width`. Decorative and `aria-hidden`; place it as the first child of a
 * `relative isolate` container.
 */
export function FocusLines({
  className,
  color,
  center = [50, 50],
  count = 64,
  length = "short",
  ...props
}: FocusLinesProps) {
  const [cx, cy] = center;
  const lines = Array.from({ length: Math.max(0, Math.round(count)) }, (_, index) => {
    const angle = ((index + jitter(index) * 0.35) / count) * Math.PI * 2;
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    // Distance from the centre to the box edge along this ray (the box is 100 × 100 units).
    const toEdge = Math.min(
      dx > 0 ? (100 - cx) / dx : dx < 0 ? -cx / dx : Number.POSITIVE_INFINITY,
      dy > 0 ? (100 - cy) / dy : dy < 0 ? -cy / dy : Number.POSITIVE_INFINITY,
    );
    const inner = toEdge * INNER[length] * (1 + jitter(index + count) * 0.25);
    // Start past the edge so every line runs off the box.
    const outer = toEdge + 10;
    return {
      x1: cx + dx * outer,
      y1: cy + dy * outer,
      x2: cx + dx * inner,
      y2: cy + dy * inner,
    };
  });
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      data-slot="focus-lines"
      data-length={length}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className={cn(focusLinesVariants({ color }), className)}
      {...props}
    >
      <g
        stroke="currentColor"
        strokeLinecap="round"
        style={{ strokeWidth: "var(--speed-line-width)" }}
      >
        {lines.map((line, index) => (
          <line
            // biome-ignore lint/suspicious/noArrayIndexKey: lines are positional and never reorder.
            key={index}
            x1={line.x1.toFixed(2)}
            y1={line.y1.toFixed(2)}
            x2={line.x2.toFixed(2)}
            y2={line.y2.toFixed(2)}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </g>
    </svg>
  );
}
