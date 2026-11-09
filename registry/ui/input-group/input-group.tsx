"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import type * as React from "react";
import { InkFrame } from "@/components/ink-frame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// Based on shadcn/ui InputGroup (MIT, https://ui.shadcn.com), base-nova style, fetched 2026-11-09.
// Restyled for mangacn: the group draws the one outline (an InkFrame, its first child) and each
// addon a hand-drawn rule on the side facing the control. The group sets `data-grouped`, which
// mangacn's input, textarea and button read to draw no frame of their own. Their InkFrame wraps
// the <input> and <textarea>, so stock's `>input` and `>textarea` selectors look one level down.

function InputGroup({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: stock's <div role="group">, kept rather than retagged.
    <div
      data-slot="input-group"
      data-grouped=""
      role="group"
      className={cn(
        "group/input-group relative isolate flex h-8 w-full min-w-0 items-center rounded-lg border-0 transition-colors outline-none in-data-[slot=combobox-content]:focus-within:border-inherit in-data-[slot=combobox-content]:focus-within:ring-0 has-disabled:halftone-light has-disabled:text-muted-foreground has-[[data-slot=input-group-control]:focus-visible]:ring-3 has-[[data-slot=input-group-control]:focus-visible]:ring-ring/50 has-[[data-slot][aria-invalid=true]]:ring-3 has-[[data-slot][aria-invalid=true]]:ring-destructive/20 has-[[data-slot][aria-invalid=true]]:[--ink:var(--destructive)] has-[>[data-align=block-end]]:h-auto has-[>[data-align=block-end]]:flex-col has-[>[data-align=block-start]]:h-auto has-[>[data-align=block-start]]:flex-col has-[>[data-slot=ink-frame]>textarea]:h-auto [&>[data-slot=ink-frame]:has(>[data-slot=input-group-control])]:flex-1 dark:has-[[data-slot][aria-invalid=true]]:ring-destructive/40 has-[>[data-align=block-end]]:[&>[data-slot=ink-frame]>input]:pt-3 has-[>[data-align=block-start]]:[&>[data-slot=ink-frame]>input]:pb-3 has-[>[data-align=inline-end]]:[&>[data-slot=ink-frame]>input]:pr-1.5 has-[>[data-align=inline-start]]:[&>[data-slot=ink-frame]>input]:pl-1.5",
        className,
      )}
      {...props}
    >
      {/* The group's one outline; a disabled group shows its halftone through the paper. */}
      <InkFrame
        as="span"
        fill="paper"
        className="pointer-events-none absolute inset-0 -z-1 rounded-lg group-has-disabled/input-group:[--paper:transparent]"
      />
      {children}
    </div>
  );
}

const inputGroupAddonVariants = cva(
  "relative flex h-auto cursor-text items-center justify-center gap-2 py-1.5 text-sm font-medium text-muted-foreground select-none group-data-[disabled=true]/input-group:opacity-50 [&>kbd]:rounded-[calc(var(--radius)-5px)] [&>svg:not([class*='size-'])]:size-4",
  {
    variants: {
      align: {
        "inline-start":
          "order-first self-stretch pr-2 pl-2 has-[>button]:ml-[-0.3rem] has-[>kbd]:ml-[-0.15rem]",
        "inline-end":
          "order-last self-stretch pr-2 pl-2 has-[>button]:mr-[-0.3rem] has-[>kbd]:mr-[-0.15rem]",
        "block-start":
          "order-first w-full justify-start px-2.5 pt-2 pb-2 group-has-[>[data-slot=ink-frame]>input]/input-group:pt-2",
        "block-end":
          "order-last w-full justify-start px-2.5 pt-2 pb-2 group-has-[>[data-slot=ink-frame]>input]/input-group:pb-2",
      },
    },
    defaultVariants: {
      align: "inline-start",
    },
  },
);

/** Where each addon draws its rule: on the side that faces the control. */
const addonRules: Record<
  NonNullable<VariantProps<typeof inputGroupAddonVariants>["align"]>,
  string
> = {
  "inline-start": "inset-y-0 right-0 w-(--outline-width)",
  "inline-end": "inset-y-0 left-0 w-(--outline-width)",
  "block-start": "inset-x-0 bottom-0 h-(--outline-width)",
  "block-end": "inset-x-0 top-0 h-(--outline-width)",
};

function InputGroupAddon({
  className,
  align = "inline-start",
  children,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof inputGroupAddonVariants>) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: stock's <div role="group">, kept rather than retagged.
    // biome-ignore lint/a11y/useKeyWithClickEvents: stock's click-to-focus; the input takes keyboard focus itself.
    <div
      role="group"
      data-slot="input-group-addon"
      data-align={align}
      className={cn(inputGroupAddonVariants({ align }), className)}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("button")) {
          return;
        }
        e.currentTarget.parentElement?.querySelector("input")?.focus();
      }}
      {...props}
    >
      <InkFrame
        as="span"
        shape="line"
        fill="none"
        className={cn("pointer-events-none absolute", addonRules[align ?? "inline-start"])}
      />
      {children}
    </div>
  );
}

const inputGroupButtonVariants = cva("flex items-center gap-2 text-sm shadow-none", {
  variants: {
    size: {
      xs: "h-6 gap-1 rounded-[calc(var(--radius)-3px)] px-1.5 [&>svg:not([class*='size-'])]:size-3.5",
      sm: "",
      "icon-xs": "size-6 rounded-[calc(var(--radius)-3px)] p-0 has-[>svg]:p-0",
      "icon-sm": "size-8 p-0 has-[>svg]:p-0",
    },
  },
  defaultVariants: {
    size: "xs",
  },
});

function InputGroupButton({
  className,
  type = "button",
  variant = "ghost",
  size = "xs",
  ...props
}: Omit<React.ComponentProps<typeof Button>, "size" | "type"> &
  VariantProps<typeof inputGroupButtonVariants> & {
    type?: "button" | "submit" | "reset";
  }) {
  return (
    <Button
      type={type}
      data-size={size}
      variant={variant}
      className={cn(inputGroupButtonVariants({ size }), className)}
      {...props}
    />
  );
}

function InputGroupText({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "flex items-center gap-2 text-sm text-muted-foreground [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  );
}

function InputGroupInput({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <Input
      data-slot="input-group-control"
      className={cn(
        "flex-1 rounded-none border-0 bg-transparent shadow-none ring-0 focus-visible:ring-0 disabled:bg-transparent disabled:bg-none aria-invalid:ring-0 dark:bg-transparent dark:disabled:bg-transparent",
        className,
      )}
      {...props}
    />
  );
}

function InputGroupTextarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <Textarea
      data-slot="input-group-control"
      className={cn(
        "flex-1 resize-none rounded-none border-0 bg-transparent py-2 shadow-none ring-0 focus-visible:ring-0 disabled:bg-transparent disabled:bg-none aria-invalid:ring-0 dark:bg-transparent dark:disabled:bg-transparent",
        className,
      )}
      {...props}
    />
  );
}

export {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
};
