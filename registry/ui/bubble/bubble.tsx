"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import * as React from "react";
import { InkFrame, type InkFrameProps } from "@/components/ink-frame";

// Based on shadcn/ui Bubble (MIT, https://ui.shadcn.com), base-nova style, fetched 2026-11-12.
// Restyled for mangacn: a chat bubble is a speech bubble. BubbleContent is drawn with
// speech-bubble's pen through InkFrame: `default` (the sender's own) in solid ink with paper
// text, `secondary` and `outline` outlined paper (`outline` with the heavy pen), `muted` on
// tone-1, `tinted` on a light halftone, `destructive` outlined in spot, `ghost` no outline. The
// tail is drawn once per group, on its last bubble, on the side the bubble is aligned to.
// BubbleReactions is a small outlined paper chip.

type Point = [number, number];

// Outline geometry in px: the corner radius (about `rounded-xl` at the theme's radius), where
// the tail leaves the bottom edge, the width of its base, and where its tip lands.
const CORNER = 3;
const TAIL_AT = 10;
const TAIL_BASE = 12;
const TAIL_TIP: Point = [1, 10];

const fmt = ([x, y]: Point) => `${x.toFixed(2)} ${y.toFixed(2)}`;

/**
 * A box with small round corners, clockwise from the top-left; with `tail`, the bottom edge
 * leaves for the tail near its left end. End-aligned bubbles mirror the drawing in CSS.
 */
function bubblePath(w: number, h: number, tail: boolean): string {
  const r = Math.min(CORNER, w / 2, h / 2);
  const bottom: Point[] = [];
  if (tail) {
    const from = Math.min(TAIL_AT + TAIL_BASE, w - r);
    const to = Math.max(r, Math.min(TAIL_AT, from - TAIL_BASE / 2));
    bottom.push([from, h], [TAIL_TIP[0], h + TAIL_TIP[1]], [to, h]);
  }
  return [
    `M ${fmt([r, 0])}`,
    `L ${fmt([w - r, 0])} Q ${fmt([w, 0])} ${fmt([w, r])}`,
    `L ${fmt([w, h - r])} Q ${fmt([w, h])} ${fmt([w - r, h])}`,
    ...bottom.map((point) => `L ${fmt(point)}`),
    `L ${fmt([r, h])} Q ${fmt([0, h])} ${fmt([0, h - r])}`,
    `L ${fmt([0, r])} Q ${fmt([0, 0])} ${fmt([r, 0])} Z`,
  ].join(" ");
}

// Module-level, so the outlines never change identity and frames redraw only on resize.
const plainOutline = (w: number, h: number) => bubblePath(w, h, false);
const tailedOutline = (w: number, h: number) => bubblePath(w, h, true);

/** A pill: a box whose ends are half circles. */
function chipPath(w: number, h: number): string {
  const r = Math.min(h, w) / 2;
  return [
    `M ${fmt([r, 0])} L ${fmt([w - r, 0])}`,
    `A ${r} ${r} 0 0 1 ${fmt([w - r, h])}`,
    `L ${fmt([r, h])}`,
    `A ${r} ${r} 0 0 1 ${fmt([r, 0])} Z`,
  ].join(" ");
}

/** The InkFrame fill each variant draws. Ghost draws none: stock gives it no surface. */
const contentFills: Record<string, InkFrameProps["fill"] | undefined> = {
  default: "ink",
  secondary: "paper",
  muted: "tone",
  tinted: "none",
  outline: "paper",
  destructive: "paper",
};

/** Bubble's variant, read by BubbleContent to choose what its frame draws. */
const BubbleVariantContext = React.createContext<string>("default");

function BubbleGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="bubble-group"
      className={cn("flex min-w-0 flex-col gap-2", className)}
      {...props}
    />
  );
}

const bubbleVariants = cva(
  "group/bubble relative flex w-fit max-w-[80%] min-w-0 flex-col gap-1 group-data-[align=end]/message:self-end data-[align=end]:self-end data-[variant=ghost]:max-w-full",
  {
    variants: {
      variant: {
        default:
          "*:data-[slot=bubble-content]:bg-primary *:data-[slot=bubble-content]:text-primary-foreground [&>[data-slot=bubble-content]:is(button,a):hover]:bg-primary/80 [&>[data-slot=bubble-content]:is(button,a):hover>[data-slot=ink-frame]]:opacity-80",
        secondary:
          "*:data-[slot=bubble-content]:bg-background *:data-[slot=bubble-content]:text-secondary-foreground [&>[data-slot=bubble-content]:is(button,a):hover]:[--paper:var(--muted)]",
        muted:
          "*:data-[slot=bubble-content]:bg-muted *:data-[slot=bubble-content]:text-foreground [&>[data-slot=bubble-content]:is(button,a):hover>[data-slot=ink-frame]]:opacity-80",
        tinted:
          "*:data-[slot=bubble-content]:bg-background *:data-[slot=bubble-content]:halftone-light *:data-[slot=bubble-content]:text-foreground [&>[data-slot=bubble-content]:is(button,a):hover]:bg-muted",
        outline:
          "*:data-[slot=bubble-content]:bg-background *:data-[slot=bubble-content]:text-foreground [&>[data-slot=bubble-content]:is(button,a):hover]:[--paper:var(--muted)]",
        ghost:
          "border-none *:data-[slot=bubble-content]:rounded-none *:data-[slot=bubble-content]:bg-transparent *:data-[slot=bubble-content]:p-0 [&>[data-slot=bubble-content]:is(button,a):hover]:bg-muted [&>[data-slot=bubble-content]:is(button,a):hover]:text-foreground",
        destructive:
          "*:data-[slot=bubble-content]:bg-background *:data-[slot=bubble-content]:text-destructive *:data-[slot=bubble-content]:[--ink:var(--destructive)] [&>[data-slot=bubble-content]:is(button,a):hover]:[--paper:color-mix(in_oklch,var(--destructive)_12%,var(--background))]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Bubble({
  variant = "default",
  align = "start",
  className,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof bubbleVariants> & {
    align?: "start" | "end";
  }) {
  return (
    <BubbleVariantContext.Provider value={variant ?? "default"}>
      <div
        data-slot="bubble"
        data-variant={variant}
        data-align={align}
        className={cn(bubbleVariants({ variant }), className)}
        {...props}
      />
    </BubbleVariantContext.Provider>
  );
}

function BubbleContent({ className, render, children, ...props }: useRender.ComponentProps<"div">) {
  const variant = React.useContext(BubbleVariantContext);
  const fill = contentFills[variant];
  // Two frames, one with the tail and one without. The last bubble of a run shows the tailed
  // one: a bubble whose next sibling is not a bubble aligned the same way (the last of a
  // BubbleGroup, or a bubble on its own). End-aligned bubbles, or bubbles in an
  // end-aligned message, mirror the drawing so the tail points right.
  const frame = cn(
    "pointer-events-none absolute inset-0 -z-1 group-data-[align=end]/bubble:-scale-x-100 group-data-[align=end]/message:-scale-x-100",
    variant === "muted" && "[--tone-2:var(--tone-1)]",
    variant === "outline" && "[--outline-width:var(--outline-width-heavy)]",
  );
  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(
      {
        className: cn(
          // The tail reaches below the last bubble's box (`mb-2.5` keeps what follows clear),
          // and the drawing reaches past every box, so nothing here clips.
          "relative isolate w-fit max-w-full min-w-0 rounded-xl border-0 px-3 py-2 text-sm leading-relaxed wrap-break-word group-data-[align=end]/bubble:self-end has-[>[data-inked=true]]:bg-transparent! [[data-slot=bubble]:not([data-align=start]:has(+[data-slot=bubble][data-align=start])):not([data-align=end]:has(+[data-slot=bubble][data-align=end])):not([data-variant=ghost])>&]:mb-2.5 [button]:text-left [button,a]:transition-colors [button,a]:outline-none [button,a]:focus-visible:ring-3 [button,a]:focus-visible:ring-ring/50",
          className,
        ),
        children: (
          <>
            {fill && (
              <>
                <InkFrame
                  as="span"
                  fill={fill}
                  outline={plainOutline}
                  className={cn(
                    frame,
                    "[[data-slot=bubble]:not([data-align=start]:has(+[data-slot=bubble][data-align=start])):not([data-align=end]:has(+[data-slot=bubble][data-align=end]))>[data-slot=bubble-content]>&]:hidden",
                  )}
                />
                <InkFrame
                  as="span"
                  fill={fill}
                  outline={tailedOutline}
                  className={cn(
                    frame,
                    "hidden [[data-slot=bubble]:not([data-align=start]:has(+[data-slot=bubble][data-align=start])):not([data-align=end]:has(+[data-slot=bubble][data-align=end]))>[data-slot=bubble-content]>&]:block",
                  )}
                />
              </>
            )}
            {children}
          </>
        ),
      },
      props,
    ),
    render,
    state: {
      slot: "bubble-content",
    },
  });
}

const bubbleReactionsVariants = cva(
  "absolute isolate z-10 flex w-fit shrink-0 items-center justify-center gap-1 rounded-full bg-background px-2 py-0.5 text-sm text-foreground has-[button]:p-0 has-[>[data-inked=true]]:bg-transparent!",
  {
    variants: {
      side: {
        top: "top-0 -translate-y-3/4",
        bottom: "bottom-0 translate-y-3/4",
      },
      align: {
        start: "left-3",
        end: "right-3",
      },
    },
    defaultVariants: {
      side: "bottom",
      align: "end",
    },
  },
);

function BubbleReactions({
  side = "bottom",
  align = "end",
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  align?: "start" | "end";
  side?: "top" | "bottom";
}) {
  return (
    <div
      data-slot="bubble-reactions"
      data-align={align}
      data-side={side}
      className={cn(bubbleReactionsVariants({ side, align }), className)}
      {...props}
    >
      <InkFrame
        as="span"
        fill="paper"
        outline={chipPath}
        className="pointer-events-none absolute inset-0 -z-1 rounded-full"
      />
      {children}
    </div>
  );
}

export { Bubble, BubbleContent, BubbleGroup, BubbleReactions };
