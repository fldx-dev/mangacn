"use client";

import {
  BookOpenIcon,
  BrushIcon,
  CookingPotIcon,
  LayersIcon,
  LifeBuoyIcon,
  PenToolIcon,
  SailboatIcon,
  SendIcon,
  Settings2Icon,
  SwordsIcon,
} from "lucide-react";
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
} from "@/components/ui/sidebar";
import { NavMain } from "./nav-main";
import { NavProjects } from "./nav-projects";
import { NavSecondary } from "./nav-secondary";
import { NavUser } from "./nav-user";

// Based on shadcn/ui sidebar-16 (MIT, https://ui.shadcn.com), base-nova style, fetched 2026-11-18.
// Stock's sidebar under the site header, with a small manga studio's sample data in stock's
// shape. Where stock fills a square behind the studio's logo, the logo sits in an avatar's inked
// circle, so the avatar draws it.

const data = {
  user: {
    name: "Hana Mori",
    email: "hana@example.com",
    // No photo: the avatar shows the fallback's initials. Put an image URL here.
    avatar: "",
  },
  navMain: [
    {
      title: "Series",
      url: "#",
      icon: <BookOpenIcon />,
      isActive: true,
      items: [
        {
          title: "Ongoing",
          url: "#",
        },
        {
          title: "Completed",
          url: "#",
        },
        {
          title: "On hiatus",
          url: "#",
        },
      ],
    },
    {
      title: "Chapters",
      url: "#",
      icon: <LayersIcon />,
      items: [
        {
          title: "Drafts",
          url: "#",
        },
        {
          title: "In review",
          url: "#",
        },
        {
          title: "Scheduled",
          url: "#",
        },
      ],
    },
    {
      title: "Pages",
      url: "#",
      icon: <BrushIcon />,
      items: [
        {
          title: "Storyboards",
          url: "#",
        },
        {
          title: "Inks",
          url: "#",
        },
        {
          title: "Tones",
          url: "#",
        },
        {
          title: "Lettering",
          url: "#",
        },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: <Settings2Icon />,
      items: [
        {
          title: "General",
          url: "#",
        },
        {
          title: "Team",
          url: "#",
        },
        {
          title: "Billing",
          url: "#",
        },
        {
          title: "Print & export",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Support",
      url: "#",
      icon: <LifeBuoyIcon />,
    },
    {
      title: "Feedback",
      url: "#",
      icon: <SendIcon />,
    },
  ],
  projects: [
    {
      name: "Moonlit Ronin",
      url: "#",
      icon: <SwordsIcon />,
    },
    {
      name: "Kitchen Spirits",
      url: "#",
      icon: <CookingPotIcon />,
    },
    {
      name: "Starboard Academy",
      url: "#",
      icon: <SailboatIcon />,
    },
  ],
};

// The sidebar is the page's navigation landmark, named; it starts under the site header (the
// banner) and, on a phone, is the sheet, a dialog named "Sidebar".
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
      role="navigation"
      aria-label="Studio"
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<a href="/dashboard" />}>
              <Avatar>
                <AvatarFallback>
                  <PenToolIcon className="size-4" />
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">Inkpot Studio</span>
                <span className="truncate text-xs">Weekly serial</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
