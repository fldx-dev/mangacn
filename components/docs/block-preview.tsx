"use client";

import { cn } from "cn";
import { type ComponentProps, useEffect, useRef, useState } from "react";
import { Button } from "@/registry/ui/button/button";
import { PREVIEW_WIDTHS, type PreviewWidth } from "./preview-widths";
import { StageFrame } from "./stage-frame";

export interface ScaledViewProps extends Omit<ComponentProps<"div">, "children"> {
  /** The page block, shown from `/view/<item>`. */
  item: string;
  /** The width the page lays out at, in CSS pixels. */
  width: number;
  /** The frame's accessible name. */
  title: string;
  /** A preview, not a live page (see StageFrame). */
  inert?: boolean;
  /** Called with the box's width each time it is measured. */
  onMeasure?: (width: number) => void;
}

/**
 * `/view/<item>` laid out at `width` and scaled down to its box when the box is narrower, so the
 * page shows as it would on that screen. Give the box its height (a class or style): the page
 * fills it at any scale, so nothing around it moves. Narrower than the box, the frame is centred
 * with its edges ruled. The frame follows the site's light or dark theme (StageFrame).
 */
export function ScaledView({
  item,
  width,
  title,
  inert,
  onMeasure,
  className,
  ...props
}: ScaledViewProps) {
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
  const scale = boxWidth ? Math.min(1, boxWidth / width) : 1;
  return (
    <div ref={box} inert={inert} className={cn("overflow-hidden", className)} {...props}>
      <div
        // Narrower than the box, the screen's edges show as an outline, which takes no width.
        className={cn("mx-auto", boxWidth && boxWidth > width && "outline outline-border")}
        style={{
          width: boxWidth ? width : "100%",
          height: `${100 / scale}%`,
          transform: scale < 1 ? `scale(${scale})` : undefined,
          transformOrigin: "top left",
        }}
      >
        <StageFrame
          src={`/view/${item}`}
          title={title}
          height="100%"
          inert={inert}
          className="rounded-none border-0"
        />
      </div>
    </div>
  );
}

export interface BlockPreviewProps {
  /** The page block, shown from `/view/<item>`. */
  item: string;
  /** The preview box's height; the page inside is scaled to fill it. */
  height?: string;
}

/**
 * A page block's whole page in a frame, at a phone's, a tablet's or a desktop's width (buttons
 * pick one), scaled down to the docs column when it is wider. A column narrower than a tablet
 * opens at the phone's width. The box keeps its height whatever the width.
 */
export function BlockPreview({ item, height = "36rem" }: BlockPreviewProps) {
  const [size, setSize] = useState<PreviewWidth>("desktop");
  const [boxWidth, setBoxWidth] = useState<number | null>(null);
  // Whether the width is settled: by the first measurement, or by the reader's pick.
  const settled = useRef(false);

  const onMeasure = (width: number) => {
    if (!settled.current && width < PREVIEW_WIDTHS[1].width) setSize("phone");
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
