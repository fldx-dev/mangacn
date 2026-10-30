"use client";

import { BookmarkIcon } from "lucide-react";
import { Button } from "@/registry/ui/button/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/registry/ui/tooltip/tooltip";

export default function TooltipDefaultDemo() {
  return (
    <Tooltip defaultOpen>
      <TooltipTrigger render={<Button variant="outline" size="icon" aria-label="Bookmark page" />}>
        <BookmarkIcon />
      </TooltipTrigger>
      <TooltipContent>Bookmark this page</TooltipContent>
    </Tooltip>
  );
}
