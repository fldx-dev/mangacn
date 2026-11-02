"use client";

import { cn } from "cn";
import type * as React from "react";
import { InkFrame } from "@/components/ink-frame";

// Based on shadcn/ui Table (MIT, https://ui.shadcn.com), base-nova style, fetched 2026-10-31.
// Restyled for mangacn: rows have no CSS borders. A <tr> cannot hold the drawing, so every
// cell inks its own segment of the row rule (`RowRule`); the segments meet at the cell edges.
// The header rule is heavy, the last body row has none, and footer cells rule above themselves.
// At the table's edges the rule stops flush and clips its drawing (which reaches 8 px past its
// box), or the overhang would make the container scroll a table that fits.

/** One hand-drawn segment of a row rule along the bottom of its cell, overlapping its neighbours. */
function RowRule() {
  return (
    <InkFrame
      as="span"
      shape="line"
      fill="none"
      className="pointer-events-none absolute -inset-x-(--outline-width) bottom-0 h-(--outline-width)"
    />
  );
}

// Unlike stock, the scroll container is a named region in the tab order, so a keyboard user can
// scroll a table wider than its container (axe `scrollable-region-focusable`).
function Table({
  className,
  label = "Table",
  ...props
}: React.ComponentProps<"table"> & {
  /**
   * Accessible name of the scroll region around the table, read when it takes focus. Give
   * each table on a page its own, as for any landmark.
   * @default "Table"
   */
  label?: string;
}) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: stock's <div>, named as a region rather than retagged.
    <div
      data-slot="table-container"
      role="region"
      aria-label={label}
      // biome-ignore lint/a11y/noNoninteractiveTabindex: a scroll container must take focus to scroll by keyboard.
      tabIndex={0}
      className="relative w-full overflow-x-auto outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  );
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn(
        "[&>tr>*>[data-slot=ink-frame]]:[--outline-width:var(--outline-width-heavy)]",
        className,
      )}
      {...props}
    />
  );
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&>tr:last-child>*>[data-slot=ink-frame]]:hidden", className)}
      {...props}
    />
  );
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "bg-muted/50 font-medium [&>tr>*>[data-slot=ink-frame]]:top-0 [&>tr>*>[data-slot=ink-frame]]:bottom-auto",
        className,
      )}
      {...props}
    />
  );
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "transition-colors hover:bg-muted/50 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted",
        "[&>:first-child>[data-slot=ink-frame]]:start-0 [&>:last-child>[data-slot=ink-frame]]:end-0 [&>:is(:first-child,:last-child)>[data-slot=ink-frame]]:overflow-x-clip",
        className,
      )}
      {...props}
    />
  );
}

function TableHead({ className, children, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "relative h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-foreground [&:has([role=checkbox])]:pr-0",
        className,
      )}
      {...props}
    >
      <RowRule />
      {children}
    </th>
  );
}

function TableCell({ className, children, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "relative p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0",
        className,
      )}
      {...props}
    >
      <RowRule />
      {children}
    </td>
  );
}

function TableCaption({ className, ...props }: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow };
