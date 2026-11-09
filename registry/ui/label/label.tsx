"use client";

import { cn } from "cn";
import type * as React from "react";

// Based on shadcn/ui Label (MIT, https://ui.shadcn.com), base-nova style, fetched 2026-11-09.
// Restyled for mangacn: stock, in the body face. `required` adds a spot asterisk after the
// text, hidden from assistive tech (the control's own `required` is what gets announced).

function Label({
  className,
  required = false,
  children,
  ...props
}: React.ComponentProps<"label"> & {
  /**
   * Marks the field as required with a spot asterisk after the text. Visual only: also set
   * `required` on the control, which is what assistive tech announces.
   * @default false
   */
  required?: boolean;
}) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: stock's label; the caller passes htmlFor or nests the control.
    <label
      data-slot="label"
      data-required={required || undefined}
      className={cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
      {required ? (
        <span aria-hidden="true" className="-ml-1.5 text-spot">
          *
        </span>
      ) : null}
    </label>
  );
}

export { Label };
