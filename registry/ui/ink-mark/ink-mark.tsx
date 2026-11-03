"use client";

import { cn } from "cn";
import { motion, useReducedMotion } from "motion/react";
import type * as React from "react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import rough from "roughjs";

type InkMarkKind = "underline" | "circle" | "box" | "strike" | "highlight" | "bracket";
type InkMarkColor = "ink" | "spot" | "tone";

export interface InkMarkProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, "color"> {
  /**
   * The annotation: an underline, a loop around the words, a box, a strike-through, a tone
   * highlight behind the glyphs, or brackets at the start and end of the phrase.
   * @default "underline"
   */
  kind?: InkMarkKind;
  /**
   * Pen colour: ink, spot red or the mid tone. A highlight paints a light wash of it instead
   * (tone-2 for ink, tone-1 for tone, spot at 30 %), so the text keeps its contrast.
   * @default "ink"
   */
  color?: InkMarkColor;
  /**
   * Whether the mark is drawn. Turning it on draws the stroke on, line by line; under reduced
   * motion, and when the mark is already on at mount, it appears at once.
   * @default true
   */
  show?: boolean;
  /** Same seed, same wobble. Defaults to a stable hash of `useId()`. */
  seed?: number;
}

const STROKE_COLORS: Record<InkMarkColor, string> = {
  ink: "text-ink",
  spot: "text-spot",
  tone: "text-tone-3",
};

const HIGHLIGHT_COLORS: Record<InkMarkColor, string> = {
  ink: "text-tone-2",
  spot: "text-spot/30",
  tone: "text-tone-1",
};

/** Seconds to draw one line box's mark when `show` turns on. */
const DRAW_SECONDS = 0.5;

/** One line box of the wrapped text, in the drawing's pixels. */
interface LineBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** What the drawing was measured against; `left`/`top` place it in the span's containing block. */
interface Layout {
  left: number;
  top: number;
  width: number;
  height: number;
  lines: LineBox[];
  vertical: boolean;
  rtl: boolean;
  strokeWidth: number;
  roughness: number;
  bowing: number;
  maxRandomnessOffset: number;
}

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

// Layout positions snap to 1/64 px; rounding to the same grid keeps a placed drawing exactly
// where it was asked to go, so measuring it again gives the same numbers.
const round = (value: number) => Math.round(value * 64) / 64;

/** Within a tenth of a pixel everywhere: not worth a redraw (and no measure–render loop). */
function sameLayout(a: Layout | null, b: Layout | null): boolean {
  if (!a || !b) return a === b;
  const close = (x: number, y: number) => Math.abs(x - y) < 0.1;
  return (
    a.vertical === b.vertical &&
    a.rtl === b.rtl &&
    a.lines.length === b.lines.length &&
    (["left", "top", "width", "height", "strokeWidth", "roughness", "bowing"] as const).every(
      (key) => close(a[key], b[key]),
    ) &&
    close(a.maxRandomnessOffset, b.maxRandomnessOffset) &&
    a.lines.every(
      (line, i) =>
        close(line.x, b.lines[i].x) &&
        close(line.y, b.lines[i].y) &&
        close(line.width, b.lines[i].width) &&
        close(line.height, b.lines[i].height),
    )
  );
}

/**
 * Measures the span's line boxes against the drawing's own origin. An absolutely positioned
 * child of a wrapped inline has an odd containing block, so the SVG reads where it actually
 * landed rather than assuming one.
 */
function measure(host: HTMLElement, svg: SVGSVGElement): Layout | null {
  const rects = [...host.getClientRects()].filter((rect) => rect.width > 0 && rect.height > 0);
  if (rects.length === 0) return null;
  const placed = svg.getBoundingClientRect();
  const originX = placed.left - (Number.parseFloat(svg.style.left) || 0);
  const originY = placed.top - (Number.parseFloat(svg.style.top) || 0);
  const minX = Math.min(...rects.map((rect) => rect.left));
  const minY = Math.min(...rects.map((rect) => rect.top));
  const maxX = Math.max(...rects.map((rect) => rect.right));
  const maxY = Math.max(...rects.map((rect) => rect.bottom));
  const style = getComputedStyle(host);
  return {
    left: round(minX - originX),
    top: round(minY - originY),
    width: round(maxX - minX),
    height: round(maxY - minY),
    lines: rects.map((rect) => ({
      x: round(rect.left - minX),
      y: round(rect.top - minY),
      width: round(rect.width),
      height: round(rect.height),
    })),
    vertical: style.writingMode.startsWith("vertical") || style.writingMode.startsWith("sideways"),
    rtl: style.direction === "rtl",
    strokeWidth: readNumber(style, "--outline-width", 1.5),
    roughness: readNumber(style, "--ink-roughness", 1.2),
    bowing: readNumber(style, "--ink-bowing", 0.8),
    maxRandomnessOffset: readNumber(style, "--ink-offset", 1.5),
  };
}

const PEN_VARIABLES = ["--outline-width", "--ink-roughness", "--ink-bowing", "--ink-offset"];

/** The nearest box a `ResizeObserver` can watch: inline elements never report a size. */
function observableAncestor(host: HTMLElement): Element | null {
  let node = host.parentElement;
  while (node) {
    const { display } = getComputedStyle(node);
    if (display !== "inline" && display !== "contents") return node;
    node = node.parentElement;
  }
  return null;
}

const generator = rough.generator();

interface Stroke {
  d: string;
  width: number;
}

/** The strokes for one line box; `index` of `count` picks where a bracket opens and closes. */
function lineStrokes(
  kind: InkMarkKind,
  box: LineBox,
  index: number,
  count: number,
  layout: Layout,
  seed: number,
): Stroke[] {
  const { vertical, rtl, strokeWidth } = layout;
  const inline = vertical ? box.height : box.width;
  const block = vertical ? box.width : box.height;
  // Text-relative coordinates: `i` along the line from its start, `b` across it from the over
  // side. Vertical text puts the under side on the right, where Japanese sets its sidelines.
  const at = (i: number, b: number): [number, number] => {
    const along = rtl ? inline - i : i;
    return vertical ? [box.x + b, box.y + along] : [box.x + along, box.y + b];
  };
  const options = {
    seed: seed + index,
    roughness: layout.roughness,
    bowing: layout.bowing,
    maxRandomnessOffset: layout.maxRandomnessOffset,
    strokeWidth,
    // The clean pen, as InkFrame draws: one stroke per edge.
    disableMultiStroke: true,
    preserveVertices: true,
  };
  const line = (from: [number, number], to: [number, number], width = strokeWidth) =>
    generator.line(...at(...from), ...at(...to), { ...options, strokeWidth: width });
  // Room around the glyphs for box and circle, along the line and across it.
  const padI = vertical ? 2 : 4;
  const padB = vertical ? 4 : 2;

  const drawables = [];
  switch (kind) {
    case "underline":
      drawables.push(line([0, block * 0.94], [inline, block * 0.94]));
      break;
    case "strike":
      drawables.push(line([0, block * 0.55], [inline, block * 0.55]));
      break;
    case "highlight":
      // One fat stroke through the middle: a marker swipe that the draw-on reveals left to right.
      drawables.push(line([-2, block / 2], [inline + 2, block / 2], block * 0.9));
      break;
    case "box":
      drawables.push(
        generator.rectangle(
          box.x - padI,
          box.y - padB,
          box.width + padI * 2,
          box.height + padB * 2,
          options,
        ),
      );
      break;
    case "circle":
      drawables.push(
        generator.ellipse(
          box.x + box.width / 2,
          box.y + box.height / 2,
          box.width + (vertical ? box.width * 0.6 : 14),
          box.height + (vertical ? 14 : box.height * 0.6),
          options,
        ),
      );
      break;
    case "bracket": {
      const arm = Math.min(6, block * 0.3);
      if (index === 0) {
        drawables.push(
          generator.linearPath(
            [at(arm - 3, -2), at(-3, -2), at(-3, block + 2), at(arm - 3, block + 2)],
            options,
          ),
        );
      }
      if (index === count - 1) {
        const end = inline + 3;
        drawables.push(
          generator.linearPath(
            [at(end - arm, -2), at(end, -2), at(end, block + 2), at(end - arm, block + 2)],
            {
              ...options,
              seed: seed + index + 50,
            },
          ),
        );
      }
      break;
    }
  }
  return drawables.flatMap((drawable) =>
    generator.toPaths(drawable).map((path) => ({ d: path.d, width: path.strokeWidth })),
  );
}

/**
 * A hand-drawn annotation around inline text (rough.js): underline, circle, box, strike-through,
 * highlight or brackets. The text keeps its flow and its own accessible name; the mark is an
 * `aria-hidden` SVG laid over the span's line boxes, one mark per line when the phrase wraps,
 * redrawn when the text reflows or a web font arrives.
 */
export function InkMark({
  kind = "underline",
  color = "ink",
  show = true,
  seed,
  className,
  children,
  ...props
}: InkMarkProps) {
  const id = useId();
  const resolvedSeed = seed ?? hashSeed(id);
  const reduce = useReducedMotion();
  const hostRef = useRef<HTMLSpanElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [layout, setLayout] = useState<Layout | null>(null);
  /** The line boxes and pen the current drawing was measured from. */
  const measuredRef = useRef<string | null>(null);

  const update = useCallback(() => {
    const host = hostRef.current;
    const svg = svgRef.current;
    if (!host || !svg) return;
    // Nothing to redo while the text sits where it sat and the pen is the same. This also ends
    // the pass after the drawing moves into place: its new position must not count as a change.
    const style = getComputedStyle(host);
    const key = [
      ...[...host.getClientRects()].map((r) => `${r.left},${r.top},${r.width},${r.height}`),
      ...PEN_VARIABLES.map((name) => style.getPropertyValue(name)),
      style.writingMode,
      style.direction,
    ].join(";");
    if (key === measuredRef.current) return;
    measuredRef.current = key;
    const next = measure(host, svg);
    setLayout((current) => (sameLayout(current, next) ? current : next));
  }, []);

  // After every render: the children may have changed, and the comparison keeps it to one pass.
  useEffect(() => {
    update();
  });

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    // A reflow (the container resizing) moves line boxes without resizing anything observable
    // on the inline span itself, so watch the block it flows in.
    const target = observableAncestor(host);
    const observer =
      target && typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => update()) : null;
    if (target) observer?.observe(target);
    // A web font swap rewraps the text without resizing the block.
    const fonts = typeof document !== "undefined" ? document.fonts : undefined;
    let live = true;
    fonts?.ready.then(() => {
      if (live) update();
    });
    fonts?.addEventListener?.("loadingdone", update);
    return () => {
      live = false;
      observer?.disconnect();
      fonts?.removeEventListener?.("loadingdone", update);
    };
  }, [update]);

  const highlight = kind === "highlight";
  const lines = layout?.lines ?? [];
  return (
    <span
      data-slot="ink-mark"
      data-kind={kind}
      data-color={color}
      data-show={show}
      data-inked={layout ? "true" : undefined}
      // What the drawing was measured against, so a test can wait until it matches the text.
      data-ink-size={
        layout ? `${Math.round(layout.width)}x${Math.round(layout.height)}` : undefined
      }
      data-ink-lines={layout ? lines.length : undefined}
      // `relative` anchors the drawing, `isolate` keeps a highlight behind these glyphs but above
      // whatever the text sits on; neither changes the text's layout.
      className={cn("relative isolate", className)}
      {...props}
      ref={hostRef}
    >
      {children}
      <svg
        ref={svgRef}
        data-slot="ink-mark-drawing"
        aria-hidden="true"
        focusable="false"
        // Sized to the line boxes it marks, so it adds no scrollable overflow; the strokes that
        // reach past the glyphs paint outside it. Inline, so a host's `[&_svg]:size-4` cannot
        // resize it.
        viewBox={layout ? `0 0 ${layout.width} ${layout.height}` : undefined}
        className={cn(highlight ? HIGHLIGHT_COLORS[color] : STROKE_COLORS[color])}
        style={{
          position: "absolute",
          left: layout?.left ?? 0,
          top: layout?.top ?? 0,
          width: layout?.width ?? 0,
          height: layout?.height ?? 0,
          overflow: "visible",
          pointerEvents: "none",
          zIndex: highlight ? -1 : undefined,
        }}
      >
        {layout &&
          lines.map((box, index) => {
            // Subpaths draw one after another (a box's four sides), sharing the line's time.
            const parts = lineStrokes(kind, box, index, lines.length, layout, resolvedSeed).flatMap(
              (stroke) =>
                stroke.d
                  .split(/(?=M)/)
                  .map((d) => d.trim())
                  .filter(Boolean)
                  .map((d) => ({ d, width: stroke.width })),
            );
            const step = DRAW_SECONDS / Math.max(1, parts.length);
            return (
              <g
                // Line boxes have no identity beyond their order.
                // biome-ignore lint/suspicious/noArrayIndexKey: one group per line box, in order
                key={index}
                data-slot="ink-mark-line"
              >
                {parts.map((part, j) => {
                  const delay = index * DRAW_SECONDS + j * step;
                  const instant = reduce || !show;
                  return (
                    <motion.path
                      // biome-ignore lint/suspicious/noArrayIndexKey: subpaths keep their order
                      key={j}
                      d={part.d}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={part.width}
                      strokeLinecap={highlight ? "butt" : "round"}
                      strokeLinejoin="round"
                      // Strokes that mount with the mark already on appear drawn.
                      initial={false}
                      animate={{ pathLength: show ? 1 : 0, opacity: show ? 1 : 0 }}
                      transition={
                        instant
                          ? { duration: 0 }
                          : {
                              pathLength: { duration: step, delay, ease: "easeOut" },
                              opacity: { duration: 0, delay },
                            }
                      }
                    />
                  );
                })}
              </g>
            );
          })}
      </svg>
    </span>
  );
}
