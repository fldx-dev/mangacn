"use client";

import { BookOpenIcon, ClockIcon, HeartIcon, HomeIcon, SettingsIcon } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/registry/ui/sidebar/sidebar";

const library = [
  { title: "Home", icon: HomeIcon, active: true },
  { title: "Following", icon: HeartIcon, badge: "12" },
  { title: "History", icon: ClockIcon },
];

// The sidebar fills the window it lives in. In an app the page beside it is a <SidebarInset>
// (a <main>); here the stage around the demo is already the page's main, so a <div> stands in.
export default function SidebarDefaultDemo() {
  return (
    <SidebarProvider className="fixed inset-0">
      <Sidebar>
        <SidebarHeader>
          <span className="px-2 py-1 font-display text-lg tracking-wide">Ink Reader</span>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Library</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {library.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={item.active}
                      aria-current={item.active ? "page" : undefined}
                      render={<a href="#library" />}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                    {item.badge && <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>Reading</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton render={<a href="#series" />}>
                    <BookOpenIcon />
                    <span>Ronin Nights</span>
                  </SidebarMenuButton>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton href="#chapter-12">Chapter 12</SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton href="#chapter-13">Chapter 13</SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton render={<a href="#settings" />}>
                <SettingsIcon />
                <span>Settings</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-12 shrink-0 items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <span className="text-sm font-medium">Home</span>
        </div>
        <div className="flex flex-col gap-2 px-4 pb-4">
          <h3 className="font-display text-xl tracking-wide">Continue reading</h3>
          <p className="max-w-prose text-sm text-muted-foreground">
            Ronin Nights, chapter 12: the bridge at dawn. Ctrl+B (⌘B) folds the sidebar away.
          </p>
        </div>
      </div>
    </SidebarProvider>
  );
}
