"use client";

import { BookmarkIcon, CompassIcon, FlameIcon, SearchIcon } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from "@/registry/ui/sidebar/sidebar";

const browse = [
  { title: "Discover", icon: CompassIcon },
  { title: "Trending", icon: FlameIcon, active: true },
  { title: "Bookmarks", icon: BookmarkIcon },
];

const genres = ["Action", "Romance", "Mystery"];

// variant="floating" sets the sidebar off the window's edge as a heavy-outlined paper card.
export default function SidebarFloatingDemo() {
  return (
    <SidebarProvider className="fixed inset-0">
      <Sidebar variant="floating">
        <SidebarHeader>
          <div className="relative">
            <SearchIcon
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-2 z-1 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <SidebarInput aria-label="Search series" placeholder="Search series" className="pl-8" />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Browse</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {browse.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={item.active}
                      aria-current={item.active ? "page" : undefined}
                      render={<a href="#browse" />}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarSeparator />
          <SidebarGroup>
            <SidebarGroupLabel>Genres</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {genres.map((genre) => (
                  <SidebarMenuItem key={genre}>
                    <SidebarMenuButton render={<a href="#genres" />}>
                      <span>{genre}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-12 shrink-0 items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <span className="text-sm font-medium">Trending</span>
        </div>
        <div className="flex flex-col gap-2 px-4 pb-4">
          <h3 className="font-display text-xl tracking-wide">This week</h3>
          <p className="max-w-prose text-sm text-muted-foreground">
            Ronin Nights climbs to first; Paper Moon returns from its break with chapter 40.
          </p>
        </div>
      </div>
    </SidebarProvider>
  );
}
