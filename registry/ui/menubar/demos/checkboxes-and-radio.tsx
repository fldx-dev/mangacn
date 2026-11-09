"use client";

import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarGroup,
  MenubarItem,
  MenubarLabel,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarTrigger,
} from "@/registry/ui/menubar/menubar";

export default function MenubarCheckboxesAndRadioDemo() {
  return (
    <div className="flex min-h-80 w-full justify-center">
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>Series</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Follow</MenubarItem>
            <MenubarItem>Share</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu defaultOpen>
          <MenubarTrigger>View</MenubarTrigger>
          <MenubarContent className="w-56">
            <MenubarGroup>
              <MenubarLabel>Reading direction</MenubarLabel>
              <MenubarRadioGroup defaultValue="rtl">
                <MenubarRadioItem value="rtl">Right to left</MenubarRadioItem>
                <MenubarRadioItem value="ltr">Left to right</MenubarRadioItem>
                <MenubarRadioItem value="vertical">Vertical scroll</MenubarRadioItem>
              </MenubarRadioGroup>
            </MenubarGroup>
            <MenubarSeparator />
            <MenubarGroup>
              <MenubarLabel>Text</MenubarLabel>
              <MenubarCheckboxItem defaultChecked>
                Furigana <span lang="ja">ふりがな</span>
              </MenubarCheckboxItem>
              <MenubarCheckboxItem>SFX translations</MenubarCheckboxItem>
            </MenubarGroup>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger>Help</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Shortcuts</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </div>
  );
}
