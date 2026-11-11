"use client";

import { BookmarkIcon, BookOpenIcon, LibraryIcon, SearchIcon } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/registry/ui/command/command";

export default function CommandDefaultDemo() {
  return (
    <Command label="Reader commands" className="max-w-sm">
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
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Library">
          <CommandItem>
            <LibraryIcon />
            Open my shelf
          </CommandItem>
          <CommandItem>
            <SearchIcon />
            Find a series
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  );
}
