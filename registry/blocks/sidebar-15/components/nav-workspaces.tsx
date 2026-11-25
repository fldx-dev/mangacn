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

// Based on shadcn/ui sidebar-15 (MIT, https://ui.shadcn.com), base-nova style, fetched 2026-11-18.
// The notebook's workspaces, each opening its pages. On hover, a chevron over the workspace's
// emoji opens it and a plus adds a page; both are named by their workspace, where stock leaves
// them unnamed. The collapsible renders the list item itself, so the list holds only items.

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
              {/* Stock's placeholder link; point it at the workspace. */}
              <SidebarMenuButton render={<Link href="#" />}>
                <span>{workspace.emoji}</span>
                <span>{workspace.name}</span>
              </SidebarMenuButton>
              <SidebarMenuAction
                render={<CollapsibleTrigger />}
                className="left-2 bg-sidebar-accent text-sidebar-accent-foreground data-open:rotate-90"
                showOnHover
              >
                <ChevronRightIcon />
                <span className="sr-only">Toggle {workspace.name}</span>
              </SidebarMenuAction>
              <SidebarMenuAction showOnHover>
                <PlusIcon />
                <span className="sr-only">Add a page to {workspace.name}</span>
              </SidebarMenuAction>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {workspace.pages.map((page) => (
                    <SidebarMenuSubItem key={page.name}>
                      {/* Stock's placeholder link; point it at the page. */}
                      <SidebarMenuSubButton render={<Link href="#" />}>
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
