import { cn } from "cn";
import type * as React from "react";
import { InkFrame } from "@/components/ink-frame";

// Based on shadcn/ui Textarea (MIT, https://ui.shadcn.com), base-nova style, fetched 2026-10-31.
// Restyled for mangacn: a <textarea> cannot hold the frame, so the InkFrame wraps it and draws
// the outline and paper fill; no CSS border.

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <InkFrame
      as="span"
      fill="paper"
      className="flex w-full min-w-0 rounded-lg has-[>[aria-invalid=true]]:[--ink:var(--destructive)]"
    >
      <textarea
        data-slot="textarea"
        className={cn(
          "flex field-sizing-content min-h-16 w-full rounded-lg border-0 bg-transparent px-2.5 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-100 disabled:halftone-light disabled:text-muted-foreground aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:aria-invalid:ring-destructive/40",
          className,
        )}
        {...props}
      />
    </InkFrame>
  );
}

export { Textarea };
