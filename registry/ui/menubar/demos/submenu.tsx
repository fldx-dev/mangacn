"use client";

import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from "@/registry/ui/menubar/menubar";

export default function MenubarSubmenuDemo() {
  return (
    <div className="flex min-h-72 w-full justify-center">
      <Menubar>
        <MenubarMenu defaultOpen>
          <MenubarTrigger>Series</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Follow</MenubarItem>
            <MenubarSub defaultOpen>
              <MenubarSubTrigger>Add to list</MenubarSubTrigger>
              <MenubarSubContent>
                <MenubarItem>Reading</MenubarItem>
                <MenubarItem>Plan to read</MenubarItem>
                <MenubarItem>Completed</MenubarItem>
              </MenubarSubContent>
            </MenubarSub>
            <MenubarSeparator />
            <MenubarItem>Share</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger>Chapter</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Previous</MenubarItem>
            <MenubarItem>Next</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </div>
  );
}
