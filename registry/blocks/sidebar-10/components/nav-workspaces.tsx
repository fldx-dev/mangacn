"use client";

import { ChevronRightIcon, MoreHorizontalIcon, PlusIcon } from "lucide-react";
import type * as React from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { Link } from "@/lib/link";

// Based on shadcn/ui sidebar-10 (MIT, https://ui.shadcn.com), base-nova style, fetched 2026-11-18.
// The workspaces, each a link whose pages open from a chevron that covers its emoji on hover, as
// stock's does (the chevron's fill is the sidebar's own hover tone, so it hides the emoji under
// it). The collapsible is the list item, so the list holds only items, and the chevron and the
// add button are named by their workspace.

export function NavWorkspaces({
  workspaces,
}: {
  workspaces: {
    name: string;
    emoji: React.ReactNode;
    pages: {
      name: string;
      emoji: React.ReactNode;
    }[];
  }[];
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Workspaces</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {workspaces.map((workspace) => (
            <Collapsible key={workspace.name} render={<SidebarMenuItem />}>
              <SidebarMenuButton render={<Link href="#workspaces" />}>
                <span>{workspace.emoji}</span>
                <span>{workspace.name}</span>
              </SidebarMenuButton>
              <SidebarMenuAction
                render={<CollapsibleTrigger />}
                className="left-2 bg-sidebar-accent text-sidebar-accent-foreground data-open:rotate-90"
                showOnHover
              >
                <ChevronRightIcon />
                <span className="sr-only">Pages of {workspace.name}</span>
              </SidebarMenuAction>
              <SidebarMenuAction showOnHover>
                <PlusIcon />
                <span className="sr-only">Add a page to {workspace.name}</span>
              </SidebarMenuAction>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {workspace.pages.map((page) => (
                    <SidebarMenuSubItem key={page.name}>
                      <SidebarMenuSubButton render={<Link href="#workspaces" />}>
                        <span>{page.emoji}</span>
                        <span>{page.name}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </Collapsible>
          ))}
          <SidebarMenuItem>
            <SidebarMenuButton className="text-sidebar-foreground/70">
              <MoreHorizontalIcon />
              <span>More</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
