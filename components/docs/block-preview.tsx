"use client";

import { cn } from "cn";
import { type ComponentProps, useEffect, useRef, useState } from "react";
import { Button } from "@/registry/ui/button/button";
import {
  PREVIEW_WIDTHS,
  type PreviewWidth,
  SHELL_DESKTOP_MIN_BOX,
  SHELL_MIN_SCALE,
} from "./preview-widths";
import { StageFrame } from "./stage-frame";

export interface ScaledFrameProps extends Omit<ComponentProps<"div">, "children"> {
  /** The page or stage the frame loads. */
  src: string;
  /** The width the page lays out at, in CSS pixels. */
  width: number;
  /** The frame's accessible name. */
  title: string;
  /** A preview, not a live page (see StageFrame). */
  inert?: boolean;
  /**
   * A box wider than `width` lays the page out at the box's own width, filling it, rather than
   * centring a `width`-wide screen in it: `width` is then a minimum.
   */
  fill?: boolean;
  /**
   * A box narrower than this lays the page out at the box's own width, unscaled, so the page
   * shows its phone layout instead of a desktop shrunk past reading.
   */
  nativeBelow?: number;
  /** Called with the box's width each time it is measured. */
  onMeasure?: (width: number) => void;
}

/** The width a frame's page lays out at in a box `boxWidth` wide (see ScaledFrameProps). */
export function layoutWidth(
  boxWidth: number,
  { width, fill, nativeBelow }: Pick<ScaledFrameProps, "width" | "fill" | "nativeBelow">,
): number {
  if (nativeBelow !== undefined && boxWidth < nativeBelow) return boxWidth;
  return fill ? Math.max(boxWidth, width) : width;
}

/**
 * A page laid out at `width` and scaled down to its box when the box is narrower, so the page
 * shows as it would on that screen. Give the box its height (a class or style): the page fills
 * it at any scale, so nothing around it moves. Narrower than the box, the frame is centred with
 * its edges ruled (unless `fill`). The frame follows the site's light or dark theme (StageFrame).
 */
export function ScaledFrame({
  src,
  width,
  title,
  inert,
  fill,
  nativeBelow,
  onMeasure,
  className,
  ...props
}: ScaledFrameProps) {
  const box = useRef<HTMLDivElement>(null);
  const [boxWidth, setBoxWidth] = useState<number | null>(null);
  const measured = useRef(onMeasure);
  measured.current = onMeasure;

  useEffect(() => {
    const node = box.current;
    if (!node || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => {
      measured.current?.(entry.contentRect.width);
      setBoxWidth(entry.contentRect.width);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Until the box is measured the page fills it unscaled, at the box's own width.
  const laidOut = boxWidth ? layoutWidth(boxWidth, { width, fill, nativeBelow }) : null;
  const scale = boxWidth && laidOut ? Math.min(1, boxWidth / laidOut) : 1;
  return (
    <div
      ref={box}
      inert={inert}
      data-layout-width={laidOut ?? undefined}
      className={cn("overflow-hidden", className)}
      {...props}
    >
      <div
        // Narrower than the box, the screen's edges show as an outline, which takes no width.
        className={cn(
          "mx-auto",
          boxWidth && laidOut && boxWidth > laidOut && "outline outline-border",
        )}
        style={{
          width: laidOut ?? "100%",
          height: `${100 / scale}%`,
          transform: scale < 1 ? `scale(${scale})` : undefined,
          transformOrigin: "top left",
        }}
      >
        <StageFrame
          src={src}
          title={title}
          height="100%"
          inert={inert}
          className="rounded-none border-0"
        />
      </div>
    </div>
  );
}

export interface ScaledViewProps extends Omit<ScaledFrameProps, "src" | "fill" | "nativeBelow"> {
  /** The page block, shown from `/view/<item>`. */
  item: string;
}

/** A page block's `/view/<item>` in a ScaledFrame, at `width` and centred in a wider box. */
export function ScaledView({ item, ...props }: ScaledViewProps) {
  return <ScaledFrame src={`/view/${item}`} {...props} />;
}

export interface BlockPreviewProps {
  /** The page block, shown from `/view/<item>`. */
  item: string;
  /** The preview box's height; the page inside is scaled to fill it. */
  height?: string;
  /**
   * The page is an app shell whose sidebar turns into a sheet below a tablet's width: it opens at
   * the widest of the desktop and tablet widths that scales to the docs column no smaller than
   * SHELL_MIN_SCALE, so the preview shows the sidebar beside the page, and at the phone's width
   * in a column narrower than SHELL_DESKTOP_MIN_BOX. The docs MDX sets it from the registry
   * (DocsBlockPreview).
   */
  shell?: boolean;
}

/** The width a BlockPreview opens at in a box `boxWidth` wide (see BlockPreviewProps). */
function initialSize(boxWidth: number, shell?: boolean): PreviewWidth {
  if (!shell) return boxWidth < PREVIEW_WIDTHS[1].width ? "phone" : "desktop";
  if (boxWidth >= PREVIEW_WIDTHS[2].width * SHELL_MIN_SCALE) return "desktop";
  return boxWidth >= SHELL_DESKTOP_MIN_BOX ? "tablet" : "phone";
}

/**
 * A page block's whole page in a frame, at a phone's, a tablet's or a desktop's width (buttons
 * pick one), scaled down to the docs column when it is wider. A column narrower than a tablet
 * opens at the phone's width; an app shell (`shell`) opens as that prop says. The box keeps its
 * height whatever the width.
 */
export function BlockPreview({ item, height = "36rem", shell }: BlockPreviewProps) {
  const [size, setSize] = useState<PreviewWidth>("desktop");
  const [boxWidth, setBoxWidth] = useState<number | null>(null);
  // Whether the width is settled: by the first measurement, or by the reader's pick.
  const settled = useRef(false);

  const onMeasure = (width: number) => {
    if (!settled.current) setSize(initialSize(width, shell));
    settled.current = true;
    setBoxWidth(width);
  };

  const preset = PREVIEW_WIDTHS.find((candidate) => candidate.id === size) ?? PREVIEW_WIDTHS[2];
  const scale = boxWidth ? Math.min(1, boxWidth / preset.width) : 1;
  const src = `/view/${item}`;

  return (
    <figure data-slot="block-preview" data-width={size} className="not-prose flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <figcaption className="text-sm text-fd-muted-foreground">
          {preset.label}, {preset.width} px
          {scale < 1 ? `, scaled to ${Math.round(scale * 100)}%` : ""}
        </figcaption>
        {/* biome-ignore lint/a11y/useSemanticElements: a group of toggle buttons, not a form field */}
        <div role="group" aria-label="Preview width" className="flex gap-1">
          {PREVIEW_WIDTHS.map((candidate) => (
            <Button
              key={candidate.id}
              type="button"
              size="sm"
              variant={candidate.id === size ? "default" : "outline"}
              aria-pressed={candidate.id === size}
              onClick={() => {
                settled.current = true;
                setSize(candidate.id);
              }}
            >
              {candidate.label}
            </Button>
          ))}
        </div>
      </div>
      <ScaledView
        item={item}
        width={preset.width}
        title={`${item} page at ${preset.label.toLowerCase()} width`}
        onMeasure={onMeasure}
        data-slot="block-preview-box"
        className="rounded-sm border bg-paper"
        style={{ height }}
      />
      <a
        href={src}
        aria-label={`Open the page: ${item}`}
        className="self-end text-sm text-fd-muted-foreground underline underline-offset-4 hover:text-fd-foreground"
      >
        Open the page
      </a>
    </figure>
  );
}
