"use client";

import { Toggle as TogglePrimitive } from "@base-ui/react/toggle";
import { ToggleGroup as ToggleGroupPrimitive } from "@base-ui/react/toggle-group";
import type { VariantProps } from "class-variance-authority";
import { cn } from "cn";
import * as React from "react";
import { InkFrame } from "@/components/ink-frame";
import { toggleVariants } from "@/components/ui/toggle";

// Based on shadcn/ui ToggleGroup (MIT, https://ui.shadcn.com), base-nova style, fetched
// 2026-11-03. Restyled for mangacn: one InkFrame outlines the whole group (paper for
// `outline`), and a hand-drawn rule stands between items, in the middle of the gap. Items draw
// no outline of their own, only the ink fill while pressed. The frame is the root's first
// child, so stock's `first:` item selectors count from the frame (`[[data-slot=ink-frame]+&]`).

/** One wobble for every group's rules and pressed fills. */
const TOGGLE_GROUP_SEED = 23;

const ToggleGroupContext = React.createContext<
  VariantProps<typeof toggleVariants> & {
    spacing?: number;
    orientation?: "horizontal" | "vertical";
  }
>({
  size: "default",
  variant: "default",
  spacing: 2,
  orientation: "horizontal",
});

function ToggleGroup({
  className,
  variant,
  size,
  spacing = 2,
  orientation = "horizontal",
  children,
  ...props
}: ToggleGroupPrimitive.Props &
  VariantProps<typeof toggleVariants> & {
    spacing?: number;
    orientation?: "horizontal" | "vertical";
  }) {
  return (
    <ToggleGroupPrimitive
      data-slot="toggle-group"
      data-variant={variant}
      data-size={size}
      data-spacing={spacing}
      data-orientation={orientation}
      style={{ "--gap": spacing } as React.CSSProperties}
      className={cn(
        "group/toggle-group relative isolate flex w-fit flex-row items-center gap-[--spacing(var(--gap))] rounded-lg p-0.5 data-[size=sm]:rounded-[min(var(--radius-md),10px)] data-[variant=outline]:bg-background data-[variant=outline]:has-[>[data-inked=true]]:bg-transparent! data-vertical:flex-col data-vertical:items-stretch",
        className,
      )}
      {...props}
    >
      <InkFrame
        as="span"
        fill={variant === "outline" && !props.disabled ? "paper" : "none"}
        className="pointer-events-none absolute inset-0 -z-1"
      />
      <ToggleGroupContext.Provider value={{ variant, size, spacing, orientation }}>
        {children}
      </ToggleGroupContext.Provider>
    </ToggleGroupPrimitive>
  );
}

function ToggleGroupItem({
  className,
  children,
  variant = "default",
  size = "default",
  ...props
}: TogglePrimitive.Props & VariantProps<typeof toggleVariants>) {
  const context = React.useContext(ToggleGroupContext);

  return (
    <TogglePrimitive
      data-slot="toggle-group-item"
      data-variant={context.variant || variant}
      data-size={context.size || size}
      data-spacing={context.spacing}
      className={cn(
        "shrink-0 group-data-[spacing=0]/toggle-group:rounded-none group-data-[spacing=0]/toggle-group:px-2 focus:z-10 focus-visible:z-10 group-data-[spacing=0]/toggle-group:has-data-[icon=inline-end]:pr-1.5 group-data-[spacing=0]/toggle-group:has-data-[icon=inline-start]:pl-1.5 group-data-horizontal/toggle-group:data-[spacing=0]:[[data-slot=ink-frame]+&]:rounded-l-lg group-data-vertical/toggle-group:data-[spacing=0]:[[data-slot=ink-frame]+&]:rounded-t-lg group-data-horizontal/toggle-group:data-[spacing=0]:last:rounded-r-lg group-data-vertical/toggle-group:data-[spacing=0]:last:rounded-b-lg",
        toggleVariants({
          variant: context.variant || variant,
          size: context.size || size,
        }),
        // The group draws the outline: an outline item keeps no paper of its own.
        "bg-transparent",
        className,
      )}
      {...props}
    >
      {/* The pressed fill, drawn only while pressed. */}
      <InkFrame
        as="span"
        fill="ink"
        seed={TOGGLE_GROUP_SEED}
        className="pointer-events-none absolute inset-0 -z-1 hidden group-aria-pressed/toggle:block"
      />
      {/* The rule after this item, in the middle of the gap; the last item has none. */}
      <InkFrame
        as="span"
        shape="line"
        fill="none"
        seed={TOGGLE_GROUP_SEED + 1}
        className="pointer-events-none absolute -z-1 group-last/toggle:hidden group-data-horizontal/toggle-group:inset-y-0 group-data-horizontal/toggle-group:-right-[calc(var(--spacing)*var(--gap)/2)] group-data-horizontal/toggle-group:w-(--outline-width) group-data-horizontal/toggle-group:translate-x-1/2 group-data-vertical/toggle-group:inset-x-0 group-data-vertical/toggle-group:-bottom-[calc(var(--spacing)*var(--gap)/2)] group-data-vertical/toggle-group:h-(--outline-width) group-data-vertical/toggle-group:translate-y-1/2"
      />
      {children}
    </TogglePrimitive>
  );
}

export { ToggleGroup, ToggleGroupItem };
