import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import type * as React from "react";

type Kind = "sweat" | "anger" | "sparkle" | "surprise" | "puff";

const emanataVariants = cva(
  "inline-block shrink-0 align-middle [&_*]:[stroke-width:var(--outline-width-heavy)] [&_*]:[vector-effect:non-scaling-stroke]",
  {
    variants: {
      size: {
        sm: "size-5",
        md: "size-8",
        lg: "size-12",
      },
      color: {
        ink: "text-ink",
        spot: "text-spot",
        tone: "text-tone-3",
      },
    },
    defaultVariants: { size: "md", color: "ink" },
  },
);

const LABELS: Record<Kind, string> = {
  sweat: "Sweat drop",
  anger: "Anger mark",
  sparkle: "Sparkle",
  surprise: "Surprise lines",
  puff: "Puff",
};

// Marks on a 24 × 24 grid. Strokes are `currentColor`; fills are paper or ink so a mark
// reads on either mode.
const MARKS: Record<Kind, React.ReactNode> = {
  sweat: (
    <>
      <path
        d="M12 2.5C9.5 7 6.5 10.5 6.5 14.5a5.5 5.5 0 0 0 11 0C17.5 10.5 14.5 7 12 2.5Z"
        fill="var(--paper)"
        stroke="currentColor"
        strokeLinejoin="round"
      />
      <path d="M9.5 14.5a2.5 2.5 0 0 0 2 2.5" fill="none" stroke="currentColor" />
    </>
  ),
  anger: (
    <g fill="none" stroke="currentColor" strokeLinecap="round">
      <path d="M3.5 9.5c3.5 0 6-2.5 6-6" />
      <path d="M14.5 3.5c0 3.5 2.5 6 6 6" />
      <path d="M20.5 14.5c-3.5 0-6 2.5-6 6" />
      <path d="M9.5 20.5c0-3.5-2.5-6-6-6" />
    </g>
  ),
  sparkle: (
    <g fill="currentColor" stroke="currentColor" strokeLinejoin="round">
      <path d="M10 2c.6 4.6 2.4 6.4 7 7-4.6.6-6.4 2.4-7 7-.6-4.6-2.4-6.4-7-7 4.6-.6 6.4-2.4 7-7Z" />
      <path d="M18.5 14c.3 2.2 1.3 3.2 3.5 3.5-2.2.3-3.2 1.3-3.5 3.5-.3-2.2-1.3-3.2-3.5-3.5 2.2-.3 3.2-1.3 3.5-3.5Z" />
    </g>
  ),
  surprise: (
    <g fill="none" stroke="currentColor" strokeLinecap="round">
      <path d="M12 3v6" />
      <path d="M5.5 5.5l3.5 4.5" />
      <path d="M18.5 5.5l-3.5 4.5" />
      <path d="M2.5 11.5l5 1.5" />
      <path d="M21.5 11.5l-5 1.5" />
    </g>
  ),
  puff: (
    <>
      <path
        d="M7 19.5a3.5 3.5 0 0 1-.6-6.95 4.5 4.5 0 0 1 8.4-2.3A3.75 3.75 0 1 1 17.5 19.5Z"
        fill="var(--paper)"
        stroke="currentColor"
        strokeLinejoin="round"
      />
      <path d="M2 8.5h4M3.5 5h3" fill="none" stroke="currentColor" strokeLinecap="round" />
    </>
  ),
};

export interface EmanataProps
  extends Omit<React.SVGAttributes<SVGSVGElement>, "color" | "children">,
    VariantProps<typeof emanataVariants> {
  kind: Kind;
  /** Hide the mark from assistive tech when the surrounding text already says it. */
  decorative?: boolean;
}

/**
 * An emotion mark (manga "emanata"): sweat drop, anger mark, sparkle, surprise lines or puff,
 * as inline SVG. Labelled from `kind` unless `aria-label` or `decorative` is given.
 */
export function Emanata({
  className,
  kind,
  size,
  color,
  decorative = false,
  "aria-label": label,
  ...props
}: EmanataProps) {
  const shared = {
    "data-slot": "emanata",
    "data-kind": kind,
    viewBox: "0 0 24 24",
    focusable: "false" as const,
    className: cn(emanataVariants({ size, color }), className),
    ...props,
  };
  return decorative ? (
    <svg {...shared} aria-hidden="true">
      {MARKS[kind]}
    </svg>
  ) : (
    <svg {...shared} role="img" aria-label={label ?? LABELS[kind]}>
      {MARKS[kind]}
    </svg>
  );
}
