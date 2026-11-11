"use client";

import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BookmarkIcon,
  Columns2Icon,
  MaximizeIcon,
  Share2Icon,
} from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/registry/ui/command/command";

export default function CommandGroupsAndShortcutsDemo() {
  return (
    <Command label="Page commands" className="max-w-sm">
      <CommandInput placeholder="Search page commands…" />
      <CommandList className="max-h-96">
        <CommandEmpty>No commands found.</CommandEmpty>
        <CommandGroup heading="Navigate">
          <CommandItem>
            <ArrowLeftIcon />
            Previous page
            <CommandShortcut>←</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <ArrowRightIcon />
            Next page
            <CommandShortcut>→</CommandShortcut>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="View">
          <CommandItem>
            <Columns2Icon />
            Two-page spread
            <CommandShortcut>S</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <MaximizeIcon />
            Full screen
            <CommandShortcut>F</CommandShortcut>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Page">
          <CommandItem>
            <BookmarkIcon />
            Bookmark
            <CommandShortcut>B</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <Share2Icon />
            Share
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  );
}
