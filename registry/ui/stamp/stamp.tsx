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
   * Seal size: 56, 80 or 112 px square, with the text scaled to match. Text that would overrun
   * the inner ring shrinks to fit inside it once the page has loaded; keep it to one or two
   * short words (at `lg`, about 8 Latin letters or 4 kanji stay readable).
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
  /**
   * Sets the word top to bottom in one column, as a two-kanji hanko is cut (完結, 検印), in a
   * larger face that fills the seal; it still shrinks to fit inside the ring. Meant for one to
   * three CJK characters (the column is `vertical-rl`, upright).
   * @default false
   */
  vertical?: boolean;
}

/** The seal's box in pixels and its classes (box and text size). */
const SIZES: Record<StampSize, { box: number; className: string }> = {
  sm: { box: 56, className: "size-14 text-xs" },
  md: { box: 80, className: "size-20 text-lg" },
  lg: { box: 112, className: "size-28 text-2xl" },
};

/** The text size of a vertical word: one column of two characters fills the seal. */
const VERTICAL_TEXT: Record<StampSize, string> = {
  sm: "text-base",
  md: "text-2xl",
  lg: "text-4xl",
};

/** Room between the box and the outer stroke, for the wobble and the round caps. */
const PAD = 3;
/** The inner ring sits this far inside the outer one, as a share of the box. */
const RING_INSET = 0.1;
/** Clear space between the text's box and the inner ring's stroke, in px. */
const RING_GAP = 1;

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

/**
 * InkFrame's redraw event (`INK_REDRAW_EVENT` in ink-frame.tsx), spelled out so a stamp needs no
 * InkFrame: dispatched on an ancestor after its pen or `--ink-seed` changed, it re-reads them.
 */
const INK_REDRAW_EVENT = "mangacn:ink-redraw";

/** A seed shifted by `--ink-seed`'s whole number, as InkFrame shifts its own. */
function shiftSeed(seed: number, shift: number): number {
  if (shift === 0) return seed;
  const span = 2147483646;
  return ((((seed - 1 + shift) % span) + span) % span) + 1;
}

/**
 * The scale (at most 1) that keeps a `width` × `height` text box, centred, inside the inner
 * ring of a seal drawn `box` px square and laid out `side` px square: inside the circle for a
 * round seal (the box's corners on it), inside the square for a square one.
 */
function fitScale(
  shape: StampShape,
  box: number,
  side: number,
  width: number,
  height: number,
  ring: number,
): number {
  if (width <= 0 || height <= 0 || side <= 0) return 1;
  const inner = (box - PAD * 2 - box * RING_INSET * 2) * (side / box) - ring - RING_GAP * 2;
  const fit =
    shape === "round" ? inner / Math.hypot(width, height) : Math.min(inner / width, inner / height);
  // Two decimals: a sub-pixel change of the text box does not re-render.
  return Math.min(1, Math.floor(fit * 100) / 100);
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
  vertical = false,
  "aria-label": label,
  className,
  style,
  children,
  ...props
}: StampProps) {
  const id = useId();
  const resolvedSeed = seed ?? hashSeed(id);
  const hostRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [pen, setPen] = useState<Pen | null>(null);
  const [shift, setShift] = useState(0);
  // The text's scale. The server and the first client render use 1, so hydration matches; the
  // seal's box never changes, only the text inside it (`scale` takes no layout room).
  const [fit, setFit] = useState(1);
  const { box, className: sizeClassName } = SIZES[size];

  // The theme can retune the pen (`--ink-roughness` …); read it once the styles apply. The
  // text is measured then, and again whenever it or the seal resizes (a web font swapping in),
  // so it always sits inside the ring. `data-inked` waits for the web fonts' first measure.
  useEffect(() => {
    const host = hostRef.current;
    const text = textRef.current;
    if (!host || !text) return;
    const style = getComputedStyle(host);
    const measure = () => {
      const ring = readNumber(style, "--outline-width", 1.5);
      setFit(fitScale(shape, box, host.offsetWidth, text.offsetWidth, text.offsetHeight, ring));
    };
    let active = true;
    const settle = () => {
      if (!active) return;
      measure();
      setPen({
        roughness: readNumber(style, "--ink-roughness", DEFAULT_PEN.roughness),
        bowing: readNumber(style, "--ink-bowing", DEFAULT_PEN.bowing),
        maxRandomnessOffset: readNumber(style, "--ink-offset", DEFAULT_PEN.maxRandomnessOffset),
      });
      setShift(Math.trunc(readNumber(style, "--ink-seed", 0)));
    };
    // A region retuned its pen: read it again.
    const redraw = (event: Event) => {
      if (event.target instanceof Node && event.target.contains(host)) settle();
    };
    document.addEventListener(INK_REDRAW_EVENT, redraw);
    const fonts = typeof document === "undefined" ? undefined : document.fonts;
    if (!fonts || fonts.status === "loaded") settle();
    else fonts.ready.then(settle, settle);
    const observer =
      typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(measure);
    observer?.observe(text);
    observer?.observe(host);
    return () => {
      active = false;
      observer?.disconnect();
      document.removeEventListener(INK_REDRAW_EVENT, redraw);
    };
  }, [shape, box]);

  const { outline, ring } = drawSeal(
    shape,
    box,
    shiftSeed(resolvedSeed, shift),
    pen ?? DEFAULT_PEN,
  );
  const rounding = shape === "round" ? "rounded-full" : "rounded-[2px]";
  const a11y = label ? { role: "img", "aria-label": label } : {};
  return (
    <span
      data-slot="stamp"
      data-shape={shape}
      data-color={color}
      data-size={size}
      data-inked={pen ? "true" : undefined}
      data-fit={fit < 1 ? fit : undefined}
      data-vertical={vertical ? "true" : undefined}
      className={cn(
        // Slightly uneven ink: the whole seal at 90 %.
        // One track the seal's size, so a word wider than the seal overflows it from the centre.
        "relative inline-grid shrink-0 grid-cols-1 grid-rows-1 place-items-center align-middle font-display opacity-90",
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
      {/* As wide as its text up to 72 % of the seal, where two words wrap, but never narrower
          than its longest word; centred even when that word is wider than the seal (`unsafe`),
          so the fit scales it about the seal's centre. */}
      <span
        ref={textRef}
        data-slot="stamp-text"
        className={cn(
          "relative max-w-[72%] min-w-min [place-self:unsafe_center] text-center leading-none text-balance break-keep",
          vertical && [
            "[text-orientation:upright] [writing-mode:vertical-rl]",
            VERTICAL_TEXT[size],
          ],
        )}
        style={fit < 1 ? { scale: String(fit) } : undefined}
      >
        {children}
      </span>
    </span>
  );
}
