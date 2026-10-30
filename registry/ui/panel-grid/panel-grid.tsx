import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import type * as React from "react";

type Columns = 1 | 2 | 3 | 4;
type Breakpoint = "base" | "sm" | "md" | "lg";

/** Full class names, so Tailwind sees every one of them in this file. */
const COLUMN_CLASSES: Record<Breakpoint, Record<Columns, string>> = {
  base: { 1: "grid-cols-1", 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4" },
  sm: { 1: "sm:grid-cols-1", 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-4" },
  md: { 1: "md:grid-cols-1", 2: "md:grid-cols-2", 3: "md:grid-cols-3", 4: "md:grid-cols-4" },
  lg: { 1: "lg:grid-cols-1", 2: "lg:grid-cols-2", 3: "lg:grid-cols-3", 4: "lg:grid-cols-4" },
};

/** A number means one column on phones and that many from `sm` up. */
function columnClasses(columns: Columns | Partial<Record<Breakpoint, Columns>>): string {
  const byBreakpoint = typeof columns === "number" ? { base: 1 as const, sm: columns } : columns;
  return cn(
    COLUMN_CLASSES.base[byBreakpoint.base ?? 1],
    (["sm", "md", "lg"] as const).map((bp) => {
      const count = byBreakpoint[bp];
      return count && COLUMN_CLASSES[bp][count];
    }),
  );
}

// Gutters are paper: each panel draws its own ink frame, so the page shows between them.
const panelGridVariants = cva("grid w-full min-w-0 sm:grid-flow-dense", {
  variants: {
    gutter: {
      sm: "gap-2",
      md: "gap-4",
      lg: "gap-6",
    },
  },
  defaultVariants: { gutter: "md" },
});

export interface PanelGridProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof panelGridVariants> {
  /** 1–4, or per breakpoint: `{ base: 1, sm: 2, lg: 3 }`. */
  columns?: Columns | Partial<Record<Breakpoint, Columns>>;
}

/** A manga page: panels laid out on a grid, one column on phones. */
export function PanelGrid({ className, columns = 2, gutter, ...props }: PanelGridProps) {
  return (
    <div
      data-slot="panel-grid"
      data-gutter={gutter ?? "md"}
      className={cn(panelGridVariants({ gutter }), columnClasses(columns), className)}
      {...props}
    />
  );
}

// Spans start at `sm`: below it the grid has a single column.
const panelGridItemVariants = cva("grid min-w-0", {
  variants: {
    colSpan: {
      1: "",
      2: "sm:col-span-2",
      3: "sm:col-span-3",
      4: "sm:col-span-4",
      full: "col-span-full",
    },
    rowSpan: {
      1: "",
      2: "sm:row-span-2",
      3: "sm:row-span-3",
    },
  },
  defaultVariants: { colSpan: 1, rowSpan: 1 },
});

export interface PanelGridItemProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof panelGridItemVariants> {}

/** One cell of a `PanelGrid`; its child (usually a `Panel`) stretches to fill the cell. */
export function PanelGridItem({ className, colSpan, rowSpan, ...props }: PanelGridItemProps) {
  return (
    <div
      data-slot="panel-grid-item"
      data-col-span={colSpan ?? 1}
      data-row-span={rowSpan ?? 1}
      className={cn(panelGridItemVariants({ colSpan, rowSpan }), className)}
      {...props}
    />
  );
}
