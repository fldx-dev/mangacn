"use client";

import { useEffect, useRef, useState } from "react";
import { PREVIEW_WIDTHS, type PreviewWidth } from "@/components/docs/preview-widths";
import { CODE_MESSAGE, READY_MESSAGE } from "@/lib/create/frame";
import { type PreviewPage, previewUrl } from "@/lib/create/pages";
import type { Mode } from "@/lib/registry/contrast";
import { cn } from "@/lib/utils";
import { ToggleGroup, ToggleGroupItem } from "@/registry/ui/toggle-group/toggle-group";

/**
 * Below this box width only the phone's width is offered: a tablet or a desktop scaled into a
 * phone's column is too small to read.
 */
export const PHONE_ONLY_BELOW = 480;

/** Sends a frame the canonical code, to this origin only. */
function postCode(target: Window | null | undefined, code: string) {
  target?.postMessage({ type: CODE_MESSAGE, code }, window.location.origin);
}

export interface CreateBlockFrameProps {
  page: PreviewPage;
  /** The canonical code of the configuration shown. */
  code: string;
  mode: Mode;
}

/**
 * A page block in a frame at the current code and mode, laid out at a phone's, a tablet's or a
 * desktop's width and scaled down to the box. The frame loads once per mode; a new code reaches
 * it as a same-origin message carrying only the code, which the frame decodes itself
 * (lib/create/frame.ts), so a slider drag restyles the page in place. The box keeps its height,
 * so nothing around it moves when the frame loads.
 */
export function CreateBlockFrame({ page, code, mode }: CreateBlockFrameProps) {
  const box = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const [boxWidth, setBoxWidth] = useState<number | null>(null);
  const [size, setSize] = useState<PreviewWidth | null>(null);
  const latest = useRef(code);
  latest.current = code;

  useEffect(() => {
    const node = box.current;
    if (!node || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => setBoxWidth(entry.contentRect.width));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const phoneOnly = boxWidth !== null && boxWidth < PHONE_ONLY_BELOW;
  const widths = phoneOnly
    ? PREVIEW_WIDTHS.filter((width) => width.id === "phone")
    : PREVIEW_WIDTHS;
  // Until picked: the desktop on a wide box, the phone on anything narrower than a tablet.
  const fallback: PreviewWidth =
    boxWidth !== null && boxWidth < PREVIEW_WIDTHS[1].width ? "phone" : "desktop";
  const chosen = phoneOnly ? "phone" : (size ?? fallback);
  const preset = PREVIEW_WIDTHS.find((width) => width.id === chosen) ?? PREVIEW_WIDTHS[0];
  const scale = boxWidth ? Math.min(1, boxWidth / preset.width) : 1;

  // Loaded once per page and mode, at the code of that moment; later codes are messages.
  const [src, setSrc] = useState(() => previewUrl(page, code, mode));
  useEffect(() => {
    setSrc(previewUrl(page, latest.current, mode));
  }, [page, mode]);

  // The frame says when it listens; answer with the code current then.
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const target = frame.current?.contentWindow;
      if (!target || event.source !== target || event.origin !== window.location.origin) return;
      if ((event.data as { type?: unknown } | null)?.type === READY_MESSAGE)
        postCode(target, latest.current);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    postCode(frame.current?.contentWindow, code);
  }, [code]);

  return (
    <div data-slot="create-block" data-block={page.block} className="grid min-w-0 gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground" data-slot="create-block-caption">
          {`${preset.label}, ${preset.width} px`}
          {scale < 1 ? `, scaled to ${Math.round(scale * 100)}%` : ""}
        </p>
        <ToggleGroup
          aria-label="Preview width"
          variant="outline"
          size="sm"
          spacing={0}
          value={[chosen]}
          onValueChange={(value: unknown[]) => {
            const next = value[0] as PreviewWidth | undefined;
            if (next) setSize(next);
          }}
        >
          {widths.map((width) => (
            <ToggleGroupItem key={width.id} value={width.id}>
              {width.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      <div
        ref={box}
        data-slot="create-block-box"
        className="h-[32rem] overflow-hidden rounded-sm border bg-paper sm:h-[40rem]"
      >
        <div
          className={cn("mx-auto", boxWidth && boxWidth > preset.width && "outline outline-border")}
          style={{
            width: boxWidth ? preset.width : "100%",
            height: `${100 / scale}%`,
            transform: scale < 1 ? `scale(${scale})` : undefined,
            transformOrigin: "top left",
          }}
        >
          <iframe
            ref={frame}
            src={src}
            title={`${page.label} page in the chosen look`}
            loading="lazy"
            className="block size-full border-0 bg-paper"
          />
        </div>
      </div>
    </div>
  );
}
