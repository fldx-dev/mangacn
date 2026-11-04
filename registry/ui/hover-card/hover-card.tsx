"use client";

import { PreviewCard as PreviewCardPrimitive } from "@base-ui/react/preview-card";
import { cn } from "cn";
import { InkFrame } from "@/components/ink-frame";

// Based on shadcn/ui Hover Card (MIT, https://ui.shadcn.com), base-nova style, fetched 2026-11-04.
// Restyled for mangacn: the popup is a speech bubble's paper panel without a tail. InkFrame draws
// a round-cornered outline at the heavy outline width; no shadow or ring.

// Corner radius of the drawn outline in px, close to `rounded-2xl` (the CSS fallback) at the
// theme's default radius; it shrinks on a panel too short to hold it.
const CORNER = 16;

/** A rounded rectangle in border-box pixels, clockwise from the top-left corner's end. */
function roundedPanel(width: number, height: number): string {
  const r = Math.min(CORNER, width / 2, height / 2);
  return [
    `M ${r} 0`,
    `L ${width - r} 0`,
    `A ${r} ${r} 0 0 1 ${width} ${r}`,
    `L ${width} ${height - r}`,
    `A ${r} ${r} 0 0 1 ${width - r} ${height}`,
    `L ${r} ${height}`,
    `A ${r} ${r} 0 0 1 0 ${height - r}`,
    `L 0 ${r}`,
    `A ${r} ${r} 0 0 1 ${r} 0`,
    "Z",
  ].join(" ");
}

function HoverCard({ ...props }: PreviewCardPrimitive.Root.Props) {
  return <PreviewCardPrimitive.Root data-slot="hover-card" {...props} />;
}

function HoverCardTrigger({ ...props }: PreviewCardPrimitive.Trigger.Props) {
  return <PreviewCardPrimitive.Trigger data-slot="hover-card-trigger" {...props} />;
}

function HoverCardContent({
  className,
  children,
  side = "bottom",
  sideOffset = 4,
  align = "center",
  alignOffset = 4,
  ...props
}: PreviewCardPrimitive.Popup.Props &
  Pick<PreviewCardPrimitive.Positioner.Props, "align" | "alignOffset" | "side" | "sideOffset">) {
  return (
    <PreviewCardPrimitive.Portal data-slot="hover-card-portal">
      <PreviewCardPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        // The drawing reaches 8 px past the popup; keep that much room from the viewport edge
        // so a card near it does not scroll the page sideways.
        collisionPadding={8}
        className="isolate z-50"
      >
        <PreviewCardPrimitive.Popup
          data-slot="hover-card-content"
          className={cn(
            "relative isolate z-50 w-64 origin-(--transform-origin) rounded-2xl bg-popover p-3 text-sm text-popover-foreground outline-hidden duration-100 has-[>[data-inked=true]]:bg-transparent! data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className,
          )}
          {...props}
        >
          <InkFrame
            as="span"
            outline={roundedPanel}
            className="pointer-events-none absolute inset-0 -z-1 rounded-2xl [--outline-width:var(--outline-width-heavy)]"
          />
          {children}
        </PreviewCardPrimitive.Popup>
      </PreviewCardPrimitive.Positioner>
    </PreviewCardPrimitive.Portal>
  );
}

export { HoverCard, HoverCardContent, HoverCardTrigger };
