import { Input as InputPrimitive } from "@base-ui/react/input";
import { cn } from "cn";
import type * as React from "react";
import { InkFrame } from "@/components/ink-frame";

// Based on shadcn/ui Input (MIT, https://ui.shadcn.com), base-nova style, fetched 2026-10-31.
// Restyled for mangacn: an <input> cannot hold children, so the InkFrame wraps it and draws
// the outline and paper fill; no CSS border. Size the field from its parent (`w-*` on the
// input itself leaves the frame full width).

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InkFrame
      as="span"
      fill="paper"
      className="flex w-full min-w-0 rounded-lg has-[>[aria-invalid=true]]:[--ink:var(--destructive)]"
    >
      <InputPrimitive
        type={type}
        data-slot="input"
        className={cn(
          "h-8 w-full min-w-0 rounded-lg border-0 bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-100 disabled:halftone-light disabled:text-muted-foreground aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:aria-invalid:ring-destructive/40",
          className,
        )}
        {...props}
      />
    </InkFrame>
  );
}

export { Input };
