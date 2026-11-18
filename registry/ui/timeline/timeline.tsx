import { cn } from "cn";
import type * as React from "react";
import { InkFrame } from "@/components/ink-frame";

// mangacn's timeline (SPEC-components-7 §4.10): an ordered list of dated events on a hand-drawn
// line. Static and server-safe: status reaches the indicator through `data-status` and CSS, not
// context. `align="alternate"` puts items on both sides of the line from 768 px.

type TimelineAlign = "start" | "alternate";
type TimelineStatus = "done" | "current" | "upcoming";

export interface TimelineProps extends React.ComponentProps<"ol"> {
  /**
   * `start` keeps every item right of the line; `alternate` switches sides from 768 px and falls
   * back to `start` below.
   * @default "start"
   */
  align?: TimelineAlign;
}

export function Timeline({ align = "start", className, ...props }: TimelineProps) {
  return (
    <ol
      data-slot="timeline"
      data-align={align}
      className={cn("group/timeline flex min-w-0 flex-col", className)}
      {...props}
    />
  );
}

/** The words a timeline item says: the screen-reader text on the current item. */
export interface TimelineItemLabels {
  /** @default "current" */
  current?: string;
}

export interface TimelineItemProps extends React.ComponentProps<"li"> {
  /**
   * Done is ink-filled, current a heavy ring with a tone fill (and `aria-current`), upcoming paper.
   * @default "done"
   */
  status?: TimelineStatus;
  /** Overrides the screen-reader word on the current item. */
  labels?: TimelineItemLabels;
}

export function TimelineItem({
  status = "done",
  labels,
  className,
  children,
  ...props
}: TimelineItemProps) {
  const current = status === "current";
  return (
    <li
      data-slot="timeline-item"
      data-status={status}
      aria-current={current ? "true" : undefined}
      className={cn(
        "group/timeline-item grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-x-3 pb-6 last:pb-0",
        "md:group-data-[align=alternate]/timeline:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]",
        className,
      )}
      {...props}
    >
      {current ? <span className="sr-only">{labels?.current ?? "current"}</span> : null}
      {children}
    </li>
  );
}

export type TimelineIndicatorProps = React.ComponentProps<"span">;

/** The drawn dot and the line down to the next item; hidden from assistive tech. */
export function TimelineIndicator({ className, ...props }: TimelineIndicatorProps) {
  return (
    <span
      data-slot="timeline-indicator"
      aria-hidden="true"
      className={cn(
        "row-span-full flex flex-col items-center self-stretch pt-1",
        "md:group-data-[align=alternate]/timeline:col-start-2",
        className,
      )}
      {...props}
    >
      <InkFrame
        as="span"
        shape="ellipse"
        fill="paper"
        className={cn(
          "block size-3.5 shrink-0 rounded-full",
          "group-data-[status=done]/timeline-item:[--paper:var(--ink)]",
          "group-data-[status=current]/timeline-item:size-4 group-data-[status=current]/timeline-item:[--outline-width:var(--outline-width-heavy)] group-data-[status=current]/timeline-item:[--paper:var(--tone-2)]",
        )}
      />
      <InkFrame
        as="span"
        shape="line"
        fill="none"
        className="-mb-7 mt-1 block min-h-4 w-(--outline-width) flex-1 group-last/timeline-item:hidden"
      />
    </span>
  );
}

export type TimelineContentProps = React.ComponentProps<"div">;

export function TimelineContent({ className, ...props }: TimelineContentProps) {
  return (
    <div
      data-slot="timeline-content"
      className={cn(
        "flex min-w-0 flex-col gap-1",
        "md:group-data-[align=alternate]/timeline:col-start-3",
        "md:group-data-[align=alternate]/timeline:group-even/timeline-item:col-start-1 md:group-data-[align=alternate]/timeline:group-even/timeline-item:row-start-1 md:group-data-[align=alternate]/timeline:group-even/timeline-item:items-end md:group-data-[align=alternate]/timeline:group-even/timeline-item:text-right",
        className,
      )}
      {...props}
    />
  );
}

export type TimelineTitleProps = React.ComponentProps<"div">;

export function TimelineTitle({ className, ...props }: TimelineTitleProps) {
  return (
    <div
      data-slot="timeline-title"
      className={cn("text-sm leading-snug font-semibold", className)}
      {...props}
    />
  );
}

export interface TimelineTimeProps extends React.ComponentProps<"time"> {
  /** The machine-readable date or time, as `<time dateTime>` takes it ("2026-11-18"). */
  dateTime: string;
}

export function TimelineTime({ className, ...props }: TimelineTimeProps) {
  return (
    <time
      data-slot="timeline-time"
      className={cn("text-xs text-muted-foreground tabular-nums", className)}
      {...props}
    />
  );
}

export type TimelineDescriptionProps = React.ComponentProps<"p">;

export function TimelineDescription({ className, ...props }: TimelineDescriptionProps) {
  return (
    <p
      data-slot="timeline-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}
