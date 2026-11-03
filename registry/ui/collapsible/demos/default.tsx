"use client";

import { Button } from "@/registry/ui/button/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/registry/ui/collapsible/collapsible";

// The stock trigger, drawn by the registry button through `render` (hence "use client").
export default function CollapsibleDefaultDemo() {
  return (
    <Collapsible className="flex w-full max-w-xs flex-col gap-2">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-medium">Chapter 12 has 3 notes</p>
        <CollapsibleTrigger render={<Button variant="outline" size="sm" />}>
          Show all
        </CollapsibleTrigger>
      </div>
      <p className="text-sm">Page 7: speed lines on the jump.</p>
      <CollapsibleContent className="flex flex-col gap-2 text-sm">
        <p>Page 11: tone the night sky.</p>
        <p>Page 18: letter the last balloon.</p>
      </CollapsibleContent>
    </Collapsible>
  );
}
