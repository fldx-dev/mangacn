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
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Calendars } from "./calendars";
import { DatePicker } from "./date-picker";
import { NavUser } from "./nav-user";

// Based on shadcn/ui sidebar-12 (MIT, https://ui.shadcn.com), base-nova style, fetched 2026-11-18.
// Stock's calendar sidebar with a manga studio's sample data in stock's shape: the editor, a
// month and the studio's calendars. Where stock rules the header off with an edge line, a
// sidebar separator draws the line.

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

// The sidebar is the page's navigation landmark, named, so nothing on the page sits outside one
// (the inset beside it is the `main`); on a phone it is the sheet, a dialog named "Sidebar".
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar role="navigation" aria-label="Schedule" {...props}>
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
      <SidebarRail />
    </Sidebar>
  );
}
