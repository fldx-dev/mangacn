"use client";

import { BookmarkIcon, BookOpenIcon, MoonIcon, SettingsIcon } from "lucide-react";
import * as React from "react";
import { Button } from "@/registry/ui/button/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/registry/ui/command/command";

export default function CommandDialogDemo() {
  // Open on load for the preview; in an app start closed and open it from ⌘K as well.
  const [open, setOpen] = React.useState(true);
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Open the palette
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command label="Reader commands">
          <CommandInput placeholder="Type a command or search…" />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Reading">
              <CommandItem>
                <BookOpenIcon />
                Continue chapter 12
              </CommandItem>
              <CommandItem>
                <BookmarkIcon />
                Bookmark this page
                <CommandShortcut>B</CommandShortcut>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Settings">
              <CommandItem>
                <MoonIcon />
                Night mode
                <CommandShortcut>N</CommandShortcut>
              </CommandItem>
              <CommandItem>
                <SettingsIcon />
                Preferences
                <CommandShortcut>,</CommandShortcut>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
