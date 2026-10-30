"use client";

import { Switch as SwitchPrimitive } from "@base-ui/react/switch";
import { cn } from "cn";
import { InkFrame } from "@/components/ink-frame";

// Based on shadcn/ui Switch (MIT, https://ui.shadcn.com), base-nova style, fetched 2026-10-31.
// Restyled for mangacn: InkFrame draws the track (tone, ink once checked) and the thumb, a
// paper disc with an ink outline. The track takes the frame's corners instead of stock's pill,
// so the halftone and focus ring follow the drawing. Every switch shares the seeds.

/** One wobble for every switch track and thumb. */
const SWITCH_SEED = 13;

function Switch({
  className,
  size = "default",
  ...props
}: SwitchPrimitive.Root.Props & {
  size?: "sm" | "default";
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        // The track frame fills with `--tone-2`; checked tracks point it at ink.
        "peer group/switch relative isolate inline-flex shrink-0 items-center rounded-[var(--radius)] border-0 p-px transition-all outline-none group-has-[:focus-visible]/field-label:ring-0 after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:ring-3 aria-invalid:ring-destructive/20 aria-invalid:[--ink:var(--destructive)] data-[size=default]:h-[18.4px] data-[size=default]:w-[32px] data-[size=sm]:h-[14px] data-[size=sm]:w-[24px] dark:aria-invalid:ring-destructive/40 data-checked:bg-primary data-checked:[--tone-2:var(--ink)] data-unchecked:bg-input dark:data-unchecked:bg-input/80 data-disabled:cursor-not-allowed data-disabled:opacity-100 data-disabled:halftone-light has-[>[data-inked=true]]:bg-transparent!",
        className,
      )}
      {...props}
    >
      <InkFrame
        as="span"
        // A disabled track shows its halftone through an unfilled outline.
        fill={props.disabled ? "none" : "tone"}
        seed={SWITCH_SEED}
        className="pointer-events-none absolute inset-0 -z-1"
      />
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none relative isolate block rounded-full bg-background ring-0 transition-transform group-data-[size=default]/switch:size-4 group-data-[size=sm]/switch:size-3 group-data-[size=default]/switch:data-checked:translate-x-[calc(100%-2px)] group-data-[size=sm]/switch:data-checked:translate-x-[calc(100%-2px)] group-data-[size=default]/switch:data-unchecked:translate-x-0 group-data-[size=sm]/switch:data-unchecked:translate-x-0 has-[>[data-inked=true]]:bg-transparent!"
      >
        <InkFrame
          as="span"
          shape="ellipse"
          fill="paper"
          seed={SWITCH_SEED + 1}
          className="pointer-events-none absolute inset-0 -z-1"
        />
      </SwitchPrimitive.Thumb>
    </SwitchPrimitive.Root>
  );
}

export { Switch };
