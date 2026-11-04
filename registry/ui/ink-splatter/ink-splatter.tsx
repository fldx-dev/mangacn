"use client";

import { cn } from "cn";
import type * as React from "react";
import { useEffect, useId, useRef, useState } from "react";
import rough from "roughjs";

type InkSplatterKind = "splat" | "drip" | "dots";
type InkSplatterSize = "sm" | "md" | "lg";
type InkSplatterColor = "ink" | "spot";

export interface InkSplatterProps
  extends Omit<React.SVGAttributes<SVGSVGElement>, "color" | "children"> {
  /**
   * The mark: a splash with flung droplets, a band of ink running down in drips, or a spray of
   * dots.
   * @default "splat"
   */
  kind?: InkSplatterKind;
  /**
   * Drawing size: 64, 112 or 160 px square.
   * @default "md"
   */
  size?: InkSplatterSize;
  /**
   * Ink colour: ink, or spot red.
   * @default "ink"
   */
  color?: InkSplatterColor;
  /**
   * Picks the shape: the same seed draws the same splatter, another seed a different one.
   * Defaults to a stable hash of `useId()`, so every instance on a page differs.
   */
  seed?: number;
}

const SIZES: Record<InkSplatterSize, string> = {
  sm: "size-16",
  md: "size-28",
  lg: "size-40",
};

/** Every splatter is drawn in a 100 × 100 box and scaled to its size. */
const BOX = 100;
/** The drawing stays this far inside the box, leaving room for the pen's wobble. */
const MARGIN = 6;

interface Pen {
  roughness: number;
  bowing: number;
  maxRandomnessOffset: number;
}

/** The theme's pen; the server render and the first client render draw with these. */
const DEFAULT_PEN: Pen = { roughness: 1.2, bowing: 0.8, maxRandomnessOffset: 1.5 };

type Point = [number, number];

/** FNV-1a over `useId()`, so every instance keeps its own shape across re-renders. */
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

/** mulberry32: a small seeded generator, so the geometry follows the seed like the wobble. */
function random(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp = (value: number, min = MARGIN, max = BOX - MARGIN) =>
  Math.min(max, Math.max(min, value));
const round = (value: number) => Math.round(value * 10) / 10;

/** A shape to ink: a closed blob through `points` or a round drop. */
type Blot =
  | { type: "blob"; points: Point[] }
  | { type: "drop"; x: number; y: number; width: number; height: number };

/** The shortest turn from angle `a` to angle `b`, in radians. */
const turn = (a: number, b: number) => Math.atan2(Math.sin(b - a), Math.cos(b - a));

/** A splash: a lumpy body with pointed arms flung out, droplets beyond them and around. */
function splat(next: () => number): Blot[] {
  const centre = BOX / 2;
  const body = 15 + next() * 4;
  // The arms: where they point, how far past the body they reach and how wide they start.
  const arms = Array.from({ length: 6 + Math.floor(next() * 4) }, () => ({
    angle: next() * Math.PI * 2,
    reach: 6 + next() * 14,
    width: 0.12 + next() * 0.14,
  }));
  // Two slow waves make the body lumpy rather than round.
  const [phase1, phase2] = [next() * Math.PI * 2, next() * Math.PI * 2];
  const steps = 56;
  const points: Point[] = [];
  for (let i = 0; i < steps; i++) {
    const angle = (i / steps) * Math.PI * 2;
    let radius =
      body * (1 + 0.1 * Math.sin(angle * 3 + phase1) + 0.06 * Math.sin(angle * 5 + phase2));
    for (const arm of arms) {
      const off = Math.abs(turn(arm.angle, angle)) / arm.width;
      // A pointed arm: full reach on its axis, falling off steeply to either side.
      if (off < 1) radius += arm.reach * (1 - off) ** 2;
    }
    points.push([
      round(clamp(centre + Math.cos(angle) * radius)),
      round(clamp(centre + Math.sin(angle) * radius)),
    ]);
  }
  const blots: Blot[] = [{ type: "blob", points }];
  const drop = (angle: number, distance: number, diameter: number) => {
    blots.push({
      type: "drop",
      x: round(clamp(centre + Math.cos(angle) * distance, MARGIN + 3, BOX - MARGIN - 3)),
      y: round(clamp(centre + Math.sin(angle) * distance, MARGIN + 3, BOX - MARGIN - 3)),
      width: round(diameter * (0.85 + next() * 0.3)),
      height: round(diameter * (0.85 + next() * 0.3)),
    });
  };
  // A droplet flung off the tip of most arms, and a few loose ones further out.
  for (const arm of arms) {
    if (next() < 0.7) drop(arm.angle, body + arm.reach + 5 + next() * 6, 2.5 + next() * 3.5);
  }
  for (let i = 0, loose = 3 + Math.floor(next() * 3); i < loose; i++) {
    drop(next() * Math.PI * 2, body + 16 + next() * 14, 1.5 + next() * 3);
  }
  return blots;
}

/** A band of ink along the top with a few drips running down, each ending in a bead. */
function drip(next: () => number): Blot[] {
  const left = MARGIN + 2;
  const right = BOX - MARGIN - 2;
  const top = MARGIN + 8;
  const band = top + 10;
  // Drips at spread-out places along the band, never overlapping.
  const count = 3 + Math.floor(next() * 3);
  const span = (right - left) / count;
  const drips = Array.from({ length: count }, (_, i) => ({
    x: left + span * (i + 0.3 + next() * 0.4),
    half: 3 + next() * 2.5,
    end: band + 14 + next() * (BOX - MARGIN - band - 26),
  }));
  // The band: an uneven top edge left to right, a gently waving bottom edge back.
  const points: Point[] = [];
  for (let i = 0; i <= 8; i++) {
    points.push([round(left + ((right - left) * i) / 8), round(top + next() * 3)]);
  }
  for (let i = 8; i >= 0; i--) {
    points.push([round(left + ((right - left) * i) / 8), round(band + next() * 2.5)]);
  }
  const blots: Blot[] = [{ type: "blob", points }];
  for (const { x, half, end } of drips) {
    // The drip, its own shape from inside the band down to the bead: separate from the band so
    // its two sides never cross the band's edge and cancel the fill.
    blots.push({
      type: "blob",
      points: [
        [round(x - half * 1.15), round(band - 4)],
        [round(x - half), round(band + 3)],
        [round(x - half * 0.85), round((band + end) / 2)],
        [round(x - half * 0.75), round(end)],
        [round(x + half * 0.75), round(end)],
        [round(x + half * 0.85), round((band + end) / 2)],
        [round(x + half), round(band + 3)],
        [round(x + half * 1.15), round(band - 4)],
      ],
    });
    // The bead at the end of the drip, a little wider than the drip.
    blots.push({
      type: "drop",
      x: round(x),
      y: round(end - half * 0.4),
      width: round(half * 2.6),
      height: round(half * 2.9),
    });
  }
  // One drop already fallen below the shortest drip.
  const fallen = drips.reduce((a, b) => (b.end < a.end ? b : a));
  blots.push({
    type: "drop",
    x: round(fallen.x),
    y: round(clamp(fallen.end + 8 + next() * 6)),
    width: round(fallen.half * 1.4),
    height: round(fallen.half * 1.7),
  });
  return blots;
}

/** A spray of dots, bigger and denser near the middle. */
function dots(next: () => number): Blot[] {
  const centre = BOX / 2;
  const count = 11 + Math.floor(next() * 6);
  return Array.from({ length: count }, () => {
    const angle = next() * Math.PI * 2;
    // Two draws averaged lean towards the middle.
    const distance = ((next() + next()) / 2) * 40;
    const diameter = Math.max(2.5, 11 - distance / 4 + next() * 3);
    return {
      type: "drop" as const,
      x: round(clamp(centre + Math.cos(angle) * distance, MARGIN + 6, BOX - MARGIN - 6)),
      y: round(clamp(centre + Math.sin(angle) * distance, MARGIN + 6, BOX - MARGIN - 6)),
      width: round(diameter),
      height: round(diameter * (0.85 + next() * 0.3)),
    };
  });
}

const KINDS: Record<InkSplatterKind, (next: () => number) => Blot[]> = { splat, drip, dots };

const generator = rough.generator();

/** The splatter as filled SVG paths, one per blot. */
function drawSplatter(kind: InkSplatterKind, seed: number, pen: Pen) {
  const blots = KINDS[kind](random(seed));
  return blots.flatMap((blot, index) => {
    // A drop under 20 units across takes the pen's wobble in proportion, or it turns jagged.
    const calm = blot.type === "drop" ? Math.min(1, Math.max(blot.width, blot.height) / 20) : 1;
    const options = {
      // One rough.js seed per blot, so each edge wobbles on its own.
      seed: seed + index,
      roughness: pen.roughness * calm,
      bowing: pen.bowing,
      maxRandomnessOffset: pen.maxRandomnessOffset * calm,
      // Ink is a filled shape with no outline: a stroked edge wobbles apart from the fill and
      // reads as a scribble. The fill keeps the pen's roughness, without rough.js's extra gain,
      // so thin arms and drips survive.
      fill: "currentColor",
      fillStyle: "solid",
      fillShapeRoughnessGain: 0,
      stroke: "none",
      disableMultiStroke: true,
      preserveVertices: true,
    };
    // A closed curve: dense points, the last one back on the first.
    const drawable =
      blot.type === "blob"
        ? generator.curve([...blot.points, blot.points[0]], options)
        : generator.ellipse(blot.x, blot.y, blot.width, blot.height, options);
    return generator.toPaths(drawable).map((path) => ({ ...path, d: tidy(path.d) }));
  });
}

/**
 * Rounds path data to 1/100 px. rough.js ellipses use `Math.sin` / `Math.cos`, whose last bits
 * differ between the server's and the browser's JavaScript engines; rounded, the server render
 * hydrates without a mismatch (and the markup is a third the size).
 */
function tidy(d: string): string {
  return d.replace(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi, (n) => String(Math.round(Number(n) * 100) / 100));
}

/**
 * Decorative ink: a splash, drips or a spray of dots, drawn with rough.js and seeded so every
 * instance differs. An inline-block SVG hidden from assistive tech; place it behind or beside
 * content yourself (it takes only its own box).
 */
export function InkSplatter({
  kind = "splat",
  size = "md",
  color = "ink",
  seed,
  className,
  ...props
}: InkSplatterProps) {
  const id = useId();
  const resolvedSeed = seed ?? hashSeed(id);
  const hostRef = useRef<SVGSVGElement>(null);
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

  const paths = drawSplatter(kind, resolvedSeed, pen ?? DEFAULT_PEN);
  return (
    <svg
      data-slot="ink-splatter"
      data-kind={kind}
      data-size={size}
      data-color={color}
      data-inked={pen ? "true" : undefined}
      aria-hidden="true"
      focusable="false"
      viewBox={`0 0 ${BOX} ${BOX}`}
      className={cn(
        "pointer-events-none inline-block shrink-0 overflow-visible align-middle",
        SIZES[size],
        color === "spot" ? "text-spot" : "text-ink",
        className,
      )}
      {...props}
      ref={hostRef}
    >
      {paths.map((path, index) => (
        <path
          // biome-ignore lint/suspicious/noArrayIndexKey: blots in drawing order
          key={index}
          d={path.d}
          fill="currentColor"
        />
      ))}
    </svg>
  );
}
