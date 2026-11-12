import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import type * as React from "react";
import { InkFrame } from "@/components/ink-frame";
import { Button } from "@/components/ui/button";

// Based on shadcn/ui Attachment (MIT, https://ui.shadcn.com), base-nova style, fetched
// 2026-11-12. Restyled for mangacn: an outlined paper card drawn by an InkFrame (its first child),
// dashed while `idle`, outlined in spot on `error`; AttachmentMedia in a thinner ink frame over
// its picture or icon. Where stock shimmers the title while uploading or processing, the preview
// pulses instead (text that fades fails contrast mid-pulse); it stands still under reduced motion. Actions are mangacn's icon button. The group scrolls without a
// gradient fade and keeps room for the drawings, which reach past each card.

const attachmentVariants = cva(
  "group/attachment relative isolate flex w-fit max-w-full min-w-0 shrink-0 flex-wrap rounded-xl border-0 bg-card text-card-foreground transition-colors focus-within:ring-1 focus-within:ring-ring/50 has-[>[data-inked=true]]:bg-transparent! has-[>a,>button]:hover:[--paper:var(--muted)]",
  {
    variants: {
      size: {
        default:
          "gap-2 text-sm has-data-[slot=attachment-content]:px-2.5 has-data-[slot=attachment-content]:py-2 has-data-[slot=attachment-media]:p-2",
        sm: "gap-2.5 text-xs has-data-[slot=attachment-content]:px-2 has-data-[slot=attachment-content]:py-1.5 has-data-[slot=attachment-media]:p-1.5",
        xs: "gap-1.5 rounded-lg text-xs has-data-[slot=attachment-content]:px-1.5 has-data-[slot=attachment-content]:py-1 has-data-[slot=attachment-media]:p-1",
      },
      orientation: {
        horizontal: "min-w-40 items-center",
        vertical: "w-24 flex-col has-data-[slot=attachment-content]:w-30",
      },
    },
  },
);

function Attachment({
  className,
  state = "done",
  size = "default",
  orientation = "horizontal",
  children,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof attachmentVariants> & {
    state?: "idle" | "uploading" | "processing" | "error" | "done";
  }) {
  return (
    <div
      data-slot="attachment"
      data-state={state}
      data-size={size}
      data-orientation={orientation}
      className={cn(attachmentVariants({ size, orientation }), className)}
      {...props}
    >
      <InkFrame
        as="span"
        fill="paper"
        // Idle (not sent yet) in the pen's dashed style; an error outlined in spot.
        dashed={state === "idle"}
        className={cn(
          "pointer-events-none absolute inset-0 -z-1",
          state === "error" && "[--ink:var(--spot)]",
        )}
      />
      {children}
    </div>
  );
}

const attachmentMediaVariants = cva(
  "relative isolate flex aspect-square w-10 shrink-0 group-data-[state=processing]/attachment:motion-safe:animate-pulse group-data-[state=uploading]/attachment:motion-safe:animate-pulse items-center justify-center rounded-lg text-foreground group-data-[orientation=vertical]/attachment:w-full group-data-[size=sm]/attachment:w-8 group-data-[size=xs]/attachment:w-7 group-data-[size=xs]/attachment:rounded-md group-data-[state=error]/attachment:text-destructive group-data-[orientation=vertical]/attachment:*:data-[slot=spinner]:size-6! [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 group-data-[orientation=vertical]/attachment:[&_svg:not([class*='size-'])]:size-6 group-data-[size=xs]/attachment:[&_svg:not([class*='size-'])]:size-3.5",
  {
    variants: {
      variant: {
        icon: "",
        image:
          "opacity-60 group-data-[state=done]/attachment:opacity-100 group-data-[state=idle]/attachment:opacity-100 *:[img]:aspect-square *:[img]:w-full *:[img]:object-cover",
      },
    },
    defaultVariants: {
      variant: "icon",
    },
  },
);

function AttachmentMedia({
  className,
  variant = "icon",
  children,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof attachmentMediaVariants>) {
  return (
    <div
      data-slot="attachment-media"
      data-variant={variant}
      className={cn(attachmentMediaVariants({ variant }), className)}
      {...props}
    >
      {children}
      {/* Last and over the picture, as avatar's ring is; a thinner pen than the card's. */}
      <InkFrame
        as="span"
        fill="none"
        className="pointer-events-none absolute inset-0 z-1 [--outline-width:calc(var(--outline-width)*0.7)]"
      />
    </div>
  );
}

function AttachmentContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="attachment-content"
      className={cn(
        "max-w-full min-w-0 flex-1 leading-tight group-data-[orientation=vertical]/attachment:px-1",
        className,
      )}
      {...props}
    />
  );
}

function AttachmentTitle({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="attachment-title"
      className={cn("block max-w-full min-w-0 truncate font-medium", className)}
      {...props}
    />
  );
}

function AttachmentDescription({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="attachment-description"
      className={cn(
        "mt-0.5 block min-w-0 truncate text-xs text-muted-foreground group-data-[state=error]/attachment:text-destructive",
        "max-w-full",
        className,
      )}
      {...props}
    />
  );
}

function AttachmentActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="attachment-actions"
      className={cn(
        "relative z-20 flex shrink-0 items-center group-data-[orientation=vertical]/attachment:absolute group-data-[orientation=vertical]/attachment:top-3 group-data-[orientation=vertical]/attachment:right-3 group-data-[orientation=vertical]/attachment:gap-1",
        className,
      )}
      {...props}
    />
  );
}

function AttachmentAction({
  className,
  variant,
  size = "icon-xs",
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      data-slot="attachment-action"
      variant={variant ?? "ghost"}
      size={size}
      className={cn(className)}
      {...props}
    />
  );
}

function AttachmentTrigger({
  className,
  render,
  type,
  ...props
}: useRender.ComponentProps<"button">) {
  return useRender({
    defaultTagName: "button",
    props: mergeProps<"button">(
      {
        type: render ? type : (type ?? "button"),
        className: cn("absolute inset-0 z-10 outline-none", className),
      },
      props,
    ),
    render,
    state: {
      slot: "attachment-trigger",
    },
  });
}

function AttachmentGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="attachment-group"
      className={cn(
        "flex min-w-0 snap-x snap-mandatory scroll-px-2 gap-3 overflow-x-auto overscroll-x-contain p-2 [scrollbar-width:none] *:data-[slot=attachment]:flex-none *:data-[slot=attachment]:snap-start",
        className,
      )}
      {...props}
    />
  );
}

export {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
};
