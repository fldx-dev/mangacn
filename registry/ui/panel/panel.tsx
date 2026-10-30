import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import type * as React from "react";
import { InkFrame } from "@/components/ink-frame";

/** Screentone laid over the paper fill, inset by the stroke so dots stay inside the line. */
const toneVariants = cva("pointer-events-none absolute inset-(--outline-width) -z-1", {
  variants: {
    tone: {
      none: "hidden",
      halftone: "halftone",
      lines: "screentone-lines",
      cross: "screentone-cross",
    },
  },
  defaultVariants: { tone: "none" },
});

/** The caption box sits on its corner, its outline overlapping the panel's. */
const captionVariants = cva("max-w-[85%] px-2.5 py-1 text-xs font-medium sm:text-sm", {
  variants: {
    captionSide: {
      "top-left": "-mt-4 -ml-4 self-start",
      "top-right": "-mt-4 -mr-4 self-end",
      "bottom-left": "order-last mt-auto -mb-4 -ml-4 self-start",
      "bottom-right": "order-last mt-auto -mr-4 -mb-4 self-end",
    },
  },
  defaultVariants: { captionSide: "top-left" },
});

export interface PanelProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof toneVariants>,
    VariantProps<typeof captionVariants> {
  /** A hatched ink shadow behind the panel. Off by default. */
  shadow?: boolean;
  /** Narration box in one corner, rendered as text. */
  caption?: React.ReactNode;
  /** The element to render; its role is the panel's role. */
  as?: keyof React.JSX.IntrinsicElements;
}

/** One manga panel: a heavy hand-drawn ink frame on paper, with optional tone and caption. */
export function Panel({
  className,
  tone,
  shadow = false,
  caption,
  captionSide,
  as = "section",
  children,
  ...props
}: PanelProps) {
  const Tag = as as React.ElementType;
  return (
    <Tag
      data-slot="panel"
      data-tone={tone ?? "none"}
      data-shadow={shadow}
      className={cn("relative isolate flex min-w-0 flex-col gap-3 p-4 text-ink", className)}
      {...props}
    >
      <InkFrame
        as="span"
        shadow={shadow ? "hatch" : "none"}
        className="pointer-events-none absolute inset-0 -z-1 [--outline-width:var(--outline-width-heavy)]"
      />
      <span aria-hidden="true" data-slot="panel-tone" className={toneVariants({ tone })} />
      {caption != null && (
        <InkFrame
          data-slot="panel-caption"
          data-side={captionSide ?? "top-left"}
          className={captionVariants({ captionSide })}
        >
          {caption}
        </InkFrame>
      )}
      {children}
    </Tag>
  );
}
