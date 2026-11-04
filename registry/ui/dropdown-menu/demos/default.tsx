"use client";

import { BookmarkIcon, DownloadIcon, FlagIcon, Share2Icon } from "lucide-react";
import { Button } from "@/registry/ui/button/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/registry/ui/dropdown-menu/dropdown-menu";

export default function DropdownMenuDefaultDemo() {
  return (
    <DropdownMenu defaultOpen>
      <DropdownMenuTrigger render={<Button variant="outline" />}>Chapter 12</DropdownMenuTrigger>
      <DropdownMenuContent className="w-48">
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <BookmarkIcon />
            Bookmark
            <DropdownMenuShortcut>B</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Share2Icon />
            Share
          </DropdownMenuItem>
          <DropdownMenuItem>
            <DownloadIcon />
            Download
            <DropdownMenuShortcut>D</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">
          <FlagIcon />
          Report
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
