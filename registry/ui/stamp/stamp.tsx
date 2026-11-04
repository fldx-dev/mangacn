"use client";

import { cn } from "cn";
import type * as React from "react";
import { useEffect, useId, useRef, useState } from "react";
import rough from "roughjs";

type StampShape = "round" | "square";
type StampColor = "spot" | "ink";
type StampSize = "sm" | "md" | "lg";

export interface StampProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, "color"> {
  /**
   * The seal's outline: a round hanko or a square one.
   * @default "round"
   */
  shape?: StampShape;
  /**
   * Ink colour: spot red like a real seal, or ink for a black rubber stamp.
   * @default "spot"
   */
  color?: StampColor;
  /**
   * Tilt in degrees; a stamp is rarely pressed straight.
   * @default -8
   */
  rotate?: number;
  /**
   * Seal size: 56, 80 or 112 px square, with the text scaled to match.
   * @default "md"
   */
  size?: StampSize;
  /**
   * Names the stamp as an image ("Approved") when its word is a picture rather than text to
   * read; the root becomes `role="img"`. Without it the stamp's text speaks for itself.
   */
  "aria-label"?: string;
  /** Same seed, same wobble. Defaults to a stable hash of `useId()`. */
  seed?: number;
}

/** The seal's box in pixels and its classes (box and text size). */
const SIZES: Record<StampSize, { box: number; className: string }> = {
  sm: { box: 56, className: "size-14 text-xs" },
  md: { box: 80, className: "size-20 text-lg" },
  lg: { box: 112, className: "size-28 text-2xl" },
};

/** Room between the box and the outer stroke, for the wobble and the round caps. */
const PAD = 3;
/** The inner ring sits this far inside the outer one, as a share of the box. */
const RING_INSET = 0.1;

interface Pen {
  roughness: number;
  bowing: number;
  maxRandomnessOffset: number;
}

/** The theme's pen; the server render and the first client render draw with these. */
const DEFAULT_PEN: Pen = { roughness: 1.2, bowing: 0.8, maxRandomnessOffset: 1.5 };

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

const generator = rough.generator();

/** The outer outline and the inner ring as SVG path data, for a seal `box` pixels square. */
function drawSeal(shape: StampShape, box: number, seed: number, pen: Pen) {
  const options = {
    seed,
    ...pen,
    // The clean pen, as InkFrame draws: one stroke per segment.
    disableMultiStroke: true,
    preserveVertices: true,
  };
  const inset = box * RING_INSET;
  const outer = box - PAD * 2;
  const inner = outer - inset * 2;
  const centre = box / 2;
  const [outline, ring] =
    shape === "round"
      ? [
          generator.ellipse(centre, centre, outer, outer, options),
          generator.ellipse(centre, centre, inner, inner, { ...options, seed: seed + 1 }),
        ]
      : [
          generator.rectangle(PAD, PAD, outer, outer, options),
          generator.rectangle(PAD + inset, PAD + inset, inner, inner, {
            ...options,
            seed: seed + 1,
          }),
        ];
  const pathsOf = (drawable: ReturnType<typeof generator.ellipse>) =>
    generator.toPaths(drawable).map((path) => tidy(path.d));
  return { outline: pathsOf(outline), ring: pathsOf(ring) };
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
 * A hanko-style seal pressed onto the page: a rough outline and a thinner inner ring (rough.js)
 * around one or two words in the display face, tilted a little, with an inked grain. The words
 * stay real text; position it over a card or panel yourself (it takes only its own box).
 */
export function Stamp({
  shape = "round",
  color = "spot",
  rotate = -8,
  size = "md",
  seed,
  "aria-label": label,
  className,
  style,
  children,
  ...props
}: StampProps) {
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

  const { box, className: sizeClassName } = SIZES[size];
  const { outline, ring } = drawSeal(shape, box, resolvedSeed, pen ?? DEFAULT_PEN);
  const rounding = shape === "round" ? "rounded-full" : "rounded-[2px]";
  const a11y = label ? { role: "img", "aria-label": label } : {};
  return (
    <span
      data-slot="stamp"
      data-shape={shape}
      data-color={color}
      data-size={size}
      data-inked={pen ? "true" : undefined}
      className={cn(
        // Slightly uneven ink: the whole seal at 90 %.
        "relative inline-grid shrink-0 place-items-center align-middle font-display opacity-90",
        color === "spot" ? "text-spot" : "text-ink",
        sizeClassName,
        className,
      )}
      style={{ rotate: `${rotate}deg`, ...style }}
      {...a11y}
      {...props}
      ref={hostRef}
    >
      <svg
        data-slot="stamp-outline"
        aria-hidden="true"
        focusable="false"
        viewBox={`0 0 ${box} ${box}`}
        className="pointer-events-none absolute inset-0 size-full overflow-visible"
      >
        {outline.map((d, index) => (
          <path
            // biome-ignore lint/suspicious/noArrayIndexKey: the outline's strokes, in order
            key={`outline-${index}`}
            d={d}
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="[stroke-width:var(--outline-width-heavy)]"
          />
        ))}
        {ring.map((d, index) => (
          <path
            // biome-ignore lint/suspicious/noArrayIndexKey: the ring's strokes, in order
            key={`ring-${index}`}
            d={d}
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="[stroke-width:var(--outline-width)]"
          />
        ))}
      </svg>
      {/* The inked grain: the theme's halftone in the stamp's own colour, faint, inside the ring. */}
      <span
        data-slot="stamp-grain"
        aria-hidden="true"
        className={cn(
          "halftone pointer-events-none absolute inset-[14%] opacity-25 [--tone-4:currentColor]",
          rounding,
        )}
      />
      <span
        data-slot="stamp-text"
        className="relative max-w-[72%] text-center leading-none text-balance break-keep"
      >
        {children}
      </span>
    </span>
  );
}
