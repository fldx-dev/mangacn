"use client";

import { SearchIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { SidebarGroup, SidebarGroupContent, SidebarInput } from "@/components/ui/sidebar";

// Based on shadcn/ui sidebar-02 (MIT, https://ui.shadcn.com), base-nova style, fetched 2026-11-18.
// The handbook's search field, a form named for screen readers: the input draws its own ink
// outline, the label is for screen readers too, and the magnifier sits inside the field.

export function SearchForm({ ...props }: React.ComponentProps<"form">) {
  return (
    <form aria-label="Search the handbook" {...props}>
      <SidebarGroup className="py-0">
        <SidebarGroupContent className="relative">
          <Label htmlFor="search" className="sr-only">
            Search
          </Label>
          <SidebarInput id="search" placeholder="Search the handbook..." className="pl-8" />
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 opacity-50 select-none" />
        </SidebarGroupContent>
      </SidebarGroup>
    </form>
  );
}
