"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/registry/ui/tooltip/tooltip";

const title = "Rooftop Runners: The Night the Whole City Raced Across Its Own Skyline";

export default function TooltipTruncatedTitleVariant() {
  return (
    <div className="grid w-full max-w-56 gap-1 text-sm">
      <p className="text-muted-foreground">Continue reading</p>
      <Tooltip defaultOpen>
        <TooltipTrigger
          render={
            <a
              href="#series"
              className="block truncate font-medium underline-offset-4 hover:underline"
            />
          }
        >
          {title}
        </TooltipTrigger>
        <TooltipContent side="bottom">{title}</TooltipContent>
      </Tooltip>
    </div>
  );
}
