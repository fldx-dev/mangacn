"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/registry/ui/button/button";
import { StageFrame } from "./stage-frame";

/** The widths a page block is previewed at, in CSS pixels: a phone, a tablet, a desktop. */
export const PREVIEW_WIDTHS = [
  { id: "phone", label: "Phone", width: 375 },
  { id: "tablet", label: "Tablet", width: 768 },
  { id: "desktop", label: "Desktop", width: 1280 },
] as const;

export type PreviewWidth = (typeof PREVIEW_WIDTHS)[number]["id"];

export interface BlockPreviewProps {
  /** The page block, shown from `/view/<item>`. */
  item: string;
  /** The preview box's height; the page inside is scaled to fill it. */
  height?: string;
}

/**
 * A page block's whole page in a frame: `/view/<item>` in an iframe at a phone's, a tablet's or
 * a desktop's width, scaled down to the docs column when it is wider, so the page lays out as it
 * would on that screen. The box keeps its height whatever the width, so nothing below it moves;
 * the frame follows the site's light or dark theme (StageFrame).
 */
export function BlockPreview({ item, height = "36rem" }: BlockPreviewProps) {
  const [size, setSize] = useState<PreviewWidth>("desktop");
  const box = useRef<HTMLDivElement>(null);
  const [boxWidth, setBoxWidth] = useState<number | null>(null);

  useEffect(() => {
    const node = box.current;
    if (!node || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => setBoxWidth(entry.contentRect.width));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const preset = PREVIEW_WIDTHS.find((candidate) => candidate.id === size) ?? PREVIEW_WIDTHS[2];
  // Until the box is measured the page fills it unscaled, at the column's own width.
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
              onClick={() => setSize(candidate.id)}
            >
              {candidate.label}
            </Button>
          ))}
        </div>
      </div>
      <div
        ref={box}
        data-slot="block-preview-box"
        className="overflow-hidden rounded-sm border bg-paper"
        style={{ height }}
      >
        <div
          style={{
            width: boxWidth ? preset.width : "100%",
            height: `calc(${height} / ${scale})`,
            transform: scale < 1 ? `scale(${scale})` : undefined,
            transformOrigin: "top left",
          }}
          className="mx-auto"
        >
          <StageFrame
            src={src}
            title={`${item} page at ${preset.label.toLowerCase()} width`}
            height="100%"
            className="rounded-none border-0"
          />
        </div>
      </div>
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
