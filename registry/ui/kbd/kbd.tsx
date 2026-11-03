import { cn } from "cn";
import { InkFrame } from "@/components/ink-frame";

// Based on shadcn/ui Kbd (MIT, https://ui.shadcn.com), base-nova style, fetched 2026-11-03.
// Restyled for mangacn with `badge`'s caption-box label look: square corners, display face at
// 11 px, uppercase, a hand-drawn paper key cap with ink text. Inside a tooltip (an ink popup)
// the key cap swaps to ink with a paper outline and paper text.

function Kbd({ className, children, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "pointer-events-none relative isolate inline-flex h-5.5 w-fit min-w-5.5 items-center justify-center gap-1 rounded-sm border-0 bg-paper px-1.5 font-display text-[11px] leading-none tracking-widest text-ink uppercase select-none has-[>[data-inked=true]]:bg-transparent! in-data-[slot=tooltip-content]:bg-background/20 in-data-[slot=tooltip-content]:text-background in-data-[slot=tooltip-content]:[--ink:var(--background)] in-data-[slot=tooltip-content]:[--paper:var(--foreground)] [&_svg:not([class*='size-'])]:size-3",
        className,
      )}
      {...props}
    >
      <InkFrame as="span" fill="paper" className="pointer-events-none absolute inset-0 -z-1" />
      {children}
    </kbd>
  );
}

function KbdGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <kbd
      data-slot="kbd-group"
      className={cn("inline-flex items-center gap-1", className)}
      {...props}
    />
  );
}

export { Kbd, KbdGroup };
