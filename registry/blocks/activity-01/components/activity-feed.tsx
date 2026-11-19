"use client";

import * as React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Timeline,
  TimelineContent,
  TimelineIndicator,
  TimelineItem,
  TimelineTime,
  TimelineTitle,
} from "@/components/ui/timeline";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  ACTIVITY_FILTERS,
  ACTIVITY_KIND_LABELS,
  type ActivityEvent,
  type ActivityKind,
} from "./activity-data";

// A fixed locale and no time zone in the data: the same markup on the server and the client, on
// any day. Times are never relative to now.
const timeFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});
const dayFormat = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
});

/** "Oct 12, 2026, 21:40" for "2026-10-12T21:40". */
export function formatActivityTime(at: string): string {
  return timeFormat.format(new Date(at));
}

/** "Monday, October 12, 2026" for "2026-10-12". */
export function formatActivityDay(day: string): string {
  return dayFormat.format(new Date(`${day}T00:00`));
}

/** "AI" for "Aiko", "RK" for "Ren Kuroda". */
export function initials(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  const letters = words.length > 1 ? words[0][0] + words[words.length - 1][0] : name.slice(0, 2);
  return letters.toUpperCase();
}

/** Events in their order, under their day ("2026-10-12"), days in first-seen order. */
export function groupByDay(events: ActivityEvent[]): { day: string; events: ActivityEvent[] }[] {
  const days = new Map<string, ActivityEvent[]>();
  for (const event of events) {
    const day = event.at.slice(0, 10);
    days.set(day, [...(days.get(day) ?? []), event]);
  }
  return [...days].map(([day, dayEvents]) => ({ day, events: dayEvents }));
}

export interface ActivityFeedProps {
  /** Every event, newest first. */
  events: ActivityEvent[];
  /**
   * How many events show at first, and how many more each "Show more" reveals.
   * @default 10
   */
  pageSize?: number;
}

/**
 * The filter, the count it announces and the timeline of events under day headings. "Show more"
 * appends the next page and moves focus to the first new event's heading.
 */
export function ActivityFeed({ events, pageSize = 10 }: ActivityFeedProps) {
  const id = React.useId();
  const [filter, setFilter] = React.useState<ActivityKind | "all">("all");
  const [shown, setShown] = React.useState(pageSize);
  const focusNext = React.useRef<string | null>(null);

  const filtered = filter === "all" ? events : events.filter((event) => event.kind === filter);
  const visible = filtered.slice(0, shown);
  const headingId = (event: ActivityEvent) => `${id}-${event.id}`;

  React.useEffect(() => {
    if (!focusNext.current) return;
    document.getElementById(focusNext.current)?.focus();
    focusNext.current = null;
  });

  return (
    <section aria-labelledby={`${id}-title`} className="flex min-w-0 flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <h2 id={`${id}-title`} className="font-display text-xl">
          Recent activity
        </h2>
        <ToggleGroup
          aria-label="Show"
          variant="outline"
          spacing={0}
          className="flex-wrap"
          value={[filter]}
          onValueChange={(value: string[]) => {
            // One choice at a time: pressing the pressed button again keeps it.
            const next = value[0] as ActivityKind | "all" | undefined;
            if (!next) return;
            setFilter(next);
            setShown(pageSize);
          }}
        >
          {ACTIVITY_FILTERS.map((option) => (
            <ToggleGroupItem key={option.value} value={option.value}>
              {option.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      <p role="status" className="text-sm text-muted-foreground">
        {`${filtered.length} ${filtered.length === 1 ? "event" : "events"}`}
      </p>
      <Separator />
      <div className="flex w-full max-w-2xl flex-col gap-8">
        {groupByDay(visible).map(({ day, events: dayEvents }) => (
          <div key={day} className="flex flex-col gap-4">
            <h3 className="font-display text-base">{formatActivityDay(day)}</h3>
            <Timeline align="start">
              {dayEvents.map((event) => (
                <TimelineItem key={event.id}>
                  <TimelineIndicator />
                  <TimelineContent className="flex-row items-start gap-3">
                    <Avatar>
                      <AvatarFallback>{initials(event.actor)}</AvatarFallback>
                    </Avatar>
                    <div className="flex min-w-0 flex-col gap-1">
                      <TimelineTitle>
                        <h4
                          id={headingId(event)}
                          tabIndex={-1}
                          className="rounded-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        >
                          {event.actor} {event.action}
                          {event.title ? (
                            <>
                              {" "}
                              <em>{event.title}</em>
                            </>
                          ) : null}
                        </h4>
                      </TimelineTitle>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{ACTIVITY_KIND_LABELS[event.kind]}</Badge>
                        <TimelineTime dateTime={event.at}>
                          {formatActivityTime(event.at)}
                        </TimelineTime>
                      </div>
                    </div>
                  </TimelineContent>
                </TimelineItem>
              ))}
            </Timeline>
          </div>
        ))}
      </div>
      {filtered.length > shown ? (
        <Button
          variant="outline"
          className="self-start"
          onClick={() => {
            focusNext.current = headingId(filtered[shown]);
            setShown(shown + pageSize);
          }}
        >
          Show more
        </Button>
      ) : null}
    </section>
  );
}
