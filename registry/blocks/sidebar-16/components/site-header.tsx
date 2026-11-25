"use client";

import { PanelLeftIcon } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useSidebar } from "@/components/ui/sidebar";
import { Link } from "@/lib/link";
import { SearchForm } from "./search-form";

// Based on shadcn/ui sidebar-16 (MIT, https://ui.shadcn.com), base-nova style, fetched 2026-11-18.
// The site header above the shell: the sidebar's toggle, where the editor is, and the search.
// Sticky over the page, on the paper; where stock rules it off with an edge line, a separator
// draws the line. The toggle has a name of its own, which stock's icon button lacks.

export function SiteHeader() {
  const { toggleSidebar } = useSidebar();

  return (
    <header className="sticky top-0 z-50 flex w-full items-center overflow-x-clip bg-background">
      <div className="flex h-(--header-height) w-full items-center gap-2 px-4">
        <Button className="h-8 w-8" variant="ghost" size="icon" onClick={toggleSidebar}>
          <PanelLeftIcon />
          <span className="sr-only">Toggle Sidebar</span>
        </Button>
        <Separator
          orientation="vertical"
          className="mr-2 data-vertical:h-4 data-vertical:self-auto"
        />
        <Breadcrumb className="hidden sm:block">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="#" />}>Moonlit Ronin</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Storyboards</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <SearchForm className="w-full sm:ml-auto sm:w-auto" />
      </div>
      <Separator className="absolute inset-x-0 bottom-0" />
    </header>
  );
}
