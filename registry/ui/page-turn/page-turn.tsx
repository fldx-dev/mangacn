"use client";

import { cn } from "cn";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type * as React from "react";

interface Turn {
  rtl: boolean;
  reduce: boolean;
}

// The old page swings away around its spine edge, uncovering the new one underneath; under
// reduced motion the two cross-fade instead.
const pageVariants = {
  enter: ({ reduce }: Turn) => ({ opacity: reduce ? 0 : 1, rotateY: 0, zIndex: 0 }),
  center: { opacity: 1, rotateY: 0, zIndex: 0 },
  exit: ({ rtl, reduce }: Turn) =>
    reduce ? { opacity: 0, zIndex: 1 } : { rotateY: rtl ? 90 : -90, zIndex: 1 },
};

/** The ink line along the free edge of the turning page. */
const edgeVariants = {
  enter: { opacity: 0 },
  center: { opacity: 0 },
  exit: ({ reduce }: Turn) => ({ opacity: reduce ? 0 : 1 }),
};

export interface PageTurnProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Change it to turn the page; the children are the page shown for that key. */
  pageKey: string | number;
  /** `rtl` (default) turns like a manga, spine on the right; `ltr` like a western book. */
  direction?: "rtl" | "ltr";
  /** Seconds per turn. */
  duration?: number;
}

/** Turns its children like a page whenever `pageKey` changes. */
export function PageTurn({
  className,
  pageKey,
  direction = "rtl",
  duration = 0.5,
  children,
  ...props
}: PageTurnProps) {
  const reduce = useReducedMotion() ?? false;
  const turn: Turn = { rtl: direction === "rtl", reduce };
  return (
    <div
      data-slot="page-turn"
      data-direction={direction}
      className={cn("relative isolate grid perspective-distant", className)}
      {...props}
    >
      <AnimatePresence initial={false} custom={turn}>
        <motion.div
          key={pageKey}
          data-slot="page-turn-page"
          custom={turn}
          variants={pageVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: reduce ? Math.min(duration, 0.2) : duration, ease: "easeInOut" }}
          className="relative col-start-1 row-start-1 min-w-0 bg-paper backface-hidden"
          style={{ transformOrigin: turn.rtl ? "right center" : "left center" }}
        >
          {children}
          <motion.span
            aria-hidden="true"
            data-slot="page-turn-edge"
            custom={turn}
            variants={edgeVariants}
            className={cn(
              "pointer-events-none absolute inset-y-0 w-(--outline-width-heavy) bg-ink",
              turn.rtl ? "left-0" : "right-0",
            )}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
