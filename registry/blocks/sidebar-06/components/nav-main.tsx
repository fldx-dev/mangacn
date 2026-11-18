"use client";

import { MoreHorizontalIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

// Based on shadcn/ui sidebar-06 (MIT, https://ui.shadcn.com), base-nova style, fetched 2026-11-18.
// The handbook's sections, each a button that opens its pages as a menu: beside the sidebar on
// a desktop, below the button on a phone.

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: React.ReactNode;
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
}) {
  const { isMobile } = useSidebar();
  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => (
          <DropdownMenu key={item.title}>
            <SidebarMenuItem>
              <DropdownMenuTrigger
                render={<SidebarMenuButton className="aria-expanded:bg-muted" />}
              >
                {item.title} <MoreHorizontalIcon className="ml-auto" />
              </DropdownMenuTrigger>
              {item.items?.length ? (
                <DropdownMenuContent
                  side={isMobile ? "bottom" : "right"}
                  align={isMobile ? "end" : "start"}
                  className="min-w-56 rounded-lg"
                >
                  {item.items.map((item) => (
                    <DropdownMenuItem key={item.title} render={<a href={item.url} />}>
                      {item.title}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              ) : null}
            </SidebarMenuItem>
          </DropdownMenu>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
