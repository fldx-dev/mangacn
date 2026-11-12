"use client";

import {
  BookOpenIcon,
  BrushIcon,
  CookingPotIcon,
  LampDeskIcon,
  LayersIcon,
  MoonStarIcon,
  PenToolIcon,
  SailboatIcon,
  Settings2Icon,
  SwordsIcon,
} from "lucide-react";
import type * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { NavMain } from "./nav-main";
import { NavProjects } from "./nav-projects";
import { NavUser } from "./nav-user";
import { TeamSwitcher } from "./team-switcher";

// Based on shadcn/ui sidebar-07 (MIT, https://ui.shadcn.com), base-nova style, fetched 2026-11-12.
// Stock's sidebar with a small manga studio's sample data in stock's shape: its circles, the
// workflow, its series and one editor. Every outline and menu is drawn by mangacn's items.

// This is sample data.
const data = {
  user: {
    name: "Hana Mori",
    email: "hana@example.com",
    // No photo: the avatar shows the fallback's initials. Put an image URL here.
    avatar: "",
  },
  teams: [
    {
      name: "Inkpot Studio",
      logo: <PenToolIcon />,
      plan: "Weekly serial",
    },
    {
      name: "Night Owl Press",
      logo: <MoonStarIcon />,
      plan: "Monthly",
    },
    {
      name: "Paper Lantern",
      logo: <LampDeskIcon />,
      plan: "Doujin circle",
    },
  ],
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

// The sidebar is the page's navigation landmark, named, so nothing on the page sits outside one
// (the inset beside it is the `main`); on a phone it is the sheet, a dialog named "Sidebar".
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" role="navigation" aria-label="Studio" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
