import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import type * as React from "react";
import { InkFrame } from "@/components/ink-frame";

// Based on shadcn/ui Marker (MIT, https://ui.shadcn.com), base-nova style, fetched 2026-11-12.
// Restyled for mangacn: `separator` draws separator's hand-drawn rule either side of the label
// (InkFrame lines where stock has `::before`/`::after`) and boxes the label like a caption box,
// square in a heavy outline on paper; `border` draws the rule under the marker instead of a CSS
// border. Colours are `--ink` and the text colour, so `[--ink:var(--spot)] text-spot` makes an
// "unread" marker spot.

const markerVariants = cva(
  "group/marker relative flex min-h-4 w-full items-center gap-2 text-left text-sm text-muted-foreground [&_svg:not([class*='size-'])]:size-4 [a]:underline [a]:underline-offset-3 [a]:hover:text-foreground",
  {
    variants: {
      variant: {
        default: "",
        separator: "",
        border: "pb-2",
      },
    },
  },
);

/** One hand-drawn stroke along an `--outline-width` box: separator's pen. */
function Rule({ className }: { className?: string }) {
  return (
    <InkFrame
      as="span"
      shape="line"
      fill="none"
      aria-hidden="true"
      className={cn("pointer-events-none h-(--outline-width)", className)}
    />
  );
}

function Marker({
  className,
  variant = "default",
  render,
  children,
  ...props
}: useRender.ComponentProps<"div"> & VariantProps<typeof markerVariants>) {
  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(
      {
        className: cn(markerVariants({ variant, className })),
        children: (
          <>
            {variant === "separator" && <Rule className="mr-1 min-w-0 flex-1" />}
            {children}
            {variant === "separator" && <Rule className="ml-1 min-w-0 flex-1" />}
            {variant === "border" && <Rule className="absolute inset-x-0 bottom-0" />}
          </>
        ),
      },
      props,
    ),
    render,
    state: {
      slot: "marker",
      variant,
    },
  });
}

function MarkerIcon({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="marker-icon"
      aria-hidden="true"
      className={cn("size-4 shrink-0 [&_svg:not([class*='size-'])]:size-4", className)}
      {...props}
    />
  );
}

function MarkerContent({ className, children, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="marker-content"
      className={cn(
        "relative isolate min-w-0 wrap-break-word group-data-[variant=separator]/marker:flex-none group-data-[variant=separator]/marker:px-2 group-data-[variant=separator]/marker:py-0.5 group-data-[variant=separator]/marker:text-center group-data-[variant=separator]/marker:text-xs *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",
        className,
      )}
      {...props}
    >
      {/* The caption box, shown only between a separator's rules. */}
      <InkFrame
        as="span"
        fill="paper"
        className="pointer-events-none absolute inset-0 -z-1 hidden rounded-none [--outline-width:var(--outline-width-heavy)] group-data-[variant=separator]/marker:block"
      />
      {children}
    </span>
  );
}

export { Marker, MarkerContent, MarkerIcon, markerVariants };
