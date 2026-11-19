"use client";

import {
  BellIcon,
  BookOpenIcon,
  CheckIcon,
  DownloadIcon,
  GlobeIcon,
  HomeIcon,
  KeyboardIcon,
  LibraryIcon,
  LinkIcon,
  LockIcon,
  PaintbrushIcon,
  SettingsIcon,
} from "lucide-react";
import * as React from "react";
import { Panel } from "@/components/panel";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";

// Based on shadcn/ui sidebar-13 (MIT, https://ui.shadcn.com), base-nova style, fetched 2026-11-18.
// A manga reader's settings in a dialog, with stock's sections in a sidebar that does not
// collapse and shows from md up, as stock's does. Three changes for one page, one `main`: the
// dialog opens from the page's button rather than on load, its content column is a <div> where
// stock nests a second <main>, and the sidebar is a navigation landmark named for the settings.
// The sidebar lets the dialog's paper through, so its ink frame shows all round; where stock
// leaves grey boxes, the section is blank manga panels.

const data = {
  nav: [
    { name: "Notifications", icon: <BellIcon /> },
    { name: "Library", icon: <LibraryIcon /> },
    { name: "Home", icon: <HomeIcon /> },
    { name: "Appearance", icon: <PaintbrushIcon /> },
    { name: "Reading & pages", icon: <BookOpenIcon /> },
    { name: "Language & region", icon: <GlobeIcon /> },
    { name: "Accessibility", icon: <KeyboardIcon /> },
    { name: "Mark as read", icon: <CheckIcon /> },
    { name: "Downloads", icon: <DownloadIcon /> },
    { name: "Connected accounts", icon: <LinkIcon /> },
    { name: "Privacy & visibility", icon: <LockIcon /> },
    { name: "Advanced", icon: <SettingsIcon /> },
  ],
};

const TONES = ["halftone", "lines", "cross", "none"] as const;

export function SettingsDialog() {
  const [open, setOpen] = React.useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>Open Dialog</DialogTrigger>
      <DialogContent className="overflow-hidden p-0 md:max-h-[500px] md:max-w-[700px] lg:max-w-[800px]">
        <DialogTitle className="sr-only">Settings</DialogTitle>
        <DialogDescription className="sr-only">Customize your settings here.</DialogDescription>
        <SidebarProvider className="items-start">
          <Sidebar
            collapsible="none"
            role="navigation"
            aria-label="Settings sections"
            className="hidden bg-transparent md:flex"
          >
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {data.nav.map((item) => (
                      <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton
                          isActive={item.name === "Reading & pages"}
                          render={<a href="#settings" />}
                        >
                          {item.icon}
                          <span>{item.name}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
          <div className="flex h-[480px] flex-1 flex-col overflow-hidden">
            <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
              <div className="flex items-center gap-2 px-4">
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink href="#settings">Settings</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem>
                      <BreadcrumbPage>Reading & pages</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            </header>
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 pt-0">
              {Array.from({ length: 10 }, (_, i) => (
                <Panel
                  // biome-ignore lint/suspicious/noArrayIndexKey: ten blank panels, never reordered.
                  key={i}
                  as="div"
                  tone={TONES[i % TONES.length]}
                  className="aspect-video max-w-3xl"
                />
              ))}
            </div>
          </div>
        </SidebarProvider>
      </DialogContent>
    </Dialog>
  );
}
