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
import { NavUser, type NavUserActions } from "./nav-user";
import { TeamSwitcher } from "./team-switcher";

// Based on shadcn/ui sidebar-07 (MIT, https://ui.shadcn.com), base-nova style, fetched 2026-11-12.
// Stock's sidebar with a small manga studio's sample data in stock's shape: its circles, the
// workflow, its series and one editor. Every outline and menu is drawn by mangacn's items.

/** The signed-in user in the footer. With `avatar` empty (`""`) the avatar shows their initials. */
export interface SidebarUser {
  name: string;
  email: string;
  avatar: string;
}

/** A team in the header's switcher. */
export interface SidebarTeam {
  name: string;
  logo: React.ReactNode;
  plan: string;
}

/** A section of the main navigation: a collapsible group of links. */
export interface SidebarNavItem {
  title: string;
  url: string;
  icon?: React.ReactNode;
  /** Opened and marked current from the start. */
  isActive?: boolean;
  items?: { title: string; url: string }[];
}

/** A project (here a series), each with a menu of its own. */
export interface SidebarProject {
  name: string;
  url: string;
  icon: React.ReactNode;
}

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

export interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  /**
   * The landmark's name.
   * @default "Studio"
   */
  label?: string;
  /** The teams in the header's switcher; the first is the current one. @default the sample studios */
  teams?: SidebarTeam[];
  /** The main navigation's sections. @default the sample workflow */
  navMain?: SidebarNavItem[];
  /** The projects. @default the sample series */
  projects?: SidebarProject[];
  /** The signed-in user. @default the sample editor */
  user?: SidebarUser;
  /** What the user menu's items do. Without them the items do nothing. */
  userActions?: NavUserActions;
}

// The sidebar is the page's navigation landmark, named, so nothing on the page sits outside one
// (the inset beside it is the `main`); on a phone it is the sheet, a dialog named "Sidebar".
export function AppSidebar({
  label = "Studio",
  teams = data.teams,
  navMain = data.navMain,
  projects = data.projects,
  user = data.user,
  userActions,
  ...props
}: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon" role="navigation" aria-label={label} {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavProjects projects={projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} {...userActions} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
