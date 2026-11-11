"use client";

import {
  BookOpenIcon,
  FileTextIcon,
  LayoutGridIcon,
  MessageSquareIcon,
  SettingsIcon,
  TypeIcon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/registry/ui/sidebar/sidebar";

const tools = [
  { title: "Pages", icon: FileTextIcon, active: true },
  { title: "Panels", icon: LayoutGridIcon },
  { title: "Balloons", icon: MessageSquareIcon },
  { title: "Lettering", icon: TypeIcon },
];

// collapsible="icon" folds to a strip of icons; each row names itself in a tooltip while folded.
// Starts folded here (defaultOpen={false}); the trigger, the rail or Ctrl+B (⌘B) unfolds it.
export default function SidebarCollapsibleIconsDemo() {
  return (
    <SidebarProvider defaultOpen={false} className="fixed inset-0">
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Studio">
                <BookOpenIcon />
                <span className="font-display text-base tracking-wide">Studio</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Chapter 12</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {tools.map((tool) => (
                  <SidebarMenuItem key={tool.title}>
                    <SidebarMenuButton isActive={tool.active} tooltip={tool.title}>
                      <tool.icon />
                      <span>{tool.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Settings">
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
          <span className="text-sm font-medium">Pages</span>
        </div>
        <div className="flex flex-col gap-2 px-4 pb-4">
          <h3 className="font-display text-xl tracking-wide">Page 7 of 24</h3>
          <p className="max-w-prose text-sm text-muted-foreground">
            The tools fold to icons so the page gets the room; hover one to read its name.
          </p>
        </div>
      </div>
    </SidebarProvider>
  );
}
