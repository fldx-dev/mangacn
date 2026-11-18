"use client";

import {
  ArrowUpRightIcon,
  LinkIcon,
  MoreHorizontalIcon,
  StarOffIcon,
  Trash2Icon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

// Based on shadcn/ui sidebar-10 (MIT, https://ui.shadcn.com), base-nova style, fetched 2026-11-18.
// The favourite notes, each with a menu of its own named by its note.

export function NavFavorites({
  favorites,
}: {
  favorites: {
    name: string;
    url: string;
    emoji: string;
  }[];
}) {
  const { isMobile } = useSidebar();
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Favorites</SidebarGroupLabel>
      <SidebarMenu>
        {favorites.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton render={<a href={item.url} title={item.name} />}>
              <span>{item.emoji}</span>
              <span>{item.name}</span>
            </SidebarMenuButton>
            <DropdownMenu>
              <DropdownMenuTrigger render={<SidebarMenuAction showOnHover />}>
                <MoreHorizontalIcon />
                <span className="sr-only">More for {item.name}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-56"
                side={isMobile ? "bottom" : "right"}
                align={isMobile ? "end" : "start"}
              >
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    <StarOffIcon />
                    <span>Remove from Favorites</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    <LinkIcon />
                    <span>Copy Link</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <ArrowUpRightIcon />
                    <span>Open in New Tab</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Trash2Icon />
                    <span>Delete</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        ))}
        <SidebarMenuItem>
          <SidebarMenuButton className="text-sidebar-foreground/70">
            <MoreHorizontalIcon />
            <span>More</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}
