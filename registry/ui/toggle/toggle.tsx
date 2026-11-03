"use client";

import { Toggle as TogglePrimitive } from "@base-ui/react/toggle";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import { InkFrame } from "@/components/ink-frame";

// Based on shadcn/ui Toggle (MIT, https://ui.shadcn.com), base-nova style, fetched 2026-11-03.
// Restyled for mangacn: pressed toggles are ink-filled with paper text, like a pressed
// `button`; `outline` draws a paper frame that the ink fill lands on (same seed). The host
// clears its CSS fill only once the matching frame has drawn (`data-fill` in the selector), so
// a `toggle-group` item, which draws no paper frame, keeps its hover fill.

/** One wobble for every toggle, so the ink fill lands exactly on the outline frame. */
const TOGGLE_SEED = 19;

const toggleVariants = cva(
  "group/toggle relative isolate inline-flex items-center justify-center gap-1 rounded-lg border-0 text-sm font-medium whitespace-nowrap transition-all outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-100 disabled:text-muted-foreground disabled:halftone-light aria-invalid:ring-destructive/20 aria-invalid:[--ink:var(--destructive)] aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-pressed:hover:bg-primary/80 aria-pressed:hover:text-primary-foreground aria-pressed:hover:[&>[data-slot=ink-frame]]:opacity-80 aria-pressed:has-[>[data-fill=ink][data-inked=true]]:bg-transparent! data-[state=on]:bg-primary data-[state=on]:text-primary-foreground dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline:
          "bg-background hover:bg-muted hover:[--paper:var(--muted)] has-[>[data-fill=paper][data-inked=true]]:bg-transparent!",
      },
      size: {
        default:
          "h-8 min-w-8 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        sm: "h-7 min-w-7 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 min-w-9 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Toggle({
  className,
  variant = "default",
  size = "default",
  children,
  ...props
}: TogglePrimitive.Props & VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    >
      {variant === "outline" && (
        <InkFrame
          as="span"
          // A disabled toggle shows its halftone through an unfilled outline.
          fill={props.disabled ? "none" : "paper"}
          seed={TOGGLE_SEED}
          className="pointer-events-none absolute inset-0 -z-1"
        />
      )}
      {/* The pressed fill, drawn only while pressed. */}
      <InkFrame
        as="span"
        fill="ink"
        seed={TOGGLE_SEED}
        className="pointer-events-none absolute inset-0 -z-1 hidden group-aria-pressed/toggle:block"
      />
      {children}
    </TogglePrimitive>
  );
}

export { Toggle, toggleVariants };
