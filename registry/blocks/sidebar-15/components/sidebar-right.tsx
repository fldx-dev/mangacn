"use client";

import { PlusIcon } from "lucide-react";
import type * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { Calendars } from "./calendars";
import { DatePicker } from "./date-picker";
import { NavUser } from "./nav-user";

// Based on shadcn/ui sidebar-15 (MIT, https://ui.shadcn.com), base-nova style, fetched 2026-11-18.
// The right sidebar: the editor, a month and the studio's calendars, sticky beside the page from
// lg up and hidden below, as in stock. Stock's never collapses; here it goes away with the left
// one (Ctrl/⌘+B or the trigger), so one shortcut clears the page. A sidebar separator draws the
// line under the header where stock has an edge line.

// This is sample data.
const data = {
  user: {
    name: "Hana Mori",
    email: "hana@example.com",
    // No photo: the avatar shows the fallback's initials. Put an image URL here.
    avatar: "",
  },
  calendars: [
    {
      name: "Studio",
      items: ["Serial deadlines", "Inking", "Lettering"],
    },
    {
      name: "Favorites",
      items: ["Release days", "Conventions"],
    },
    {
      name: "Other",
      items: ["Signings", "Reminders", "Print runs"],
    },
  ],
};

// A navigation landmark named apart from the left sidebar's.
export function SidebarRight({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { state } = useSidebar();
  return (
    <Sidebar
      collapsible="none"
      className={
        state === "collapsed" ? "hidden" : "sticky top-0 hidden h-svh overflow-x-clip lg:flex"
      }
      role="navigation"
      aria-label="Schedule"
      {...props}
    >
      <SidebarHeader className="h-16">
        <NavUser user={data.user} />
      </SidebarHeader>
      <SidebarSeparator className="mx-0" />
      <SidebarContent>
        <DatePicker />
        <SidebarSeparator className="mx-0" />
        <Calendars calendars={data.calendars} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <PlusIcon />
              <span>New Calendar</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
