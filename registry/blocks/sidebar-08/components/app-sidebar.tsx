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
import { Link } from "@/lib/link";
import { NavMain } from "./nav-main";
import { NavProjects } from "./nav-projects";
import { NavSecondary } from "./nav-secondary";
import { NavUser, type NavUserActions } from "./nav-user";

// Based on shadcn/ui sidebar-08 (MIT, https://ui.shadcn.com), base-nova style, fetched 2026-11-18.
// Stock's inset sidebar with a small manga studio's sample data in stock's shape: the workflow,
// its series, support links and one editor. Where stock fills a square for the logo, the studio's
// mark sits in an avatar's inked circle, so every outline is drawn by mangacn's items.

/** The studio in the header: its mark, name and plan, linking home. */
export interface SidebarBrand {
  name: string;
  logo: React.ReactNode;
  plan: string;
  url: string;
}

/** The signed-in user in the footer. With `avatar` empty (`""`) the avatar shows their initials. */
export interface SidebarUser {
  name: string;
  email: string;
  avatar: string;
}

/** A section of the main navigation: a collapsible group of links. */
export interface SidebarNavItem {
  title: string;
  url: string;
  icon: React.ReactNode;
  /** Opened and marked current from the start. */
  isActive?: boolean;
  items?: { title: string; url: string }[];
}

/** A link of the secondary navigation, at the foot of the content. */
export interface SidebarLink {
  title: string;
  url: string;
  icon: React.ReactNode;
}

/** A project (here a series), each with a menu of its own. */
export interface SidebarProject {
  name: string;
  url: string;
  icon: React.ReactNode;
}

// This is sample data.
const data = {
  brand: {
    name: "Inkpot Studio",
    logo: <PenToolIcon className="size-4" />,
    plan: "Weekly serial",
    url: "/",
  },
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

export interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  /**
   * The landmark's name.
   * @default "Studio"
   */
  label?: string;
  /** The studio in the header. @default the sample studio, linking to "/" */
  brand?: SidebarBrand;
  /** The main navigation's sections. @default the sample workflow */
  navMain?: SidebarNavItem[];
  /** The projects. @default the sample series */
  projects?: SidebarProject[];
  /** The secondary links at the foot of the content. @default Support and Feedback */
  navSecondary?: SidebarLink[];
  /** The signed-in user. @default the sample editor */
  user?: SidebarUser;
  /** What the user menu's items do. Without them the items do nothing. */
  userActions?: NavUserActions;
}

// The sidebar is the page's navigation landmark, named, so nothing on the page sits outside one
// (the inset beside it is the `main`); on a phone it is the sheet, a dialog named "Sidebar".
export function AppSidebar({
  label = "Studio",
  brand = data.brand,
  navMain = data.navMain,
  projects = data.projects,
  navSecondary = data.navSecondary,
  user = data.user,
  userActions,
  ...props
}: AppSidebarProps) {
  return (
    <Sidebar variant="inset" role="navigation" aria-label={label} {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href={brand.url} />}>
              <Avatar>
                <AvatarFallback>{brand.logo}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{brand.name}</span>
                <span className="truncate text-xs">{brand.plan}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavProjects projects={projects} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} {...userActions} />
      </SidebarFooter>
    </Sidebar>
  );
}
