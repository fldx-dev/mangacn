// Test fixture for lib/registry/parity.test.ts: exports, slots and a cva object with two
// variant groups (one with quoted keys). Not part of any registry.
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "@/lib/utils";

const sampleVariants = cva("inline-flex border", {
  variants: {
    variant: {
      default: "bg-primary text-primary-foreground",
      outline: cn("border-border", "bg-background"),
      // ghost: "commented out, not a key",
      destructive: "bg-destructive/10 text-destructive",
    },
    size: {
      default: "h-8 px-2.5",
      sm: "h-7 px-2",
      "icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
      lg: "h-9 px-3",
    },
  },
  defaultVariants: { variant: "default", size: "default" },
});

type SampleProps = React.ComponentProps<"div"> & VariantProps<typeof sampleVariants>;

function Sample({ className, variant, size, ...props }: SampleProps) {
  return (
    <div
      data-slot="sample"
      className={cn(sampleVariants({ variant, size }), className)}
      {...props}
    />
  );
}

function SampleTitle(props: React.ComponentProps<"h2">) {
  return <h2 data-slot={"sample-title"} {...props} />;
}

export function SampleAction(props: React.ComponentProps<"button">) {
  return <button type="button" data-slot="sample-action" {...props} />;
}

// export { NotReal }
export type { SampleProps };
export { Sample, SampleTitle as SampleHeading, sampleVariants };
