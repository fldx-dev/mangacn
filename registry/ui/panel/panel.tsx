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

/**
 * The caption box is caption-box's corner box: absolute on its corner, its heavy outline on the
 * panel's frame, in the same face, size and padding, so the two caption mechanisms match.
 */
const captionVariants = cva(
  "absolute z-1 w-fit max-w-[85%] px-3 py-1.5 text-sm leading-snug text-ink isolate",
  {
    variants: {
      captionSide: {
        "top-left": "top-0 left-0",
        "top-right": "top-0 right-0",
        "bottom-left": "bottom-0 left-0",
        "bottom-right": "right-0 bottom-0",
      },
      captionFont: {
        dialogue: "font-dialogue",
        body: "font-sans",
      },
    },
    defaultVariants: { captionSide: "top-left", captionFont: "dialogue" },
  },
);

/**
 * Room for a one-line caption on its side: the box (a line of `text-sm` at `leading-snug`,
 * plus `py-1.5`) and the panel's `gap-3` before the content. Theme values, no literal sizes.
 */
const captionRoomVariants = cva(
  "[--panel-caption-room:calc(var(--text-sm)*var(--leading-snug)+--spacing(6))]",
  {
    variants: {
      captionSide: {
        "top-left": "pt-(--panel-caption-room)",
        "top-right": "pt-(--panel-caption-room)",
        "bottom-left": "pb-(--panel-caption-room)",
        "bottom-right": "pb-(--panel-caption-room)",
      },
    },
    defaultVariants: { captionSide: "top-left" },
  },
);

export interface PanelProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof toneVariants>,
    VariantProps<typeof captionVariants> {
  /**
   * Screentone over the paper inside the frame: halftone dots, diagonal lines or cross-hatching.
   * @default "none"
   */
  tone?: VariantProps<typeof toneVariants>["tone"];
  /**
   * A hatched ink shadow behind the panel.
   * @default false
   */
  shadow?: boolean;
  /**
   * Narration box on one corner, rendered as text: the same box as caption-box's `corner`. The
   * panel keeps one line of room for it on that side; for a caption that wraps, add padding
   * on that side (`pt-16`), or the content runs under it.
   */
  caption?: React.ReactNode;
  /**
   * The corner the caption box sits on, its outline overlapping the panel's.
   * @default "top-left"
   */
  captionSide?: VariantProps<typeof captionVariants>["captionSide"];
  /**
   * The caption's face: `dialogue` (the lettering face, as caption-box) or `body`.
   * @default "dialogue"
   */
  captionFont?: VariantProps<typeof captionVariants>["captionFont"];
  /**
   * The element to render; its role is the panel's role.
   * @default "section"
   */
  as?: keyof React.JSX.IntrinsicElements;
}

/** One manga panel: a heavy hand-drawn ink frame on paper, with optional tone and caption. */
export function Panel({
  className,
  tone,
  shadow = false,
  caption,
  captionSide,
  captionFont,
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
      className={cn(
        "relative isolate flex min-w-0 flex-col gap-3 p-4 text-ink",
        caption != null && captionRoomVariants({ captionSide }),
        className,
      )}
      {...props}
    >
      <InkFrame
        as="span"
        shadow={shadow ? "hatch" : "none"}
        className="pointer-events-none absolute inset-0 -z-1 [--outline-width:var(--outline-width-heavy)]"
      />
      <span aria-hidden="true" data-slot="panel-tone" className={toneVariants({ tone })} />
      {caption != null && (
        <div
          data-slot="panel-caption"
          data-side={captionSide ?? "top-left"}
          data-font={captionFont ?? "dialogue"}
          className={captionVariants({ captionSide, captionFont })}
        >
          <InkFrame
            as="span"
            fill="paper"
            className="pointer-events-none absolute inset-0 -z-1 rounded-none [--outline-width:var(--outline-width-heavy)]"
          />
          {caption}
        </div>
      )}
      {children}
    </Tag>
  );
}
