import type * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Link } from "@/lib/link";

// Based on shadcn/ui sidebar-14 (MIT, https://ui.shadcn.com), base-nova style, fetched 2026-11-18.
// Stock's table of contents with a manga studio's handbook in stock's shape: every section with
// its pages beneath it on the submenu's ink guide rule. No state of its own, so no client
// directive: the sidebar primitive it renders is the client part.

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
    <Sidebar role="navigation" aria-label="Table of contents" {...props}>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Table of Contents</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {data.navMain.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton render={<Link href={item.url} className="font-medium" />}>
                    {item.title}
                  </SidebarMenuButton>
                  {item.items?.length ? (
                    <SidebarMenuSub>
                      {item.items.map((item) => (
                        <SidebarMenuSubItem key={item.title}>
                          <SidebarMenuSubButton
                            isActive={item.isActive}
                            render={<Link href={item.url} />}
                          >
                            {item.title}
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  ) : null}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
