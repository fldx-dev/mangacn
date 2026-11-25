import type * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Link } from "@/lib/link";
import { SearchForm } from "./search-form";
import { VersionSwitcher } from "./version-switcher";

// Based on shadcn/ui sidebar-01 (MIT, https://ui.shadcn.com), base-nova style, fetched 2026-11-18.
// Stock's documentation sidebar with a manga studio's handbook in stock's shape: its editions,
// a search field and its sections as labelled groups of links. Every outline is the items'.

// This is sample data.
const data = {
  versions: ["1.0.1", "1.1.0-alpha", "2.0.0-beta1"],
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
  ],
};

// The sidebar is the page's navigation landmark, named, so nothing on the page sits outside one
// (the inset beside it is the `main`); on a phone it is the sheet, a dialog named "Sidebar".
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar role="navigation" aria-label="Handbook" {...props}>
      <SidebarHeader>
        <VersionSwitcher versions={data.versions} defaultVersion={data.versions[0]} />
        <SearchForm />
      </SidebarHeader>
      <SidebarContent>
        {data.navMain.map((item) => (
          <SidebarGroup key={item.title}>
            <SidebarGroupLabel>{item.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {item.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton isActive={item.isActive} render={<Link href={item.url} />}>
                      {item.title}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
