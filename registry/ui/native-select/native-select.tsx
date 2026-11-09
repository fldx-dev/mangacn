import { cn } from "cn";
import { ChevronDownIcon } from "lucide-react";
import type * as React from "react";
import { InkFrame } from "@/components/ink-frame";

// Based on shadcn/ui Native Select (MIT, https://ui.shadcn.com), base-nova style, fetched 2026-11-09.
// Restyled for mangacn: `select`'s trigger on a native <select>. A <select> cannot hold the
// drawing, so the InkFrame is the first child of stock's wrapper and draws the outline and
// paper fill behind the control (no CSS border); the chevron is select's. The option list is
// the browser's own.

type NativeSelectProps = Omit<React.ComponentProps<"select">, "size"> & {
  size?: "sm" | "default";
};

function NativeSelect({ className, size = "default", ...props }: NativeSelectProps) {
  return (
    <div
      className={cn(
        "group/native-select relative isolate w-fit has-[select:disabled]:opacity-100 has-[select[aria-invalid=true]]:[--ink:var(--destructive)] dark:hover:[--paper:var(--muted)]",
        className,
      )}
      data-slot="native-select-wrapper"
      data-size={size}
    >
      <InkFrame
        as="span"
        // A disabled control shows its halftone through an unfilled outline.
        fill={props.disabled ? "none" : "paper"}
        className="pointer-events-none absolute inset-0 -z-1 rounded-lg group-data-[size=sm]/native-select:rounded-[min(var(--radius-md),10px)]"
      />
      <select
        data-slot="native-select"
        data-size={size}
        className="h-8 w-full min-w-0 appearance-none rounded-lg border-0 bg-transparent py-1 pr-8 pl-2.5 text-sm transition-colors outline-none select-none selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:halftone-light disabled:text-muted-foreground aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-[size=sm]:h-7 data-[size=sm]:rounded-[min(var(--radius-md),10px)] data-[size=sm]:py-0.5 dark:aria-invalid:ring-destructive/40"
        {...props}
      />
      <ChevronDownIcon
        className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted-foreground select-none"
        aria-hidden="true"
        data-slot="native-select-icon"
      />
    </div>
  );
}

function NativeSelectOption({ className, ...props }: React.ComponentProps<"option">) {
  return (
    <option
      data-slot="native-select-option"
      className={cn("bg-[Canvas] text-[CanvasText]", className)}
      {...props}
    />
  );
}

function NativeSelectOptGroup({ className, ...props }: React.ComponentProps<"optgroup">) {
  return (
    <optgroup
      data-slot="native-select-optgroup"
      className={cn("bg-[Canvas] text-[CanvasText]", className)}
      {...props}
    />
  );
}

export { NativeSelect, NativeSelectOptGroup, NativeSelectOption };
