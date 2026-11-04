"use client";

import { Button } from "@/registry/ui/button/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/registry/ui/dropdown-menu/dropdown-menu";

export default function DropdownMenuCheckboxesAndRadioDemo() {
  return (
    <DropdownMenu defaultOpen>
      <DropdownMenuTrigger render={<Button variant="outline" />}>
        Reader settings
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Reading direction</DropdownMenuLabel>
          <DropdownMenuRadioGroup defaultValue="rtl">
            <DropdownMenuRadioItem value="rtl">Right to left</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="ltr">Left to right</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="vertical">Vertical scroll</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>Text</DropdownMenuLabel>
          <DropdownMenuCheckboxItem defaultChecked>
            Furigana <span lang="ja">ふりがな</span>
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem>Translator notes</DropdownMenuCheckboxItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
