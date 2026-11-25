"use client";

import { BookOpenIcon } from "lucide-react";
import type * as React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Link } from "@/lib/link";
import { NavMain } from "./nav-main";
import { SidebarOptInForm } from "./sidebar-opt-in-form";

// Based on shadcn/ui sidebar-06 (MIT, https://ui.shadcn.com), base-nova style, fetched 2026-11-18.
// Stock's documentation sidebar with a manga studio's handbook in stock's shape: the sections as
// menus and the studio letter's sign-up at the foot. Where stock fills a square for the mark,
// the book sits in an avatar's inked circle, so the avatar draws it.

// This is sample data.
const data = {
  navMain: [
    {
      title: "Getting started",
      url: "#",
      items: [
        {
          title: "Your desk",
          url: "#",
        },
        {
          title: "Studio layout",
          url: "#",
        },
      ],
    },
    {
      title: "Make a chapter",
      url: "#",
      items: [
        {
          title: "Script",
          url: "#",
        },
        {
          title: "Thumbnails",
          url: "#",
          isActive: true,
        },
        {
          title: "Pencils",
          url: "#",
        },
        {
          title: "Inks",
          url: "#",
        },
        {
          title: "Screentones",
          url: "#",
        },
        {
          title: "Lettering",
          url: "#",
        },
        {
          title: "Sound effects",
          url: "#",
        },
        {
          title: "Proofs",
          url: "#",
        },
        {
          title: "Editor review",
          url: "#",
        },
        {
          title: "Print files",
          url: "#",
        },
        {
          title: "Reprints",
          url: "#",
        },
        {
          title: "Sample pages",
          url: "#",
        },
      ],
    },
    {
      title: "Reference",
      url: "#",
      items: [
        {
          title: "Panel layouts",
          url: "#",
        },
        {
          title: "File naming",
          url: "#",
        },
        {
          title: "Brushes and pens",
          url: "#",
        },
        {
          title: "Page sizes and bleed",
          url: "#",
        },
        {
          title: "Export presets",
          url: "#",
        },
        {
          title: "Web serials",
          url: "#",
        },
      ],
    },
    {
      title: "The craft",
      url: "#",
      items: [
        {
          title: "Reading order",
          url: "#",
        },
        {
          title: "Speed lines",
          url: "#",
        },
        {
          title: "Halftone",
          url: "#",
        },
        {
          title: "Supported formats",
          url: "#",
        },
        {
          title: "Colour pages",
          url: "#",
        },
      ],
    },
    {
      title: "Community",
      url: "#",
      items: [
        {
          title: "Assistant guide",
          url: "#",
        },
      ],
    },
  ],
};

// The sidebar is the page's navigation landmark, named, so nothing on the page sits outside one
// (the inset beside it is the `main`); on a phone it is the sheet, a dialog named "Sidebar".
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar role="navigation" aria-label="Handbook" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/dashboard" />}>
              <Avatar>
                <AvatarFallback>
                  <BookOpenIcon className="size-4" />
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-medium">Studio Handbook</span>
                <span className="">v1.0.0</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <div className="p-1">
          <SidebarOptInForm />
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
