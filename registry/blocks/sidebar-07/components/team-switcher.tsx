"use client";

import { ChevronsUpDownIcon, PlusIcon } from "lucide-react";
import * as React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

// Based on shadcn/ui sidebar-07 (MIT, https://ui.shadcn.com), base-nova style, fetched 2026-11-12.
// The studio switcher. Where stock fills a square and boxes each logo, a team's logo sits in an
// avatar's inked circle, so the avatar draws it.

export function TeamSwitcher({
  teams,
}: {
  teams: {
    name: string;
    logo: React.ReactNode;
    plan: string;
  }[];
}) {
  const { isMobile } = useSidebar();
  // The chosen team by name, so a new `teams` list (loaded late, or changed) keeps a team that is
  // in it: the chosen one while it is listed, else the first.
  const [activeName, setActiveName] = React.useState(teams[0]?.name);
  const activeTeam = teams.find((team) => team.name === activeName) ?? teams[0];
  if (!activeTeam) {
    return null;
  }
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger render={<SidebarMenuButton size="lg" />}>
            <Avatar>
              <AvatarFallback>{activeTeam.logo}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{activeTeam.name}</span>
              <span className="truncate text-xs">{activeTeam.plan}</span>
            </div>
            <ChevronsUpDownIcon className="ml-auto" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-fit"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs text-muted-foreground">Teams</DropdownMenuLabel>
              {teams.map((team, index) => (
                <DropdownMenuItem
                  key={team.name}
                  onClick={() => setActiveName(team.name)}
                  className="gap-2 p-2"
                >
                  <Avatar size="sm">
                    <AvatarFallback>{team.logo}</AvatarFallback>
                  </Avatar>
                  {team.name}
                  <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem className="gap-2 p-2">
                <Avatar size="sm">
                  <AvatarFallback>
                    <PlusIcon className="size-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="font-medium text-muted-foreground">Add team</div>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
