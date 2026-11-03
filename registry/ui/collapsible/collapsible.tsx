"use client";

import { Collapsible as CollapsiblePrimitive } from "@base-ui/react/collapsible";
import { cn } from "cn";
import { MinusIcon, PlusIcon } from "lucide-react";

// Based on shadcn/ui Collapsible (MIT, https://ui.shadcn.com), base-nova style, fetched
// 2026-11-03. Restyled for mangacn: stock behaviour and markup; `CollapsibleTrigger` gains
// `variant="glyph"`, which adds accordion's + / − ink glyph and flips it when the panel opens.
// The default variant renders the stock trigger unchanged. The panel has no box, so no frame.

/** The glyph trigger: accordion's trigger type and focus ring, the glyph at the end. */
const glyphTrigger =
  "group/collapsible-trigger inline-flex items-center justify-between gap-2 rounded-lg text-left text-sm font-medium outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:text-muted-foreground [&>svg]:pointer-events-none [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-foreground";

function Collapsible({ ...props }: CollapsiblePrimitive.Root.Props) {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />;
}

function CollapsibleTrigger({
  className,
  variant = "default",
  children,
  ...props
}: CollapsiblePrimitive.Trigger.Props & {
  /** `glyph` adds accordion's + / − ink glyph after the children; it flips when open. */
  variant?: "default" | "glyph";
}) {
  if (variant !== "glyph") {
    return (
      <CollapsiblePrimitive.Trigger
        data-slot="collapsible-trigger"
        className={className}
        {...props}
      >
        {children}
      </CollapsiblePrimitive.Trigger>
    );
  }
  return (
    <CollapsiblePrimitive.Trigger
      data-slot="collapsible-trigger"
      className={cn(glyphTrigger, className)}
      {...props}
    >
      {children}
      <PlusIcon data-icon="inline-end" className="group-aria-expanded/collapsible-trigger:hidden" />
      <MinusIcon
        data-icon="inline-end"
        className="hidden group-aria-expanded/collapsible-trigger:inline"
      />
    </CollapsiblePrimitive.Trigger>
  );
}

function CollapsibleContent({ ...props }: CollapsiblePrimitive.Panel.Props) {
  return <CollapsiblePrimitive.Panel data-slot="collapsible-content" {...props} />;
}

export { Collapsible, CollapsibleContent, CollapsibleTrigger };
