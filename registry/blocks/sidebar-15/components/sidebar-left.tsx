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

// Based on shadcn/ui sidebar-15 (MIT, https://ui.shadcn.com), base-nova style, fetched 2026-11-18.
// The left sidebar: a manga studio's notebook in stock's shape, its circles, main links,
// favourite notes, workspaces and the links at its foot. Every outline is mangacn's items'.

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
      name: "Moonlit Ronin: series bible",
      url: "#",
      emoji: "📜",
    },
    {
      name: "Character sheets & turnarounds",
      url: "#",
      emoji: "🎭",
    },
    {
      name: "Chapter 13 storyboard notes",
      url: "#",
      emoji: "🎬",
    },
    {
      name: "Reference photos: old Edo streets",
      url: "#",
      emoji: "🏯",
    },
    {
      name: "Screentone library & brushes",
      url: "#",
      emoji: "🖌️",
    },
    {
      name: "Reader letters to answer",
      url: "#",
      emoji: "✉️",
    },
    {
      name: "Convention table checklist",
      url: "#",
      emoji: "🎪",
    },
    {
      name: "Print run budget & quotes",
      url: "#",
      emoji: "💴",
    },
    {
      name: "Lettering style guide",
      url: "#",
      emoji: "✒️",
    },
    {
      name: "Weekly page quota tracker",
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
          name: "Plot outline & arcs",
          url: "#",
          emoji: "🗺️",
        },
        {
          name: "Cast & rivals",
          url: "#",
          emoji: "👥",
        },
        {
          name: "Sword designs",
          url: "#",
          emoji: "🗡️",
        },
      ],
    },
    {
      name: "Kitchen Spirits",
      emoji: "🍲",
      pages: [
        {
          name: "Recipe research",
          url: "#",
          emoji: "📔",
        },
        {
          name: "Spirit designs",
          url: "#",
          emoji: "👻",
        },
        {
          name: "Episode ideas",
          url: "#",
          emoji: "💡",
        },
      ],
    },
    {
      name: "Starboard Academy",
      emoji: "⛵",
      pages: [
        {
          name: "School map",
          url: "#",
          emoji: "🧭",
        },
        {
          name: "Class roster",
          url: "#",
          emoji: "📋",
        },
        {
          name: "Sports festival arc",
          url: "#",
          emoji: "🏅",
        },
      ],
    },
    {
      name: "Studio business",
      emoji: "💼",
      pages: [
        {
          name: "Contracts & royalties",
          url: "#",
          emoji: "📑",
        },
        {
          name: "Assistant schedules",
          url: "#",
          emoji: "📅",
        },
        {
          name: "Merch ideas",
          url: "#",
          emoji: "🛍️",
        },
      ],
    },
    {
      name: "Research trips",
      emoji: "🧳",
      pages: [
        {
          name: "Kyoto location scouting",
          url: "#",
          emoji: "⛩️",
        },
        {
          name: "Sketchbook scans",
          url: "#",
          emoji: "📸",
        },
        {
          name: "Museum notes",
          url: "#",
          emoji: "🏛️",
        },
      ],
    },
  ],
};

// The left sidebar is a navigation landmark named apart from the right one; on a phone it is the
// sheet, a dialog named "Sidebar".
export function SidebarLeft({ ...props }: React.ComponentProps<typeof Sidebar>) {
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
