"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import { motion, useReducedMotion } from "motion/react";
import type * as React from "react";

// The stroke is painted under the fill (`paint-order`), so only half its width shows.
const sfxTextVariants = cva(
  "inline-block font-display leading-none tracking-wide uppercase [paint-order:stroke_fill] [text-shadow:var(--sfx-shadow-offset)_var(--sfx-shadow-offset)_0_var(--sfx-shadow)]",
  {
    variants: {
      size: {
        sm: "text-2xl [--sfx-shadow-offset:calc(var(--shadow-offset)/2)] [--sfx-stroke-width:calc(var(--outline-width)*3)]",
        md: "text-4xl [--sfx-shadow-offset:calc(var(--shadow-offset)*0.75)] [--sfx-stroke-width:calc(var(--outline-width-heavy)*3)]",
        lg: "text-5xl [--sfx-shadow-offset:var(--shadow-offset)] [--sfx-stroke-width:calc(var(--outline-width-heavy)*4)] sm:text-6xl",
        xl: "text-6xl [--sfx-shadow-offset:var(--shadow-offset)] [--sfx-stroke-width:calc(var(--outline-width-heavy)*4)] sm:text-8xl sm:[--sfx-shadow-offset:calc(var(--shadow-offset)*1.5)] sm:[--sfx-stroke-width:calc(var(--outline-width-heavy)*5)]",
      },
      color: {
        paper: "text-paper [--sfx-shadow:var(--ink)] [--sfx-stroke:var(--ink)]",
        ink: "text-ink [--sfx-shadow:var(--ink)] [--sfx-stroke:var(--paper)]",
        spot: "text-spot [--sfx-shadow:var(--ink)] [--sfx-stroke:var(--ink)]",
      },
      stroke: {
        true: "[-webkit-text-stroke:var(--sfx-stroke-width)_var(--sfx-stroke)]",
        false: "",
      },
    },
    defaultVariants: { size: "md", color: "paper", stroke: true },
  },
);

/** Entrances, matching the `popIn` / `slamIn` presets of `@/lib/manga-motion`. */
const ENTRANCES = {
  pop: {
    initial: { opacity: 0, scale: 0.6 },
    transition: { type: "spring", stiffness: 500, damping: 18 },
  },
  slam: {
    initial: { opacity: 0, scale: 1.4 },
    transition: { type: "spring", stiffness: 700, damping: 28, mass: 0.8 },
  },
} as const;

export interface SfxTextProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "color">,
    VariantProps<typeof sfxTextVariants> {
  /** Tilt in degrees. */
  rotate?: number;
  /** A one-shot entrance on mount. Skipped (shown at rest) under reduced motion. */
  enter?: "none" | "pop" | "slam";
}

/**
 * Onomatopoeia in the display face with an ink stroke and a hard shadow. The word stays plain
 * DOM text, so it is read, selected and translated like any other.
 */
export function SfxText({
  className,
  size,
  color,
  stroke,
  rotate = -6,
  enter = "none",
  style,
  children,
  ...props
}: SfxTextProps) {
  const reduce = useReducedMotion();
  const entrance = enter === "none" ? undefined : ENTRANCES[enter];
  return (
    <span
      data-slot="sfx-text"
      data-size={size ?? "md"}
      data-color={color ?? "paper"}
      data-enter={enter}
      className={cn(sfxTextVariants({ size, color, stroke }), className)}
      style={{ rotate: `${rotate}deg`, ...style }}
      {...props}
    >
      {entrance ? (
        <motion.span
          className="inline-block"
          // The same first frame on the server and the client; reduced motion jumps to the end.
          initial={entrance.initial}
          animate={{ opacity: 1, scale: 1 }}
          transition={reduce ? { duration: 0 } : entrance.transition}
        >
          {children}
        </motion.span>
      ) : (
        children
      )}
    </span>
  );
}
