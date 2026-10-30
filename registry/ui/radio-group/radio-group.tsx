"use client";

import { Radio as RadioPrimitive } from "@base-ui/react/radio";
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group";
import { cn } from "cn";
import { InkFrame } from "@/components/ink-frame";

// Based on shadcn/ui Radio Group (MIT, https://ui.shadcn.com), base-nova style, fetched
// 2026-10-31. Restyled for mangacn: InkFrame draws each circle; when checked, the indicator
// draws an ink fill with the same seed, so it lands exactly on the outline.

/** One wobble for every radio, so a group reads as one hand. */
const RADIO_SEED = 11;

function RadioGroup({ className, ...props }: RadioGroupPrimitive.Props) {
  return (
    <RadioGroupPrimitive
      data-slot="radio-group"
      className={cn("grid w-full gap-2", className)}
      {...props}
    />
  );
}

function RadioGroupItem({ className, ...props }: RadioPrimitive.Root.Props) {
  return (
    <RadioPrimitive.Root
      data-slot="radio-group-item"
      className={cn(
        "group/radio-group-item peer relative isolate flex aspect-square size-4 shrink-0 rounded-full border-0 outline-none group-has-[:focus-visible]/field-label:ring-0 after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:ring-3 focus-visible:ring-ring/50 data-disabled:cursor-not-allowed data-disabled:opacity-100 data-disabled:halftone-light aria-invalid:ring-3 aria-invalid:ring-destructive/20 aria-invalid:[--ink:var(--destructive)] aria-invalid:aria-checked:[--ink:var(--primary)] dark:aria-invalid:ring-destructive/40 data-checked:bg-primary data-checked:text-primary-foreground dark:data-checked:bg-primary has-[>[data-inked=true]]:bg-transparent!",
        className,
      )}
      {...props}
    >
      <InkFrame
        as="span"
        shape="ellipse"
        // A disabled radio shows its halftone through an unfilled outline.
        fill={props.disabled ? "none" : "paper"}
        seed={RADIO_SEED}
        className="pointer-events-none absolute inset-0 -z-1"
      />
      <RadioPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="flex size-4 items-center justify-center"
      >
        <InkFrame
          as="span"
          shape="ellipse"
          fill={props.disabled ? "tone" : "ink"}
          seed={RADIO_SEED}
          className="pointer-events-none absolute inset-0 -z-1"
        />
        <span className="absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-foreground" />
      </RadioPrimitive.Indicator>
    </RadioPrimitive.Root>
  );
}

export { RadioGroup, RadioGroupItem };
