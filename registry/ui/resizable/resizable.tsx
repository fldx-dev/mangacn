"use client";

import { cn } from "cn";
import * as React from "react";
import * as ResizablePrimitive from "react-resizable-panels";
import { InkFrame } from "@/components/ink-frame";

// Based on shadcn/ui Resizable (MIT, https://ui.shadcn.com), base-nova style, fetched 2026-11-12.
// Restyled for mangacn: the handle is separator's hand-drawn rule, traced again at the heavy
// width while the library marks it hovered, focused or dragged (`data-separator`); `withHandle`
// adds a small outlined paper tab with three ink dots. The group and panels are stock.

/** FNV-1a over `useId()`: the rule's two strokes share it, so the heavy one lands on the light. */
function useRuleSeed(): number {
  const id = React.useId();
  let hash = 0x811c9dc5;
  for (let i = 0; i < id.length; i++) {
    hash ^= id.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  // rough.js treats 0 as "random".
  return (hash >>> 0) % 2147483646 || 1;
}

function ResizablePanelGroup({ className, ...props }: ResizablePrimitive.GroupProps) {
  return (
    <ResizablePrimitive.Group
      data-slot="resizable-panel-group"
      className={cn("flex h-full w-full aria-[orientation=vertical]:flex-col", className)}
      {...props}
    />
  );
}

function ResizablePanel({ ...props }: ResizablePrimitive.PanelProps) {
  return <ResizablePrimitive.Panel data-slot="resizable-panel" {...props} />;
}

function ResizableHandle({
  withHandle,
  className,
  ...props
}: ResizablePrimitive.SeparatorProps & {
  withHandle?: boolean;
}) {
  const seed = useRuleSeed();
  return (
    <ResizablePrimitive.Separator
      data-slot="resizable-handle"
      className={cn(
        "group/handle relative isolate flex w-(--outline-width) items-center justify-center bg-border ring-offset-background has-[>[data-inked=true]]:bg-transparent! after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-hidden aria-[orientation=horizontal]:h-(--outline-width) aria-[orientation=horizontal]:w-full aria-[orientation=horizontal]:after:left-0 aria-[orientation=horizontal]:after:h-1 aria-[orientation=horizontal]:after:w-full aria-[orientation=horizontal]:after:translate-x-0 aria-[orientation=horizontal]:after:-translate-y-1/2 [&[aria-orientation=horizontal]>div]:rotate-90",
        className,
      )}
      {...props}
    >
      <InkFrame
        as="span"
        shape="line"
        fill="none"
        seed={seed}
        className="pointer-events-none absolute inset-0 -z-1"
      />
      {/* The same rule at the heavy width, shown while hovered, focused or dragged. */}
      <InkFrame
        as="span"
        shape="line"
        fill="none"
        seed={seed}
        className="pointer-events-none absolute inset-0 -z-1 hidden [--outline-width:var(--outline-width-heavy)] group-data-[separator=active]/handle:block group-data-[separator=focus]/handle:block group-data-[separator=hover]/handle:block"
      />
      {withHandle && (
        <InkFrame
          fill="paper"
          className="z-10 flex h-6 w-3 shrink-0 flex-col items-center justify-center gap-0.5 rounded-sm"
        >
          <span className="size-0.75 rounded-full bg-ink" />
          <span className="size-0.75 rounded-full bg-ink" />
          <span className="size-0.75 rounded-full bg-ink" />
        </InkFrame>
      )}
    </ResizablePrimitive.Separator>
  );
}

export { ResizableHandle, ResizablePanel, ResizablePanelGroup };
