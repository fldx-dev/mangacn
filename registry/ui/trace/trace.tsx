import { cn } from "cn";
import { ChevronRightIcon } from "lucide-react";
import type * as React from "react";
import { InkFrame } from "@/components/ink-frame";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

// Based on shadcn/ui Trace (MIT, https://ui.shadcn.com), base-nova style, fetched 2026-11-12.
// Restyled for mangacn: an agent's steps hang off one hand-drawn ink line down the side, and
// every TraceLine starts with a drawn dot on it: solid ink when done, pulsing while `running`
// (Tailwind's `animate-pulse`, still under reduced motion), spot on `error`, hollow paper when
// `pending`. Pending text stays muted at full opacity, and descriptions drop stock's 70 %
// opacity, so both pass contrast. An open step's details sit beside the line, not behind a
// border of their own.

function Trace({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="trace"
      className={cn(
        "relative isolate flex w-full min-w-0 flex-col gap-2 *:has-[>[data-slot=trace-line]]:flex *:has-[>[data-slot=trace-line]]:w-fit *:has-[>[data-slot=trace-line]]:max-w-full *:has-[>[data-slot=trace-line]]:min-w-0 *:has-[>[data-slot=trace-line]]:rounded-md *:has-[>[data-slot=trace-line]]:text-left *:has-[>[data-slot=trace-line]]:outline-none *:has-[>[data-slot=trace-line]]:focus-visible:ring-3 *:has-[>[data-slot=trace-line]]:focus-visible:ring-ring/50",
        className,
      )}
      {...props}
    >
      {/* The line down the side, through the centre of every step's dot (size-3). */}
      <InkFrame
        as="span"
        shape="line"
        fill="none"
        aria-hidden="true"
        className="pointer-events-none absolute top-2.5 bottom-2.5 left-[calc(--spacing(1.5)-var(--outline-width)/2)] -z-1 w-(--outline-width)"
      />
      {children}
    </div>
  );
}

function TraceLine({
  className,
  status,
  children,
  ...props
}: React.ComponentProps<"span"> & {
  status?: "running" | "error" | "pending";
}) {
  return (
    <span
      data-slot="trace-line"
      data-status={status}
      className={cn(
        "flex w-fit max-w-full min-w-0 items-center gap-2 text-sm text-muted-foreground transition-colors in-[a,button]:cursor-pointer in-[a:hover,button:hover]:text-foreground data-[status=error]:text-destructive data-[status=error]:in-[a:hover,button:hover]:text-destructive",
        className,
      )}
      {...props}
    >
      {/* The step's dot on the trace line: its own box, the drawing a layer over all of it. */}
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none relative isolate size-3 shrink-0",
          status === "running" && "motion-safe:animate-pulse",
          status === "error" && "[--ink:var(--spot)]",
        )}
      >
        <InkFrame
          as="span"
          shape="ellipse"
          fill={status === "pending" ? "paper" : "ink"}
          className="absolute inset-0 -z-1"
        />
      </span>
      {children}
    </span>
  );
}

function TraceIcon({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="trace-icon"
      aria-hidden="true"
      className={cn(
        "flex size-4 shrink-0 items-center justify-center [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [[data-slot=trace-title]~&]:-ml-1",
        className,
      )}
      {...props}
    />
  );
}

function TraceTitle({ className, ...props }: React.ComponentProps<"span">) {
  return <span data-slot="trace-title" className={cn("min-w-0 truncate", className)} {...props} />;
}

function TraceDescription({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="trace-description"
      className={cn("shrink-0 text-muted-foreground tabular-nums", className)}
      {...props}
    />
  );
}

function TraceCollapsible({
  className,
  ...props
}: Omit<React.ComponentProps<typeof Collapsible>, "open"> &
  (
    | { open?: undefined }
    | {
        open: boolean;
        onOpenChange: NonNullable<React.ComponentProps<typeof Collapsible>["onOpenChange"]>;
      }
  )) {
  return (
    <Collapsible
      data-slot="trace-collapsible"
      className={cn("flex w-full min-w-0 flex-col", className)}
      {...props}
    />
  );
}

function TraceCollapsibleTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof CollapsibleTrigger>) {
  return (
    <CollapsibleTrigger
      data-slot="trace-collapsible-trigger"
      className={cn(
        "group/trace-collapsible-trigger flex w-fit max-w-full min-w-0 cursor-pointer items-center gap-1 rounded-md text-left text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 has-[[data-status=error]]:text-destructive",
        className,
      )}
      {...props}
    >
      {children}
      <TraceIcon className="transition-transform group-aria-expanded/trace-collapsible-trigger:rotate-90">
        <ChevronRightIcon />
      </TraceIcon>
    </CollapsibleTrigger>
  );
}

function TraceCollapsibleContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof CollapsibleContent>) {
  return (
    <CollapsibleContent
      data-slot="trace-collapsible-content"
      className="h-(--collapsible-panel-height) min-w-0 overflow-hidden transition-[height] duration-200 data-ending-style:h-0 data-starting-style:h-0"
      {...props}
    >
      <div
        data-slot="trace-collapsible-content-inner"
        className={cn(
          "mt-2 mb-1 min-w-0 pr-1 pl-5 leading-relaxed wrap-break-word text-muted-foreground",
          className,
        )}
      >
        {children}
      </div>
    </CollapsibleContent>
  );
}

export {
  Trace,
  TraceCollapsible,
  TraceCollapsibleContent,
  TraceCollapsibleTrigger,
  TraceDescription,
  TraceIcon,
  TraceLine,
  TraceTitle,
};
