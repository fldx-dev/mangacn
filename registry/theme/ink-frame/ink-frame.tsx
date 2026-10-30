"use client";

import type * as React from "react";
import { useEffect, useId, useRef } from "react";
import rough from "roughjs";
import { cn } from "@/lib/utils";

type InkFrameShape = "rect" | "ellipse" | "line";
type InkFrameFill = "none" | "paper" | "ink" | "tone";
type InkFrameShadow = "none" | "hatch" | "solid";

export interface InkFrameProps extends React.HTMLAttributes<HTMLElement> {
  /** `line` draws one stroke across the box, horizontal or vertical by aspect ratio. */
  shape?: InkFrameShape;
  fill?: InkFrameFill;
  /** Off by default: mangacn draws no shadow unless a component asks for one. */
  shadow?: InkFrameShadow;
  /** Same seed, same wobble. Defaults to a stable hash of `useId()`. */
  seed?: number;
  /**
   * A custom outline (a speech bubble with its tail, a burst): an SVG path in border-box
   * pixels, `0 0` at the top-left corner, drawn instead of `shape`'s outline with the same pen,
   * fill and shadow. `shape` still picks the CSS fallback. A new function redraws, so memoise it.
   */
  outline?: (width: number, height: number) => string;
  /** Draws the stroke dashed (whisper and thought bubbles). */
  dashed?: boolean;
  as?: keyof React.JSX.IntrinsicElements;
}

/** Room around the box for wobble, half the stroke and the shadow offset. */
const PAD = 8;

// Colours stay CSS variables so a theme switch or an `[--ink:var(--spot)]` override repaints
// without redrawing.
const INK = "var(--ink)";
const FILLS: Record<InkFrameFill, string | undefined> = {
  none: undefined,
  paper: "var(--paper)",
  ink: INK,
  tone: "var(--tone-2)",
};

/** CSS fallback shown until the first drawing (server render, no `ResizeObserver`). */
const FALLBACK_FILLS: Record<InkFrameFill, string> = {
  none: "",
  paper: "bg-paper",
  ink: "bg-ink",
  tone: "bg-tone-2",
};

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

/** rough.js writes colours as presentation attributes, which cannot hold `var()`. */
function moveColorsToStyle(svg: SVGSVGElement) {
  for (const node of svg.querySelectorAll<SVGElement>("[fill], [stroke]")) {
    for (const attribute of ["fill", "stroke"]) {
      const value = node.getAttribute(attribute);
      if (value?.startsWith("var(")) {
        node.style.setProperty(attribute, value);
        node.removeAttribute(attribute);
      }
    }
  }
}

function draw(
  svg: SVGSVGElement,
  host: HTMLElement,
  width: number,
  height: number,
  {
    shape,
    fill,
    shadow,
    seed,
    outline,
    dashed,
  }: Required<Pick<InkFrameProps, "shape" | "fill" | "shadow" | "seed" | "dashed">> &
    Pick<InkFrameProps, "outline">,
) {
  const style = getComputedStyle(host);
  const strokeWidth = readNumber(style, "--outline-width", 1.5);
  // A 16 px radio or thought dot turns lumpy at the theme's pen settings, so ellipses under
  // 32 px scale both pen numbers down (never below half); a 16 px dot then strays, relative
  // to its radius, like a 64 px ellipse at full strength.
  const calm =
    shape === "ellipse" && !outline ? Math.min(1, Math.max(0.5, Math.min(width, height) / 32)) : 1;
  const roughness = readNumber(style, "--ink-roughness", 1.2) * calm;
  const bowing = readNumber(style, "--ink-bowing", 0.8);
  const maxRandomnessOffset = readNumber(style, "--ink-offset", 1.5) * calm;
  // The clean pen: one stroke per edge, corners that meet.
  const pen = {
    disableMultiStroke: true,
    disableMultiStrokeFill: true,
    preserveVertices: true,
  };
  const base = {
    ...pen,
    seed,
    roughness,
    bowing,
    maxRandomnessOffset,
    stroke: INK,
    strokeWidth,
    ...(dashed ? { strokeLineDash: [strokeWidth * 4, strokeWidth * 3] } : {}),
  };

  svg.replaceChildren();
  svg.setAttribute("viewBox", `0 0 ${width + PAD * 2} ${height + PAD * 2}`);
  const rc = rough.svg(svg);
  const nodes: SVGGElement[] = [];
  /** The closed outline (custom, ellipse or rect) with its top-left corner at `x, y`. */
  const body = (x: number, y: number, options: Parameters<typeof rc.rectangle>[4]) => {
    // rough.js ellipses overshoot their start, leaving a hook (and a visible overlap when
    // dashed); two arcs close exactly, so every ellipse goes through the path renderer.
    const arc = `A ${width / 2} ${height / 2} 0 1 1`;
    const path =
      outline?.(width, height) ??
      (shape === "ellipse"
        ? `M 0 ${height / 2} ${arc} ${width} ${height / 2} ${arc} 0 ${height / 2} Z`
        : undefined);
    if (path) {
      const node = rc.path(path, options);
      node.setAttribute("transform", `translate(${x} ${y})`);
      return node;
    }
    return rc.rectangle(x, y, width, height, options);
  };

  if (shadow !== "none" && shape !== "line") {
    const offset = readNumber(style, "--shadow-offset", 4) + strokeWidth / 2;
    const options = {
      ...pen,
      seed: seed + 100,
      roughness: roughness * 0.6,
      bowing: bowing * 0.5,
      maxRandomnessOffset,
      stroke: "none",
      fill: INK,
      ...(shadow === "solid"
        ? { fillStyle: "solid" }
        : {
            fillStyle: "hachure",
            hachureGap: readNumber(style, "--ink-hachure-gap", 4),
            hachureAngle: -45,
            fillWeight: Math.max(0.9, strokeWidth * 0.5),
          }),
    };
    nodes.push(body(PAD + offset, PAD + offset, options));
  }

  const color = FILLS[fill];
  const options = color ? { ...base, fill: color, fillStyle: "solid" } : base;
  if (shape === "line") {
    nodes.push(
      width >= height
        ? rc.line(PAD, PAD + height / 2, PAD + width, PAD + height / 2, base)
        : rc.line(PAD + width / 2, PAD, PAD + width / 2, PAD + height, base),
    );
  } else {
    nodes.push(body(PAD, PAD, options));
  }

  svg.append(...nodes);
  moveColorsToStyle(svg);
}

/**
 * A hand-drawn ink outline (rough.js) behind its children. Draws on mount and whenever the
 * box resizes; until then, and where `ResizeObserver` is missing, a plain CSS border stands in.
 */
export function InkFrame({
  shape = "rect",
  fill = "paper",
  shadow = "none",
  seed,
  outline,
  dashed = false,
  as = "div",
  className,
  children,
  ...props
}: InkFrameProps) {
  const id = useId();
  const hostRef = useRef<HTMLElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const resolvedSeed = seed ?? hashSeed(id);

  useEffect(() => {
    const host = hostRef.current;
    const svg = svgRef.current;
    if (!host || !svg || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => {
      // The border box from the entry is fractional and ignores transforms (the pressed
      // translate); offsetWidth rounds, and a rounded viewBox over a fractional box scales the
      // drawing, which showed as lines stopping short of their ends. jsdom has neither.
      const box = entry?.borderBoxSize?.[0];
      const vertical = getComputedStyle(host).writingMode.startsWith("vertical");
      const inline = box?.inlineSize || 0;
      const block = box?.blockSize || 0;
      const width =
        (vertical ? block : inline) || host.offsetWidth || entry?.contentRect.width || 0;
      const height =
        (vertical ? inline : block) || host.offsetHeight || entry?.contentRect.height || 0;
      if (width === 0 && height === 0) return;
      draw(svg, host, width, height, {
        shape,
        fill,
        shadow,
        seed: resolvedSeed,
        outline,
        dashed,
      });
      host.dataset.inked = "true";
      // What the drawing was measured against, so a test can wait until it matches the box.
      host.dataset.inkSize = `${width}x${height}`;
    });
    observer.observe(host, { box: "border-box" });
    return () => observer.disconnect();
  }, [shape, fill, shadow, resolvedSeed, outline, dashed]);

  const Tag = as as React.ElementType;
  // The drawing covers the border box, but absolute children start inside the (transparent)
  // fallback border, so step out by its width too. `line` has no border.
  const reach = shape === "line" ? `${PAD}px` : `(${PAD}px + var(--outline-width))`;
  return (
    <Tag
      data-slot="ink-frame"
      data-shape={shape}
      data-fill={fill}
      className={cn(
        "relative isolate",
        shape === "line"
          ? "bg-ink data-[inked=true]:bg-transparent"
          : cn(
              "ink-border data-[inked=true]:border-transparent",
              shape === "ellipse" ? "rounded-[50%]" : "rounded-[var(--radius)]",
              FALLBACK_FILLS[fill],
              fill !== "none" && "data-[inked=true]:bg-transparent",
            ),
        className,
      )}
      {...props}
      ref={hostRef}
    >
      <svg
        ref={svgRef}
        aria-hidden="true"
        focusable="false"
        // The viewBox is the measured box; map it edge to edge rather than letting a sub-pixel
        // mismatch scale the drawing inside the box.
        preserveAspectRatio="none"
        // Inline, so a host's `[&_svg]:size-4` cannot resize the drawing.
        style={{
          position: "absolute",
          top: `calc(-1 * ${reach})`,
          left: `calc(-1 * ${reach})`,
          width: `calc(100% + 2 * ${reach})`,
          height: `calc(100% + 2 * ${reach})`,
          zIndex: -1,
          overflow: "visible",
          pointerEvents: "none",
        }}
      />
      {children}
    </Tag>
  );
}
