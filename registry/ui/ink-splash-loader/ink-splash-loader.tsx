"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import { motion, useReducedMotion } from "motion/react";
import type * as React from "react";

const inkSplashLoaderVariants = cva("inline-flex shrink-0 items-center justify-center text-ink", {
  variants: {
    size: {
      sm: "size-6",
      md: "size-10",
      lg: "size-16",
    },
  },
  defaultVariants: { size: "md" },
});

/** The blot: a lumpy ink drop on a 48 × 48 grid. */
const BLOT =
  "M24 9c4 0 5.5 3.5 8.5 4.5s7.5-.5 8.5 3.5-2.5 6-2 9 4 5.5 1.5 8.5-6.5 1-9 3-3 5.5-7.5 5.5-5-4-7.5-5.5-6.5.5-8.5-3 1.5-5.5 1-8.5-4-5-2-8.5 5.5-1.5 8-3.5S20 9 24 9Z";

/** Droplets flung out by the splash: centre and radius. */
const DROPS = [
  { cx: 43, cy: 9, r: 2.5 },
  { cx: 6, cy: 13, r: 2 },
  { cx: 41, cy: 42, r: 1.75 },
  { cx: 8, cy: 40, r: 2.25 },
] as const;

const PULSE = {
  scale: [1, 1.08, 0.94, 1],
  transition: { duration: 1.2, ease: "easeInOut" as const, repeat: Number.POSITIVE_INFINITY },
};

export interface InkSplashLoaderProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children">,
    VariantProps<typeof inkSplashLoaderVariants> {
  /** Announced to assistive tech and kept visually hidden. */
  label?: string;
}

/**
 * A loading indicator: an ink blot that pulses while its droplets splash out. Announces
 * `label` politely; under reduced motion the blot stays still.
 */
export function InkSplashLoader({
  className,
  size,
  label = "Loading",
  ...props
}: InkSplashLoaderProps) {
  const reduce = useReducedMotion();
  return (
    <span
      role="status"
      aria-live="polite"
      data-slot="ink-splash-loader"
      data-size={size ?? "md"}
      className={cn(inkSplashLoaderVariants({ size }), className)}
      {...props}
    >
      <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false" className="size-full">
        <motion.path
          d={BLOT}
          fill="currentColor"
          style={{ transformOrigin: "50% 50%", transformBox: "fill-box" }}
          // Same first frame on server and client; the pulse only starts once motion is allowed.
          initial={{ scale: 1 }}
          animate={reduce ? undefined : PULSE}
        />
        {DROPS.map((drop, index) => (
          <motion.circle
            key={`${drop.cx}-${drop.cy}`}
            {...drop}
            fill="currentColor"
            style={{ transformOrigin: "50% 50%", transformBox: "fill-box" }}
            initial={{ scale: 1, opacity: 1 }}
            animate={
              reduce
                ? undefined
                : {
                    scale: [0, 1.2, 1, 0],
                    opacity: [0, 1, 1, 0],
                    transition: {
                      duration: 1.2,
                      ease: "easeOut",
                      delay: index * 0.15,
                      repeat: Number.POSITIVE_INFINITY,
                    },
                  }
            }
          />
        ))}
      </svg>
      <span className="sr-only">{label}</span>
    </span>
  );
}
