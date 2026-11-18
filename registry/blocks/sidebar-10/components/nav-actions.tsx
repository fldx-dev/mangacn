"use client";

import {
  ArrowDownIcon,
  ArrowUpIcon,
  BellIcon,
  ChartLineIcon,
  CopyIcon,
  CornerUpLeftIcon,
  CornerUpRightIcon,
  FileTextIcon,
  GalleryVerticalEndIcon,
  LinkIcon,
  MoreHorizontalIcon,
  Settings2Icon,
  StarIcon,
  Trash2Icon,
  TrashIcon,
} from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";

// Based on shadcn/ui sidebar-10 (MIT, https://ui.shadcn.com), base-nova style, fetched 2026-11-18.
// The note's actions in the header: the last edit, a star and a popover of page actions in a
// sidebar's menus, groups parted by the sidebar's separator where stock rules them. Stock opens
// the popover as the page loads; here it opens from its button, so the page loads with focus
// where the reader left it. The two icon buttons are named.

const data = [
  [
    {
      label: "Customize Page",
      icon: <Settings2Icon />,
    },
    {
      label: "Turn into wiki",
      icon: <FileTextIcon />,
    },
  ],
  [
    {
      label: "Copy Link",
      icon: <LinkIcon />,
    },
    {
      label: "Duplicate",
      icon: <CopyIcon />,
    },
    {
      label: "Move to",
      icon: <CornerUpRightIcon />,
    },
    {
      label: "Move to Trash",
      icon: <Trash2Icon />,
    },
  ],
  [
    {
      label: "Undo",
      icon: <CornerUpLeftIcon />,
    },
    {
      label: "View analytics",
      icon: <ChartLineIcon />,
    },
    {
      label: "Version History",
      icon: <GalleryVerticalEndIcon />,
    },
    {
      label: "Show delete pages",
      icon: <TrashIcon />,
    },
    {
      label: "Notifications",
      icon: <BellIcon />,
    },
  ],
  [
    {
      label: "Import",
      icon: <ArrowUpIcon />,
    },
    {
      label: "Export",
      icon: <ArrowDownIcon />,
    },
  ],
];

export function NavActions() {
  const [isOpen, setIsOpen] = React.useState(false);
  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="hidden font-medium text-muted-foreground md:inline-block">Edit Oct 08</div>
      <Button variant="ghost" size="icon" className="h-7 w-7">
        <StarIcon />
        <span className="sr-only">Add to favorites</span>
      </Button>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger render={<Button variant="ghost" size="icon" className="h-7 w-7" />}>
          <MoreHorizontalIcon />
          <span className="sr-only">Page actions</span>
        </PopoverTrigger>
        <PopoverContent className="w-56 overflow-hidden p-0" align="end">
          <Sidebar collapsible="none" className="bg-transparent">
            <SidebarContent>
              {data.map((group, index) => (
                <React.Fragment key={group[0]?.label}>
                  {index > 0 ? <SidebarSeparator className="mx-0" /> : null}
                  <SidebarGroup>
                    <SidebarGroupContent className="gap-0">
                      <SidebarMenu>
                        {group.map((item) => (
                          <SidebarMenuItem key={item.label}>
                            <SidebarMenuButton>
                              {item.icon} <span>{item.label}</span>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                </React.Fragment>
              ))}
            </SidebarContent>
          </Sidebar>
        </PopoverContent>
      </Popover>
    </div>
  );
}
