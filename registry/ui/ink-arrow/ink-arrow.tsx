"use client";

import { cn } from "cn";
import type * as React from "react";
import { useEffect, useId, useRef, useState } from "react";
import rough from "roughjs";

type InkArrowDirection = "up" | "down" | "left" | "right";
type InkArrowCurve = "none" | "left" | "right";
type InkArrowLength = "sm" | "md" | "lg";
type InkArrowColor = "ink" | "spot";

export interface InkArrowProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "color" | "children"> {
  /**
   * Where the head points.
   * @default "right"
   */
  direction?: InkArrowDirection;
  /**
   * Bows the shaft to the arrow's own left or right, seen along its direction.
   * @default "none"
   */
  curve?: InkArrowCurve;
  /**
   * Shaft length: 40, 72 or 112 px.
   * @default "md"
   */
  length?: InkArrowLength;
  /**
   * Pen colour: ink, or spot red for the one thing on the page to look at.
   * @default "ink"
   */
  color?: InkArrowColor;
  /**
   * Text at the arrow's tail ("Start here"). With a label the arrow is `role="img"` named by it;
   * without one it is decoration and `aria-hidden`.
   */
  label?: string;
  /** Same seed, same wobble. Defaults to a stable hash of `useId()`. */
  seed?: number;
}

const LENGTHS: Record<InkArrowLength, number> = { sm: 40, md: 72, lg: 112 };
const HEADS: Record<InkArrowLength, number> = { sm: 9, md: 11, lg: 13 };
/** Room around the drawing for wobble and the round line caps. */
const PAD = 6;
/** Half the angle between the two strokes of the head, in radians. */
const HEAD_ANGLE = 0.5;

/** The label sits at the tail, so the head is free to touch what it points at. */
const LAYOUTS: Record<InkArrowDirection, string> = {
  right: "flex-row-reverse",
  left: "flex-row",
  down: "flex-col-reverse",
  up: "flex-col",
};

interface Pen {
  roughness: number;
  bowing: number;
  maxRandomnessOffset: number;
}

/** The theme's pen; the server render and the first client render draw with these. */
const DEFAULT_PEN: Pen = { roughness: 1.2, bowing: 0.8, maxRandomnessOffset: 1.5 };

type Point = [number, number];

/** FNV-1a over `useId()`, so every instance keeps its own wobble across re-renders. */
function hashSeed(id: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < id.length; i++) {
    hash ^= id.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  // rough.js treats 0 as "random".
  return (hash >>> 0) % 2147483646 || 1;
}

function readNumber(style: CSSStyleDeclaration, name: string, fallback: number): number {
  const value = Number.parseFloat(style.getPropertyValue(name));
  return Number.isFinite(value) ? value : fallback;
}

/** Turns a point of the arrow drawn pointing right into the one pointing `direction`. */
const TURNS: Record<InkArrowDirection, (point: Point) => Point> = {
  right: ([x, y]) => [x, y],
  down: ([x, y]) => [-y, x],
  left: ([x, y]) => [-x, -y],
  up: ([x, y]) => [y, -x],
};

const generator = rough.generator();

/** The shaft and the head as SVG path data, plus the drawing's size in pixels. */
function drawArrow(
  direction: InkArrowDirection,
  curve: InkArrowCurve,
  length: InkArrowLength,
  seed: number,
  pen: Pen,
) {
  const shaft = LENGTHS[length];
  const head = HEADS[length];
  // Drawn pointing right, where the arrow's left is up (-y).
  const bend = curve === "none" ? 0 : (curve === "left" ? -1 : 1) * shaft * 0.22;
  const tail: Point = [0, 0];
  const tip: Point = [shaft, 0];
  // A quadratic through the deepest point of the bow; its control sits twice as far out.
  const control: Point = [shaft / 2, bend * 2];
  const deepest: Point = [shaft / 2, bend];
  const [dx, dy] = curve === "none" ? [shaft, 0] : [tip[0] - control[0], tip[1] - control[1]];
  const norm = Math.hypot(dx, dy);
  const wing = (angle: number): Point => {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const ux = dx / norm;
    const uy = dy / norm;
    return [tip[0] - head * (ux * cos - uy * sin), tip[1] - head * (ux * sin + uy * cos)];
  };

  const turn = TURNS[direction];
  const points = [tail, tip, control, deepest, wing(HEAD_ANGLE), wing(-HEAD_ANGLE)].map(turn);
  // The bounding box ignores the control point: the curve never reaches it.
  const extent = [points[0], points[1], points[3], points[4], points[5]];
  const minX = Math.min(...extent.map(([x]) => x));
  const minY = Math.min(...extent.map(([, y]) => y));
  const maxX = Math.max(...extent.map(([x]) => x));
  const maxY = Math.max(...extent.map(([, y]) => y));
  const [t0, t1, c, , w1, w2] = points.map(([x, y]): Point => [x - minX + PAD, y - minY + PAD]);

  const options = {
    seed,
    ...pen,
    // The clean pen, as InkFrame draws: one stroke per segment.
    disableMultiStroke: true,
    preserveVertices: true,
  };
  const drawables = [
    curve === "none"
      ? generator.line(t0[0], t0[1], t1[0], t1[1], options)
      : generator.path(`M ${t0[0]} ${t0[1]} Q ${c[0]} ${c[1]} ${t1[0]} ${t1[1]}`, options),
    generator.linearPath([w1, t1, w2], { ...options, seed: seed + 1 }),
  ];
  return {
    width: Math.ceil(maxX - minX + PAD * 2),
    height: Math.ceil(maxY - minY + PAD * 2),
    paths: drawables.flatMap((drawable) => generator.toPaths(drawable).map((path) => path.d)),
  };
}

/**
 * A hand-drawn arrow (rough.js) pointing at something: straight or bowed, four directions, three
 * lengths, with an optional label at its tail. Decoration unless labelled.
 */
export function InkArrow({
  direction = "right",
  curve = "none",
  length = "md",
  color = "ink",
  label,
  seed,
  className,
  ...props
}: InkArrowProps) {
  const id = useId();
  const resolvedSeed = seed ?? hashSeed(id);
  const hostRef = useRef<HTMLSpanElement>(null);
  const [pen, setPen] = useState<Pen | null>(null);

  // The theme can retune the pen (`--ink-roughness` …); read it once the styles apply.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const style = getComputedStyle(host);
    setPen({
      roughness: readNumber(style, "--ink-roughness", DEFAULT_PEN.roughness),
      bowing: readNumber(style, "--ink-bowing", DEFAULT_PEN.bowing),
      maxRandomnessOffset: readNumber(style, "--ink-offset", DEFAULT_PEN.maxRandomnessOffset),
    });
  }, []);

  const { width, height, paths } = drawArrow(
    direction,
    curve,
    length,
    resolvedSeed,
    pen ?? DEFAULT_PEN,
  );
  const a11y = label ? { role: "img", "aria-label": label } : { "aria-hidden": true };
  return (
    <span
      data-slot="ink-arrow"
      data-direction={direction}
      data-curve={curve}
      data-length={length}
      data-color={color}
      data-inked={pen ? "true" : undefined}
      className={cn("inline-flex items-center gap-1 align-middle", LAYOUTS[direction], className)}
      {...a11y}
      {...props}
      ref={hostRef}
    >
      <svg
        data-slot="ink-arrow-drawing"
        aria-hidden="true"
        focusable="false"
        viewBox={`0 0 ${width} ${height}`}
        // Inline, so a host's `[&_svg]:size-4` cannot resize the drawing.
        style={{ width, height, flexShrink: 0, overflow: "visible" }}
        className={cn(
          color === "spot" ? "text-spot" : "text-ink",
          "[&_path]:[stroke-width:var(--outline-width-heavy)]",
        )}
      >
        {paths.map((d, index) => (
          <path
            // biome-ignore lint/suspicious/noArrayIndexKey: the shaft, then the head
            key={index}
            d={d}
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </svg>
      {label ? <span data-slot="ink-arrow-label">{label}</span> : null}
    </span>
  );
}
