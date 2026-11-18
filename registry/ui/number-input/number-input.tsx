"use client";

import { NumberField as NumberFieldPrimitive } from "@base-ui/react/number-field";
import { cn } from "cn";
import { MinusIcon, PlusIcon } from "lucide-react";
import * as React from "react";
import { InkFrame } from "@/components/ink-frame";

// mangacn number input: Base UI's NumberField in one hand-drawn frame, a − stepper, the input
// and a + stepper, with an inked rule between each stepper and the input. The steppers stay out
// of the tab order (the keys reach them) and carry a 44 px hit area.

/** Built-in words, each overridable through `labels`. */
const defaultLabels = { decrement: "Decrease", increment: "Increase" };

export interface NumberInputProps
  extends Omit<
    React.ComponentProps<"input">,
    | "value"
    | "defaultValue"
    | "onChange"
    | "type"
    | "min"
    | "max"
    | "step"
    | "size"
    | "disabled"
    | "readOnly"
    | "required"
    | "name"
  > {
  /** The number, controlled; `null` when the field is empty. */
  value?: number | null;
  /** The number it starts with, uncontrolled. */
  defaultValue?: number;
  /** Called with the new number (or `null` when cleared) on every change. */
  onValueChange?: (value: number | null) => void;
  /** The lowest number; Home jumps to it and the − stepper disables there. */
  min?: number;
  /** The highest number; End jumps to it and the + stepper disables there. */
  max?: number;
  /**
   * What Up / Down and the steppers add or take away.
   * @default 1
   */
  step?: number;
  /**
   * What Shift + Up / Down and PageUp / PageDown add or take away.
   * @default 10
   */
  largeStep?: number;
  /** How the number reads, through `Intl.NumberFormat` (currency, percent, units). */
  format?: Intl.NumberFormatOptions;
  /** The locale for `format`; the user's by default. */
  locale?: Intl.LocalesArgument;
  /**
   * Turns the whole field off.
   * @default false
   */
  disabled?: boolean;
  /**
   * Shows the number without letting it change.
   * @default false
   */
  readOnly?: boolean;
  /**
   * Marks the field as required in a form.
   * @default false
   */
  required?: boolean;
  /** The form field name; the number posts with a plain `<form>`. */
  name?: string;
  /**
   * The steppers' names.
   * @default { decrement: "Decrease", increment: "Increase" }
   */
  labels?: Partial<typeof defaultLabels>;
}

const stepperClass =
  "relative flex w-9 shrink-0 cursor-pointer items-center justify-center self-stretch text-ink outline-none select-none after:absolute after:top-1/2 after:left-1/2 after:size-11 after:-translate-1/2 hover:bg-muted disabled:cursor-not-allowed disabled:text-muted-foreground disabled:hover:bg-transparent [&>svg]:size-4";

export function NumberInput({
  value,
  defaultValue,
  onValueChange,
  min,
  max,
  step = 1,
  largeStep = 10,
  format,
  locale,
  disabled = false,
  readOnly = false,
  required = false,
  name,
  labels,
  id,
  className,
  onKeyDown,
  ...props
}: NumberInputProps) {
  const words = { ...defaultLabels, ...labels };
  const [inner, setInner] = React.useState<number | null>(defaultValue ?? null);
  const current = value !== undefined ? value : inner;

  const change = (next: number | null) => {
    if (value === undefined) setInner(next);
    onValueChange?.(next);
  };

  // Base UI steps on the arrows, Shift + arrows, Home and End; PageUp / PageDown are the
  // Spinbutton pattern's large steps, added here.
  const stepPage = (direction: 1 | -1) => {
    let next = (current ?? 0) + direction * largeStep;
    if (min !== undefined) next = Math.max(min, next);
    if (max !== undefined) next = Math.min(max, next);
    if (next !== current) change(next);
  };

  return (
    <NumberFieldPrimitive.Root
      data-slot="number-input"
      id={id}
      value={current}
      onValueChange={change}
      min={min}
      max={max}
      step={step}
      largeStep={largeStep}
      format={format}
      locale={locale}
      disabled={disabled}
      readOnly={readOnly}
      required={required}
      name={name}
      className={cn("w-full min-w-0", className)}
    >
      <NumberFieldPrimitive.Group className="group/number-input relative isolate flex h-8 w-full min-w-0 items-stretch rounded-lg has-[input:focus-visible]:ring-3 has-[input:focus-visible]:ring-ring/50 has-[input[aria-invalid=true]]:ring-3 has-[input[aria-invalid=true]]:ring-destructive/20 has-[input[aria-invalid=true]]:[--ink:var(--destructive)] data-disabled:halftone-light data-disabled:text-muted-foreground dark:has-[input[aria-invalid=true]]:ring-destructive/40">
        {/* The one outline around the three parts; disabled shows its halftone through it. */}
        <InkFrame
          as="span"
          fill="paper"
          className="pointer-events-none absolute inset-0 -z-1 rounded-lg group-data-disabled/number-input:[--paper:transparent]"
        />
        <NumberFieldPrimitive.Decrement
          data-slot="number-input-decrement"
          aria-label={words.decrement}
          className={cn(stepperClass, "rounded-l-lg")}
        >
          <InkFrame
            as="span"
            shape="line"
            fill="none"
            className="pointer-events-none absolute inset-y-0 right-0 w-(--outline-width)"
          />
          <MinusIcon aria-hidden="true" />
        </NumberFieldPrimitive.Decrement>
        <NumberFieldPrimitive.Input
          data-slot="number-input-input"
          className="h-full w-full min-w-0 flex-1 bg-transparent px-2 text-center text-base tabular-nums outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed md:text-sm"
          onKeyDown={(event) => {
            onKeyDown?.(event);
            if (event.defaultPrevented || disabled || readOnly) return;
            if (event.key === "PageUp" || event.key === "PageDown") {
              event.preventDefault();
              stepPage(event.key === "PageUp" ? 1 : -1);
            }
          }}
          {...props}
        />
        <NumberFieldPrimitive.Increment
          data-slot="number-input-increment"
          aria-label={words.increment}
          className={cn(stepperClass, "rounded-r-lg")}
        >
          <InkFrame
            as="span"
            shape="line"
            fill="none"
            className="pointer-events-none absolute inset-y-0 left-0 w-(--outline-width)"
          />
          <PlusIcon aria-hidden="true" />
        </NumberFieldPrimitive.Increment>
      </NumberFieldPrimitive.Group>
    </NumberFieldPrimitive.Root>
  );
}
