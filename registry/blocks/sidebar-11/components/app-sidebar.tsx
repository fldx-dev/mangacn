"use client";

import { ChevronRightIcon, FileIcon, FolderIcon } from "lucide-react";
import type * as React from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarRail,
} from "@/components/ui/sidebar";

// Based on shadcn/ui sidebar-11 (MIT, https://ui.shadcn.com), base-nova style, fetched 2026-11-18.
// Stock's file tree with a manga chapter's working files in stock's shape: the changed files with
// their state, then the folders, the open page marked active. Each file is a list item (stock
// leaves the tree's files bare in the list), and each folder's chevron turns as it opens (stock's
// selector reads Radix's data-state; Base UI's trigger says aria-expanded).

// This is sample data.
const data = {
  changes: [
    {
      file: "script.md",
      state: "M",
    },
    {
      file: "pages/p07.clip",
      state: "U",
    },
    {
      file: "lettering/sfx.txt",
      state: "M",
    },
  ],
  tree: [
    [
      "chapter-12",
      ["pages", ["roughs", ["p01.png"]], "p01.clip", "p02.clip", ["inks", ["p01.png"]]],
      "script.md",
      "thumbnails.pdf",
    ],
    ["lettering", ["fonts", "anime-ace.otf", "wild-words.otf"], "dialogue.txt", "sfx.txt"],
    ["tones", ["halftone-60.png"]],
    ["covers", "volume-03.psd", "colour.psd"],
    "series-bible.md",
    "characters.md",
    "style-guide.pdf",
    "schedule.csv",
    "contract.pdf",
    "README.md",
  ],
};

// The sidebar is the page's navigation landmark, named, so nothing on the page sits outside one
// (the inset beside it is the `main`); on a phone it is the sheet, a dialog named "Sidebar".
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar role="navigation" aria-label="Chapter files" {...props}>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Changes</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {data.changes.map((item) => (
                <SidebarMenuItem key={item.file}>
                  <SidebarMenuButton>
                    <FileIcon />
                    {item.file}
                  </SidebarMenuButton>
                  <SidebarMenuBadge>{item.state}</SidebarMenuBadge>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Files</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {data.tree.map((item) => (
                <Tree key={treeKey(item)} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}

type TreeItem = string | TreeItem[];

/** A file's or folder's name, unique among its siblings, as its key. */
function treeKey(item: TreeItem): string {
  const [name] = Array.isArray(item) ? item : [item];
  return typeof name === "string" ? name : "";
}

function Tree({ item }: { item: TreeItem }) {
  const [name, ...items] = Array.isArray(item) ? item : [item];
  if (!items.length) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton isActive={name === "p02.clip"}>
          <FileIcon />
          {name}
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }
  return (
    <SidebarMenuItem>
      <Collapsible
        className="group/collapsible [&>button[aria-expanded=true]>svg:first-child]:rotate-90"
        defaultOpen={name === "chapter-12" || name === "pages"}
      >
        <SidebarMenuButton render={<CollapsibleTrigger />}>
          <ChevronRightIcon className="transition-transform" />
          <FolderIcon />
          {name}
        </SidebarMenuButton>
        <CollapsibleContent>
          <SidebarMenuSub>
            {items.map((subItem) => (
              <Tree key={treeKey(subItem)} item={subItem} />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  );
}
