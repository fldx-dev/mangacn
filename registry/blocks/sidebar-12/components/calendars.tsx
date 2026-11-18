"use client";

import { ChevronRightIcon, SquareCheckIcon, SquareIcon } from "lucide-react";
import * as React from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";

// Based on shadcn/ui sidebar-12 (MIT, https://ui.shadcn.com), base-nova style, fetched 2026-11-18.
// The studio's calendars, one collapsible group each, the first open. Where stock draws a filled
// box with a check for the calendars shown, a ticked or empty square icon marks them.

export function Calendars({
  calendars,
}: {
  calendars: {
    name: string;
    items: string[];
  }[];
}) {
  return (
    <>
      {calendars.map((calendar, index) => (
        <React.Fragment key={calendar.name}>
          <SidebarGroup key={calendar.name}>
            <Collapsible defaultOpen={index === 0} className="group/collapsible">
              <SidebarGroupLabel
                className="group/label w-full text-sm text-sidebar-foreground"
                render={<CollapsibleTrigger />}
              >
                {calendar.name}{" "}
                <ChevronRightIcon className="ml-auto transition-transform group-data-open/collapsible:rotate-90" />
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {calendar.items.map((item, index) => (
                      <SidebarMenuItem key={item}>
                        <SidebarMenuButton>
                          {index < 2 ? <SquareCheckIcon /> : <SquareIcon />}
                          {item}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </Collapsible>
          </SidebarGroup>
          <SidebarSeparator className="mx-0" />
        </React.Fragment>
      ))}
    </>
  );
}
