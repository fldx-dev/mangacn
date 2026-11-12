"use client";

import { Dices } from "lucide-react";
import { type CSSProperties, type ReactNode, useLayoutEffect, useMemo, useRef } from "react";
import type { CreateConfig } from "@/lib/create/config";
import { previewVariables } from "@/lib/create/preview";
import type { Mode } from "@/lib/registry/contrast";
import { cn } from "@/lib/utils";
import { INK_REDRAW_EVENT, InkFrame } from "@/registry/theme/ink-frame/ink-frame";
import { Button } from "@/registry/ui/button/button";
import { ToggleGroup, ToggleGroupItem } from "@/registry/ui/toggle-group/toggle-group";
import { CREATE_FONT_CLASSES } from "./create-fonts";

/** The shortest time between two redraws of the preview's drawings while a value moves. */
export const REDRAW_INTERVAL = 120;

export interface CreatePreviewProps {
  config: CreateConfig;
  /** The preview's mode, or null before the page knows the site's (the server render). */
  mode: Mode | null;
  onModeChange: (mode: Mode) => void;
  /** Offset of every drawing's seed (`--ink-seed`); 0 draws as the site does. */
  seed: number;
  onReroll: () => void;
  /** A note above the preview (a refused code). */
  note?: ReactNode;
  /** What the preview shows: the specimen today; C5 adds page blocks. */
  children: ReactNode;
}

/**
 * The live preview: a toolbar (the preview's own light or dark, a reroll of the drawings' seeds)
 * over the shipped components, rendered by their own code inside a wrapper that carries the
 * chosen look, pen, screentone and fonts as CSS variables. A change restyles them in place:
 * colours and screentone by the cascade, outlines by the redraw event (throttled to animation
 * frames), so nothing remounts and nothing shifts.
 */
export function CreatePreview({
  config,
  mode,
  onModeChange,
  seed,
  onReroll,
  note,
  children,
}: CreatePreviewProps) {
  const surface = useRef<HTMLElement>(null);
  const pending = useRef<{ timer?: number; frame?: number }>({});
  const lastRedraw = useRef(0);

  // Before the site's mode is known, inherit the page's look rather than guess (no flash).
  const style = useMemo(
    () =>
      mode
        ? ({ ...previewVariables(config, mode, seed), colorScheme: mode } as CSSProperties)
        : undefined,
    [config, mode, seed],
  );

  // The pen and the seed reach the drawings only when they draw: ask them to, on an animation
  // frame and at most once per REDRAW_INTERVAL while a slider moves (a redraw of the specimen
  // costs about as much as the restyle itself), always once more after the last change. A
  // scheduled redraw reads the values current when it runs.
  const penKey = `${JSON.stringify(config.pen)} ${seed}`;
  useLayoutEffect(() => {
    void penKey;
    const queue = pending.current;
    if (queue.timer !== undefined || queue.frame !== undefined) return;
    const wait = Math.max(0, lastRedraw.current + REDRAW_INTERVAL - performance.now());
    queue.timer = window.setTimeout(() => {
      queue.timer = undefined;
      queue.frame = requestAnimationFrame(() => {
        queue.frame = undefined;
        lastRedraw.current = performance.now();
        surface.current?.dispatchEvent(new Event(INK_REDRAW_EVENT, { bubbles: true }));
      });
    }, wait);
  }, [penKey]);
  useLayoutEffect(
    () => () => {
      const queue = pending.current;
      window.clearTimeout(queue.timer);
      if (queue.frame !== undefined) cancelAnimationFrame(queue.frame);
      queue.timer = undefined;
      queue.frame = undefined;
    },
    [],
  );

  return (
    <section
      aria-labelledby="create-preview-title"
      data-slot="create-preview"
      className="grid min-w-0 content-start gap-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="create-preview-title" className="font-display text-lg tracking-wide">
          Preview
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <ToggleGroup
            aria-label="Preview mode"
            variant="outline"
            size="sm"
            spacing={0}
            value={mode ? [mode] : []}
            onValueChange={(value: unknown[]) => {
              const next = value[0] as Mode | undefined;
              if (next) onModeChange(next);
            }}
          >
            <ToggleGroupItem value="light">Light</ToggleGroupItem>
            <ToggleGroupItem value="dark">Dark</ToggleGroupItem>
          </ToggleGroup>
          <Button type="button" variant="outline" size="sm" onClick={onReroll}>
            <Dices aria-hidden />
            Reroll ink
          </Button>
        </div>
      </div>
      {note}
      {/* The frame is drawn in the site's own look, outside the chosen one. */}
      <InkFrame fill="none" className="min-w-0">
        <section
          ref={surface}
          aria-label="Preview of the chosen look"
          data-slot="create-preview-surface"
          data-mode={mode ?? undefined}
          style={style}
          className={cn(
            CREATE_FONT_CLASSES,
            mode === "dark" && "dark",
            "flex min-w-0 justify-center rounded-[inherit] bg-background p-4 text-foreground sm:p-6",
          )}
        >
          {children}
        </section>
      </InkFrame>
    </section>
  );
}
