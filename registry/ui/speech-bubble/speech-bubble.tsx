"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import type * as React from "react";
import { useCallback } from "react";
import { InkFrame } from "@/components/ink-frame";

type Shape = "round" | "square" | "shout" | "whisper";
type Tail = "bottom-left" | "bottom-right" | "top-left" | "top-right" | "left" | "right" | "none";
type Point = [number, number];

// Tail geometry in px: how far the tip reaches past the box, the width of its base, and how
// far the tip leans away from the base.
const TAIL_LENGTH = 18;
const TAIL_BASE = 14;
const TAIL_LEAN = 7;
// Shout spikes reach this far past the box; lengths cycle so the burst looks drawn, not stamped.
const SPIKE = 12;
const SPIKE_SCALE = [1, 0.6, 0.9, 0.5, 0.8, 0.7];

/** Where the tail leaves an ellipse (radians, y down) and a rectangle (edge, fraction). */
const TAILS: Record<
  Exclude<Tail, "none">,
  { angle: number; edge: "top" | "right" | "bottom" | "left"; at: number }
> = {
  "bottom-left": { angle: (112 * Math.PI) / 180, edge: "bottom", at: 0.28 },
  "bottom-right": { angle: (68 * Math.PI) / 180, edge: "bottom", at: 0.72 },
  "top-left": { angle: (248 * Math.PI) / 180, edge: "top", at: 0.28 },
  "top-right": { angle: (292 * Math.PI) / 180, edge: "top", at: 0.72 },
  left: { angle: (165 * Math.PI) / 180, edge: "left", at: 0.6 },
  right: { angle: (15 * Math.PI) / 180, edge: "right", at: 0.6 },
};

/** The tail tip for a base centred at `[x, y]`. */
function tipFor(tail: Exclude<Tail, "none">, [x, y]: Point, w: number, h: number): Point {
  const lean = tail.endsWith("left") ? -TAIL_LEAN : TAIL_LEAN;
  if (tail === "left") return [-TAIL_LENGTH, y + TAIL_LEAN];
  if (tail === "right") return [w + TAIL_LENGTH, y + TAIL_LEAN];
  return [x + lean, tail.startsWith("top") ? -TAIL_LENGTH : h + TAIL_LENGTH];
}

const fmt = ([x, y]: Point) => `${x.toFixed(2)} ${y.toFixed(2)}`;
const polygon = (points: Point[]) => `M ${points.map(fmt).join(" L ")} Z`;

function ellipsePath(w: number, h: number, tail: Tail): string {
  const rx = w / 2;
  const ry = h / 2;
  const arc = `A ${rx} ${ry} 0 1 1`;
  if (tail === "none") return `M 0 ${ry} ${arc} ${w} ${ry} ${arc} 0 ${ry} Z`;
  const { angle } = TAILS[tail];
  const at = (t: number): Point => [rx + rx * Math.cos(t), ry + ry * Math.sin(t)];
  // Turn the base width into an angle at this point of the ellipse.
  const speed = Math.hypot(rx * Math.sin(angle), ry * Math.cos(angle));
  const delta = TAIL_BASE / 2 / speed;
  const start = at(angle - delta);
  const tip = tipFor(tail, at(angle), w, h);
  // Out along the tail and back, then the long way round the ellipse.
  return `M ${fmt(start)} L ${fmt(tip)} L ${fmt(at(angle + delta))} ${arc} ${fmt(start)} Z`;
}

function rectPath(w: number, h: number, tail: Tail): string {
  const corners: Point[] = [
    [0, 0],
    [w, 0],
    [w, h],
    [0, h],
  ];
  if (tail === "none") return polygon(corners);
  const { edge, at } = TAILS[tail];
  // Edges run clockwise: top →, right ↓, bottom ←, left ↑.
  const edges = { top: 0, right: 1, bottom: 2, left: 3 } as const;
  const index = edges[edge];
  const from = corners[index];
  const to = corners[(index + 1) % 4];
  const horizontal = edge === "top" || edge === "bottom";
  const length = horizontal ? w : h;
  const t = edge === "top" || edge === "right" ? at : 1 - at;
  const point = (offset: number): Point => [
    from[0] + (to[0] - from[0]) * (t + offset / length),
    from[1] + (to[1] - from[1]) * (t + offset / length),
  ];
  const centre = point(0);
  const points = [...corners.slice(0, index + 1)];
  points.push(point(-TAIL_BASE / 2), tipFor(tail, centre, w, h), point(TAIL_BASE / 2));
  points.push(...corners.slice(index + 1));
  return polygon(points);
}

function burstPath(w: number, h: number, tail: Tail): string {
  const rx = w / 2;
  const ry = h / 2;
  const spikes = Math.max(10, Math.min(24, Math.round((w + h) / 22)));
  const points: Point[] = [];
  for (let i = 0; i < spikes * 2; i++) {
    const t = (i * Math.PI) / spikes;
    const reach = i % 2 === 0 ? 0 : SPIKE * SPIKE_SCALE[((i - 1) / 2) % SPIKE_SCALE.length];
    points.push([rx + (rx + reach) * Math.cos(t), ry + (ry + reach) * Math.sin(t)]);
  }
  if (tail !== "none") {
    // The spike closest to the tail direction stretches out to become the tail.
    const { angle } = TAILS[tail];
    let best = 1;
    for (let i = 3; i < spikes * 2; i += 2) {
      const gap = (a: number) => Math.abs(Math.atan2(Math.sin(a - angle), Math.cos(a - angle)));
      if (gap((i * Math.PI) / spikes) < gap((best * Math.PI) / spikes)) best = i;
    }
    const base: Point = [rx + rx * Math.cos(angle), ry + ry * Math.sin(angle)];
    points[best] = tipFor(tail, base, w, h);
  }
  return polygon(points);
}

const speechBubbleVariants = cva(
  "relative isolate inline-block max-w-[28ch] text-center leading-snug text-balance text-ink",
  {
    variants: {
      shape: {
        round: "px-7 py-4",
        square: "px-4 py-2.5",
        // Spikes reach past the box, so keep neighbours clear of them.
        shout: "m-3 px-9 py-6 font-extrabold tracking-wide uppercase",
        whisper: "px-7 py-4 text-sm font-light italic",
      },
      tail: {
        "bottom-left": "mb-5",
        "bottom-right": "mb-5",
        "top-left": "mt-5",
        "top-right": "mt-5",
        left: "ml-5",
        right: "mr-5",
        none: "",
      },
      tone: {
        none: "",
        light: "",
      },
      font: {
        dialogue: "font-dialogue",
        inherit: "",
      },
    },
    defaultVariants: { shape: "round", tail: "bottom-left", tone: "none", font: "dialogue" },
  },
);

export interface SpeechBubbleProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof speechBubbleVariants> {}

/**
 * A dialogue bubble with a hand-drawn outline and tail. The text stays real text; pass
 * `aria-label` (the speaker) to expose it as a `note`.
 */
export function SpeechBubble({
  className,
  shape,
  tail,
  tone,
  font,
  role,
  children,
  ...props
}: SpeechBubbleProps) {
  const resolvedShape: Shape = shape ?? "round";
  const resolvedTail: Tail = tail ?? "bottom-left";
  const outline = useCallback(
    (w: number, h: number) =>
      resolvedShape === "square"
        ? rectPath(w, h, resolvedTail)
        : resolvedShape === "shout"
          ? burstPath(w, h, resolvedTail)
          : ellipsePath(w, h, resolvedTail),
    [resolvedShape, resolvedTail],
  );
  return (
    <div
      data-slot="speech-bubble"
      data-shape={resolvedShape}
      data-tail={resolvedTail}
      data-tone={tone ?? "none"}
      role={role ?? (props["aria-label"] ? "note" : undefined)}
      className={cn(speechBubbleVariants({ shape, tail, tone, font }), className)}
      {...props}
    >
      <InkFrame
        as="span"
        shape={resolvedShape === "square" ? "rect" : "ellipse"}
        fill={tone === "light" ? "tone" : "paper"}
        outline={outline}
        dashed={resolvedShape === "whisper"}
        className={cn(
          "pointer-events-none absolute inset-0 -z-1",
          // A lighter tone than InkFrame's default `tone` fill.
          tone === "light" && "[--tone-2:var(--tone-1)]",
          resolvedShape === "shout" && "[--outline-width:var(--outline-width-heavy)]",
        )}
      />
      {children}
    </div>
  );
}
