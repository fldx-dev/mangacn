"use client";

import {
  BlocksIcon,
  CalendarIcon,
  HomeIcon,
  InboxIcon,
  LampDeskIcon,
  MessageCircleQuestionIcon,
  MoonStarIcon,
  PenToolIcon,
  SearchIcon,
  Settings2Icon,
  SparklesIcon,
  Trash2Icon,
} from "lucide-react";
import type * as React from "react";
import { Sidebar, SidebarContent, SidebarHeader, SidebarRail } from "@/components/ui/sidebar";
import { NavFavorites } from "./nav-favorites";
import { NavMain } from "./nav-main";
import { NavSecondary } from "./nav-secondary";
import { NavWorkspaces } from "./nav-workspaces";
import { TeamSwitcher } from "./team-switcher";

// Based on shadcn/ui sidebar-10 (MIT, https://ui.shadcn.com), base-nova style, fetched 2026-11-18.
// Stock's notes-app sidebar with a manga studio's notebook in stock's shape: its circles, the
// main links, favourite notes, workspaces of pages and the secondary links at the foot. Every
// outline and menu is drawn by mangacn's items.

// This is sample data.
const data = {
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
      title: "Search",
      url: "#",
      icon: <SearchIcon />,
    },
    {
      title: "Ask AI",
      url: "#",
      icon: <SparklesIcon />,
    },
    {
      title: "Home",
      url: "#",
      icon: <HomeIcon />,
      isActive: true,
    },
    {
      title: "Inbox",
      url: "#",
      icon: <InboxIcon />,
      badge: "10",
    },
  ],
  navSecondary: [
    {
      title: "Calendar",
      url: "#",
      icon: <CalendarIcon />,
    },
    {
      title: "Settings",
      url: "#",
      icon: <Settings2Icon />,
    },
    {
      title: "Templates",
      url: "#",
      icon: <BlocksIcon />,
    },
    {
      title: "Trash",
      url: "#",
      icon: <Trash2Icon />,
    },
    {
      title: "Help",
      url: "#",
      icon: <MessageCircleQuestionIcon />,
    },
  ],
  favorites: [
    {
      name: "Chapter 12 Script & Storyboard",
      url: "#",
      emoji: "📝",
    },
    {
      name: "Character Sheets & Expressions",
      url: "#",
      emoji: "🎭",
    },
    {
      name: "Screentone & Texture Library",
      url: "#",
      emoji: "🔳",
    },
    {
      name: "Reading List & References",
      url: "#",
      emoji: "📚",
    },
    {
      name: "Background Photos by Location",
      url: "#",
      emoji: "📷",
    },
    {
      name: "Sound Effect Lettering Ideas",
      url: "#",
      emoji: "💥",
    },
    {
      name: "Convention Table & Print Run",
      url: "#",
      emoji: "🏮",
    },
    {
      name: "Royalties & Studio Budget",
      url: "#",
      emoji: "💰",
    },
    {
      name: "Anime Adaptation Notes",
      url: "#",
      emoji: "🎬",
    },
    {
      name: "Daily Page Count & Goals",
      url: "#",
      emoji: "✅",
    },
  ],
  workspaces: [
    {
      name: "Moonlit Ronin",
      emoji: "⚔️",
      pages: [
        {
          name: "Volume 3 Chapter Plan",
          url: "#",
          emoji: "📔",
        },
        {
          name: "Sword Fight Choreography",
          url: "#",
          emoji: "🤺",
        },
        {
          name: "Ferry Arc Thumbnails",
          url: "#",
          emoji: "⛴️",
        },
      ],
    },
    {
      name: "Kitchen Spirits",
      emoji: "🍳",
      pages: [
        {
          name: "Recipe of the Week",
          url: "#",
          emoji: "🍙",
        },
        {
          name: "Spirit Designs & Names",
          url: "#",
          emoji: "👻",
        },
        {
          name: "Reader Letters to Answer",
          url: "#",
          emoji: "✉️",
        },
      ],
    },
    {
      name: "Starboard Academy",
      emoji: "⛵",
      pages: [
        {
          name: "Class Roster & Clubs",
          url: "#",
          emoji: "🎒",
        },
        {
          name: "School Map & Rooftop",
          url: "#",
          emoji: "🗺️",
        },
        {
          name: "Festival Arc Outline",
          url: "#",
          emoji: "🎆",
        },
      ],
    },
    {
      name: "Studio",
      emoji: "🏡",
      pages: [
        {
          name: "Assistant Schedule",
          url: "#",
          emoji: "📅",
        },
        {
          name: "Supplies: Nibs, Ink & Paper",
          url: "#",
          emoji: "🖋️",
        },
        {
          name: "Scanner & Tablet Setup",
          url: "#",
          emoji: "🔧",
        },
      ],
    },
    {
      name: "One-shots",
      emoji: "🌙",
      pages: [
        {
          name: "Lighthouse Cat",
          url: "#",
          emoji: "🐈",
        },
        {
          name: "Last Train Home",
          url: "#",
          emoji: "🚃",
        },
        {
          name: "Contest Entries & Deadlines",
          url: "#",
          emoji: "🏆",
        },
      ],
    },
  ],
};

// The sidebar is the page's navigation landmark, named, so nothing on the page sits outside one
// (the inset beside it is the `main`); on a phone it is the sheet, a dialog named "Sidebar".
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar role="navigation" aria-label="Notebook" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
        <NavMain items={data.navMain} />
      </SidebarHeader>
      <SidebarContent>
        <NavFavorites favorites={data.favorites} />
        <NavWorkspaces workspaces={data.workspaces} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
