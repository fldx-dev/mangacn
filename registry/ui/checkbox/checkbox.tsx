"use client";

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";
import { cn } from "cn";
import { CheckIcon } from "lucide-react";
import { InkFrame } from "@/components/ink-frame";

// Based on shadcn/ui Checkbox (MIT, https://ui.shadcn.com), base-nova style, fetched 2026-10-31.
// Restyled for mangacn: InkFrame draws the box; when checked, the indicator draws an ink fill
// with the same seed, so it lands exactly on the outline. Every checkbox shares the seed.

/** One wobble for every checkbox, so a list of them reads as one hand. */
const CHECKBOX_SEED = 7;

function Checkbox({ className, ...props }: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer relative isolate flex size-4 shrink-0 items-center justify-center rounded-[4px] border-0 transition-colors outline-none group-has-disabled/field:opacity-50 group-has-[:focus-visible]/field-label:ring-0 after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:ring-3 focus-visible:ring-ring/50 data-disabled:cursor-not-allowed data-disabled:opacity-100 data-disabled:halftone-light aria-invalid:ring-3 aria-invalid:ring-destructive/20 aria-invalid:[--ink:var(--destructive)] aria-invalid:aria-checked:[--ink:var(--primary)] dark:aria-invalid:ring-destructive/40 data-checked:bg-primary data-checked:text-primary-foreground dark:data-checked:bg-primary has-[>[data-inked=true]]:bg-transparent!",
        className,
      )}
      {...props}
    >
      <InkFrame
        as="span"
        // A disabled box shows its halftone through an unfilled outline.
        fill={props.disabled ? "none" : "paper"}
        seed={CHECKBOX_SEED}
        className="pointer-events-none absolute inset-0 -z-1"
      />
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none [&>svg]:size-3.5"
      >
        <InkFrame
          as="span"
          fill={props.disabled ? "tone" : "ink"}
          seed={CHECKBOX_SEED}
          className="pointer-events-none absolute inset-0 -z-1"
        />
        <CheckIcon />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
