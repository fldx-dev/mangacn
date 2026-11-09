"use client";

import { cn } from "cn";
import { useState } from "react";
import { SfxText } from "@/components/sfx-text";

export interface PowerGaugeBurstProps {
  /** Whether the gauge asks for a burst at all; without it nothing renders. */
  burst: boolean;
  /** Whether the bar is full: the burst shows, otherwise it only keeps its room. */
  maxed: boolean;
  /** The gauge's fill colour. */
  color: "ink" | "spot";
}

/**
 * PowerGauge's tilted "MAX" (the gauge itself stays a server component, so a `format` function
 * can be passed from one). Static when the gauge first renders full; when it fills, or its
 * burst turns on, after mount, the word enters with sfx-text's `enter="pop"`, which shows it at
 * rest under reduced motion.
 */
export function PowerGaugeBurst({ burst, maxed, color }: PowerGaugeBurstProps) {
  const shown = burst && maxed;
  // Whether it showed on the last render, and how many times it has popped in since mount.
  // Updated during render, so the word that pops never paints at rest for a frame first.
  const [state, setState] = useState({ shown, pops: 0 });
  if (state.shown !== shown) setState({ shown, pops: shown ? state.pops + 1 : state.pops });
  if (!burst) return null;
  return (
    <SfxText
      // A new entrance each time it pops in: the key remounts the word.
      key={state.pops}
      data-slot="power-gauge-burst"
      size="sm"
      color={color === "spot" ? "spot" : "paper"}
      rotate={-8}
      enter={state.pops > 0 ? "pop" : "none"}
      className={cn("shrink-0 text-lg", !shown && "invisible")}
    >
      MAX
    </SfxText>
  );
}
