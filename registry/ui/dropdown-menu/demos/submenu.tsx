"use client";

import { ListPlusIcon, Share2Icon } from "lucide-react";
import { Button } from "@/registry/ui/button/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/registry/ui/dropdown-menu/dropdown-menu";

export default function DropdownMenuSubmenuDemo() {
  return (
    <DropdownMenu defaultOpen>
      <DropdownMenuTrigger render={<Button variant="outline" />}>Series</DropdownMenuTrigger>
      <DropdownMenuContent className="w-40">
        <DropdownMenuSub defaultOpen>
          <DropdownMenuSubTrigger>
            <ListPlusIcon />
            Add to list
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem>Reading</DropdownMenuItem>
            <DropdownMenuItem>Plan to read</DropdownMenuItem>
            <DropdownMenuItem>Completed</DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuItem>
          <Share2Icon />
          Share
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
