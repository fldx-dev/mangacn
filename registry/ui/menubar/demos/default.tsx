"use client";

import {
  Menubar,
  MenubarContent,
  MenubarGroup,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from "@/registry/ui/menubar/menubar";

export default function MenubarDefaultDemo() {
  return (
    <div className="flex min-h-72 w-full justify-center">
      <Menubar>
        <MenubarMenu defaultOpen>
          <MenubarTrigger>Series</MenubarTrigger>
          <MenubarContent>
            <MenubarGroup>
              <MenubarItem>
                Follow
                <MenubarShortcut>F</MenubarShortcut>
              </MenubarItem>
              <MenubarItem>
                Rate
                <MenubarShortcut>R</MenubarShortcut>
              </MenubarItem>
              <MenubarItem>Share</MenubarItem>
            </MenubarGroup>
            <MenubarSeparator />
            <MenubarItem variant="destructive">Report</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger>Chapter</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>
              Previous
              <MenubarShortcut>←</MenubarShortcut>
            </MenubarItem>
            <MenubarItem>
              Next
              <MenubarShortcut>→</MenubarShortcut>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger>View</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Fit width</MenubarItem>
            <MenubarItem>Fit height</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </div>
  );
}
