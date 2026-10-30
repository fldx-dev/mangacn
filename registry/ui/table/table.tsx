"use client";

import { cn } from "cn";
import type * as React from "react";
import { InkFrame } from "@/components/ink-frame";

// Based on shadcn/ui Table (MIT, https://ui.shadcn.com), base-nova style, fetched 2026-10-31.
// Restyled for mangacn: rows have no CSS borders. A <tr> cannot hold the drawing, so every
// cell inks its own segment of the row rule (`RowRule`); the segments meet at the cell edges.
// The header rule is heavy, the last body row has none, and footer cells rule above themselves.

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

function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div data-slot="table-container" className="relative w-full overflow-x-auto">
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
