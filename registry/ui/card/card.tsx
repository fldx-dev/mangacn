import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import type * as React from "react";
import { InkFrame, type InkFrameProps } from "@/components/ink-frame";

// Based on shadcn/ui Card (MIT, https://ui.shadcn.com), base-nova style, fetched 2026-10-31.
// Restyled for mangacn: InkFrame draws the outline and paper fill instead of the hairline ring;
// an optional `shadow` adds a solid or hatched ink shadow. No overflow clipping, so the drawing
// can reach past the box. The frame is the first child, so a top image is `nth-child(2)`.

const cardVariants = cva(
  "group/card relative isolate flex flex-col gap-(--card-spacing) rounded-xl bg-card py-(--card-spacing) text-sm text-card-foreground [--card-spacing:--spacing(4)] has-data-[slot=card-footer]:pb-0 has-[>[data-slot=ink-frame]+img]:pt-0 has-[>[data-inked=true]]:bg-transparent! data-[size=sm]:[--card-spacing:--spacing(3)] data-[size=sm]:has-data-[slot=card-footer]:pb-0 *:[img:nth-child(2)]:rounded-t-xl *:[img:last-child]:rounded-b-xl",
  {
    variants: {
      shadow: {
        none: "",
        ink: "",
        hatch: "",
      },
    },
    defaultVariants: {
      shadow: "none",
    },
  },
);

/** The InkFrame shadow each `shadow` value draws. */
const frameShadows: Record<string, InkFrameProps["shadow"]> = {
  none: "none",
  ink: "solid",
  hatch: "hatch",
};

function Card({
  className,
  size = "default",
  shadow = "none",
  children,
  ...props
}: React.ComponentProps<"div"> & { size?: "default" | "sm" } & VariantProps<typeof cardVariants>) {
  return (
    <div
      data-slot="card"
      data-size={size}
      data-shadow={shadow}
      className={cn(cardVariants({ shadow }), className)}
      {...props}
    >
      <InkFrame
        as="span"
        fill="paper"
        shadow={frameShadows[shadow ?? "none"]}
        className="pointer-events-none absolute inset-0 -z-1 rounded-xl"
      />
      {children}
    </div>
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "group/card-header @container/card-header grid auto-rows-min items-start gap-1 rounded-t-xl px-(--card-spacing) has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-(--card-spacing)",
        className,
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "font-heading text-base leading-snug font-medium group-data-[size=sm]/card:text-sm",
        className,
      )}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn("col-start-2 row-span-2 row-start-1 self-start justify-self-end", className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="card-content" className={cn("px-(--card-spacing)", className)} {...props} />
  );
}

function CardFooter({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "relative isolate flex items-center rounded-b-xl border-0 bg-muted/50 p-(--card-spacing)",
        className,
      )}
      {...props}
    >
      <InkFrame
        as="span"
        shape="line"
        fill="none"
        className="pointer-events-none absolute inset-x-0 top-0 -z-1 h-(--outline-width)"
      />
      {children}
    </div>
  );
}

export { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
