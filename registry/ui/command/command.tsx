"use client";

import { Command as CommandPrimitive } from "cmdk";
import { cn } from "cn";
import { CheckIcon, SearchIcon } from "lucide-react";
import type * as React from "react";
import { InkFrame } from "@/components/ink-frame";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InputGroup, InputGroupAddon } from "@/components/ui/input-group";

// Based on shadcn/ui Command (MIT, https://ui.shadcn.com), base-nova style, fetched 2026-11-12.
// Restyled for mangacn through cmdk's own attributes, never by wrapping its parts: the palette is
// dialog's heavy-outlined paper (an InkFrame on the root; in a dialog, the dialog's frame is the
// one outline); the search row draws no outline of its own, only a hand-drawn rule under it;
// group headings are set in the display face; the selected row (`[data-selected=true]`) is ink
// with paper text; shortcuts are kbd's paper key caps; separators are hand-drawn rules.

function Command({ className, children, ...props }: React.ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      data-slot="command"
      className={cn(
        "relative isolate flex size-full flex-col rounded-xl! bg-popover p-1 text-popover-foreground has-[>[data-inked=true]]:bg-transparent! in-data-[slot=dialog-content]:bg-transparent",
        className,
      )}
      {...props}
    >
      {/* The palette's heavy outline; inside a dialog the dialog draws it. */}
      <InkFrame
        as="span"
        className="pointer-events-none absolute inset-0 -z-1 rounded-xl [--outline-width:var(--outline-width-heavy)] in-data-[slot=dialog-content]:hidden"
      />
      {children}
    </CommandPrimitive>
  );
}

function CommandDialog({
  title = "Command Palette",
  description = "Search for a command to run...",
  children,
  className,
  showCloseButton = false,
  ...props
}: Omit<React.ComponentProps<typeof Dialog>, "children"> & {
  title?: string;
  description?: string;
  className?: string;
  showCloseButton?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Dialog {...props}>
      <DialogHeader className="sr-only">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <DialogContent
        // No overflow clip: the dialog's frame reaches past its box.
        className={cn("top-1/3 translate-y-0 rounded-xl! p-0", className)}
        showCloseButton={showCloseButton}
      >
        {children}
      </DialogContent>
    </Dialog>
  );
}

function CommandInput({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div data-slot="command-input-wrapper" className="relative p-1 pb-1.5">
      {/* The search row has no outline of its own (the group's frame and the addon's rule stay
          hidden), only this hand-drawn rule under it, across the palette. */}
      <InputGroup className="h-8! rounded-lg! bg-transparent shadow-none! *:data-[slot=input-group-addon]:pl-2! [&_[data-slot=ink-frame]]:hidden">
        <CommandPrimitive.Input
          data-slot="command-input"
          className={cn(
            "w-full bg-transparent text-sm outline-hidden disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
          {...props}
        />
        <InputGroupAddon>
          <SearchIcon className="size-4 shrink-0 opacity-50" />
        </InputGroupAddon>
      </InputGroup>
      <InkFrame
        as="span"
        shape="line"
        fill="none"
        className="pointer-events-none absolute -inset-x-1 bottom-0 h-(--outline-width)"
      />
    </div>
  );
}

function CommandList({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      data-slot="command-list"
      className={cn(
        "no-scrollbar max-h-72 scroll-py-1 overflow-x-hidden overflow-y-auto outline-none",
        className,
      )}
      {...props}
    />
  );
}

function CommandEmpty({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty
      data-slot="command-empty"
      className={cn("py-6 text-center text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

function CommandGroup({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={cn(
        "overflow-hidden p-1 text-foreground **:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:py-1.5 **:[[cmdk-group-heading]]:font-display **:[[cmdk-group-heading]]:text-sm **:[[cmdk-group-heading]]:tracking-wide **:[[cmdk-group-heading]]:text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

function CommandSeparator({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Separator>) {
  return (
    <CommandPrimitive.Separator
      data-slot="command-separator"
      // cmdk renders the rule as role="separator" inside the listbox, where a listbox may only
      // own options and groups; the rule only parts the groups, so it is hidden from the tree.
      aria-hidden="true"
      className={cn(
        "pointer-events-none relative isolate -mx-1 h-(--outline-width) bg-border has-[>[data-inked=true]]:bg-transparent!",
        className,
      )}
      {...props}
    >
      <InkFrame
        as="span"
        shape="line"
        fill="none"
        className="pointer-events-none absolute inset-0 -z-1"
      />
    </CommandPrimitive.Separator>
  );
}

function CommandItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={cn(
        // cmdk writes `data-selected="false"` on every other row, so the ink keys on `=true`.
        "group/command-item relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none in-data-[slot=dialog-content]:rounded-lg! data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 data-[selected=true]:*:[svg]:text-primary-foreground",
        className,
      )}
      {...props}
    >
      {children}
      <CheckIcon
        className="ml-auto opacity-0 group-has-data-[slot=command-shortcut]/command-item:hidden group-data-[checked=true]/command-item:opacity-100"
        strokeWidth={3}
      />
    </CommandPrimitive.Item>
  );
}

function CommandShortcut({ className, children, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="command-shortcut"
      className={cn(
        "pointer-events-none relative isolate ml-auto inline-flex h-5.5 w-fit min-w-5.5 items-center justify-center gap-1 rounded-sm border-0 bg-paper px-1.5 font-display text-[11px] leading-none tracking-widest text-ink uppercase select-none has-[>[data-inked=true]]:bg-transparent!",
        className,
      )}
      {...props}
    >
      {/* kbd's key cap: a hand-drawn paper cap with ink text, on a selected row too. */}
      <InkFrame as="span" fill="paper" className="pointer-events-none absolute inset-0 -z-1" />
      {children}
    </span>
  );
}

export {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
};
