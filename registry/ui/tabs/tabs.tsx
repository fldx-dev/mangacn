"use client";

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import { InkFrame } from "@/components/ink-frame";

// Based on shadcn/ui Tabs (MIT, https://ui.shadcn.com), base-nova style, fetched 2026-10-31.
// Restyled for mangacn. Default: the pill becomes a hand-drawn rule under the list, and the
// active tab is outlined on three sides (its frame is clipped at the rule, and its paper fill
// breaks the rule beneath it). Line: the active underline is a hand-drawn stroke.

function Tabs({ className, orientation = "horizontal", ...props }: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn("group/tabs flex gap-2 data-horizontal:flex-col", className)}
      {...props}
    />
  );
}

const tabsListVariants = cva(
  "group/tabs-list inline-flex w-fit items-center justify-center rounded-lg p-[3px] text-muted-foreground group-data-horizontal/tabs:h-8 group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col data-[variant=line]:rounded-none",
  {
    variants: {
      variant: {
        default:
          "relative isolate bg-transparent group-data-horizontal/tabs:items-end group-data-horizontal/tabs:pb-0 group-data-vertical/tabs:pr-0",
        line: "gap-1 bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function TabsList({
  className,
  variant = "default",
  children,
  ...props
}: TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    >
      {variant === "default" && (
        <InkFrame
          as="span"
          shape="line"
          fill="none"
          className="pointer-events-none absolute group-data-horizontal/tabs:inset-x-0 group-data-horizontal/tabs:bottom-0 group-data-horizontal/tabs:h-(--outline-width) group-data-vertical/tabs:inset-y-0 group-data-vertical/tabs:right-0 group-data-vertical/tabs:w-(--outline-width)"
        />
      )}
      {children}
    </TabsPrimitive.List>
  );
}

function TabsTrigger({ className, children, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        "group/tabs-trigger relative isolate inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border-0 px-1.5 py-0.5 text-sm font-medium whitespace-nowrap text-foreground/60 transition-all group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-100 disabled:halftone-light has-data-[icon=inline-end]:pr-1 has-data-[icon=inline-start]:pl-1 has-[>[data-inked=true]]:bg-transparent! aria-disabled:pointer-events-none aria-disabled:opacity-100 aria-disabled:halftone-light dark:text-muted-foreground dark:hover:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:data-active:bg-transparent dark:group-data-[variant=line]/tabs-list:data-active:bg-transparent",
        "data-active:bg-background data-active:text-foreground dark:data-active:text-foreground",
        className,
      )}
      {...props}
    >
      {/* Default: the active tab, outlined on three sides. */}
      <InkFrame
        as="span"
        fill="paper"
        className="pointer-events-none absolute inset-0 -z-1 hidden group-data-[variant=default]/tabs-list:group-data-active/tabs-trigger:block group-data-horizontal/tabs:-bottom-3 group-data-horizontal/tabs:[clip-path:inset(calc(var(--spacing)*-3)_calc(var(--spacing)*-3)_calc(var(--spacing)*3_-_var(--outline-width))_calc(var(--spacing)*-3))] group-data-vertical/tabs:-right-3 group-data-vertical/tabs:[clip-path:inset(calc(var(--spacing)*-3)_calc(var(--spacing)*3_-_var(--outline-width))_calc(var(--spacing)*-3)_calc(var(--spacing)*-3))]"
      />
      {/* Line: the active underline, where stock draws an `::after` bar. */}
      <InkFrame
        as="span"
        shape="line"
        fill="none"
        className="pointer-events-none absolute hidden [--outline-width:var(--outline-width-heavy)] group-data-[variant=line]/tabs-list:group-data-active/tabs-trigger:block group-data-horizontal/tabs:inset-x-0 group-data-horizontal/tabs:bottom-[-5px] group-data-horizontal/tabs:h-0.5 group-data-vertical/tabs:inset-y-0 group-data-vertical/tabs:-right-1 group-data-vertical/tabs:w-0.5"
      />
      {children}
    </TabsPrimitive.Tab>
  );
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn("flex-1 text-sm outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsContent, TabsList, TabsTrigger, tabsListVariants };
