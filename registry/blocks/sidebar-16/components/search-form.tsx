"use client";

import { SearchIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { SidebarInput } from "@/components/ui/sidebar";

// Based on shadcn/ui sidebar-16 (MIT, https://ui.shadcn.com), base-nova style, fetched 2026-11-18.
// The header's search: a named form around the sidebar's input, labelled for screen
// readers, the icon inside it.

export function SearchForm({ ...props }: React.ComponentProps<"form">) {
  return (
    <form aria-label="Search the studio" {...props}>
      <div className="relative">
        <Label htmlFor="search" className="sr-only">
          Search
        </Label>
        <SidebarInput id="search" placeholder="Search the studio..." className="h-8 pl-7" />
        <SearchIcon className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 opacity-50 select-none" />
      </div>
    </form>
  );
}
