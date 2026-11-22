"use client";

import { BookmarkIcon, ChevronLeftIcon, ChevronRightIcon, MaximizeIcon } from "lucide-react";
import { Button } from "@/registry/ui/button/button";
import { ButtonGroup } from "@/registry/ui/button-group/button-group";
import { Kbd } from "@/registry/ui/kbd/kbd";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/registry/ui/tooltip/tooltip";

// Pages turn right to left, so the left arrow is the next page.
const tools = [
  { label: "Next page", key: "←", icon: ChevronLeftIcon },
  { label: "Previous page", key: "→", icon: ChevronRightIcon },
  { label: "Bookmark", key: "B", icon: BookmarkIcon, open: true },
  { label: "Full screen", key: "F", icon: MaximizeIcon },
];

export default function TooltipReaderToolbarVariant() {
  return (
    <TooltipProvider>
      <ButtonGroup aria-label="Reader controls">
        {tools.map(({ label, key, icon: Icon, open }) => (
          <Tooltip key={label} defaultOpen={open}>
            <TooltipTrigger render={<Button variant="ghost" size="icon" aria-label={label} />}>
              <Icon />
            </TooltipTrigger>
            <TooltipContent>
              {label} <Kbd>{key}</Kbd>
            </TooltipContent>
          </Tooltip>
        ))}
      </ButtonGroup>
    </TooltipProvider>
  );
}
