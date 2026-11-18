"use client";

import { cn } from "cn";
import {
  endOfMonth,
  format,
  isSameDay,
  type Locale,
  startOfDay,
  startOfMonth,
  subDays,
} from "date-fns";
import { CalendarIcon } from "lucide-react";
import * as React from "react";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";

// mangacn's date range picker (SPEC-components-7 §4.1), the APG Date Picker Dialog: an outline
// button showing the range opens a popover with presets and a range calendar. Focus goes to the
// calendar's selected (or today's) day on open and back to the trigger on Escape; picking the
// second date keeps the popover open, a preset sets the range and closes it.

/** A named range in the presets column, computed when it is shown or picked. */
export interface DateRangePreset {
  /** The button's text. */
  label: string;
  /** The range the preset stands for, computed at render and on click (so "today" is today). */
  range: () => DateRange;
}

/** The words the picker says. */
export interface DateRangePickerLabels {
  /** @default "Presets" */
  presets?: string;
}

type CalendarProps = React.ComponentProps<typeof Calendar>;

export interface DateRangePickerProps
  extends Omit<React.ComponentProps<"div">, "defaultValue" | "onChange" | "children"> {
  /** The picked range (react-day-picker's `{ from?: Date; to?: Date }`). Controlled. */
  value?: DateRange;
  /** The starting range when uncontrolled. */
  defaultValue?: DateRange;
  /** Called with each new range, or undefined when it is cleared. */
  onValueChange?: (range: DateRange | undefined) => void;
  /**
   * The presets column; `[]` hides it.
   * @default Today, Last 7 days, Last 30 days, This month
   */
  presets?: DateRangePreset[];
  /**
   * Months side by side; always 1 under 768 px.
   * @default 2
   */
  numberOfMonths?: 1 | 2;
  /**
   * The trigger's text with no range picked.
   * @default "Pick a date range"
   */
  placeholder?: string;
  /**
   * Writes the range on the trigger.
   * @default "LLL d, y – LLL d, y" through date-fns
   */
  formatRange?: (range: DateRange) => string;
  /** A date-fns locale for the trigger's text and the calendar. */
  locale?: Locale;
  /**
   * Stops the trigger from opening.
   * @default false
   */
  disabled?: boolean;
  /** Passed to the calendar: disabled days, `startMonth`, `endMonth`, `weekStartsOn`… */
  calendarProps?: Omit<CalendarProps, "mode" | "selected" | "onSelect" | "required">;
  /** Posts the range in two hidden inputs, `<name>-from` and `<name>-to`, as yyyy-MM-dd. */
  name?: string;
  /** Whether the popover is open. Controlled. */
  open?: boolean;
  /**
   * Whether the popover starts open when uncontrolled.
   * @default false
   */
  defaultOpen?: boolean;
  /** Called when the popover opens or closes. */
  onOpenChange?: (open: boolean) => void;
  /** Overrides the built-in words. */
  labels?: DateRangePickerLabels;
  /** Set on the trigger, so a field's label can point at it. */
  id?: string;
  /** Names the trigger together with its own text, e.g. the field label's id. */
  "aria-labelledby"?: string;
  /** Set on the trigger, as a field's error does. */
  "aria-invalid"?: boolean | "true" | "false";
  /** Set on the trigger: the field's description and error. */
  "aria-describedby"?: string;
}

const DEFAULT_PRESETS: DateRangePreset[] = [
  {
    label: "Today",
    range: () => {
      const today = startOfDay(new Date());
      return { from: today, to: today };
    },
  },
  {
    label: "Last 7 days",
    range: () => {
      const today = startOfDay(new Date());
      return { from: subDays(today, 6), to: today };
    },
  },
  {
    label: "Last 30 days",
    range: () => {
      const today = startOfDay(new Date());
      return { from: subDays(today, 29), to: today };
    },
  },
  {
    label: "This month",
    range: () => {
      const today = new Date();
      return { from: startOfMonth(today), to: startOfDay(endOfMonth(today)) };
    },
  },
];

const ISO_DAY = "yyyy-MM-dd";

function sameRange(a: DateRange | undefined, b: DateRange) {
  const day = (x?: Date, y?: Date) => (x && y ? isSameDay(x, y) : x === y);
  return Boolean(a?.from) && day(a?.from, b.from) && day(a?.to, b.to);
}

export function DateRangePicker({
  value: valueProp,
  defaultValue,
  onValueChange,
  presets = DEFAULT_PRESETS,
  numberOfMonths = 2,
  placeholder = "Pick a date range",
  formatRange,
  locale,
  disabled = false,
  calendarProps,
  name,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  labels: labelsProp,
  id,
  "aria-labelledby": ariaLabelledBy,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
  className,
  ...props
}: DateRangePickerProps) {
  const labels = { presets: "Presets", ...labelsProp };
  const [valueState, setValueState] = React.useState(defaultValue);
  const value = valueProp !== undefined ? valueProp : valueState;
  const setValue = (range: DateRange | undefined) => {
    if (valueProp === undefined) setValueState(range);
    onValueChange?.(range);
  };
  const [openState, setOpenState] = React.useState(defaultOpen);
  const open = openProp ?? openState;
  const setOpen = (next: boolean) => {
    if (openProp === undefined) setOpenState(next);
    onOpenChange?.(next);
  };

  const isMobile = useIsMobile();
  const months = isMobile ? 1 : numberOfMonths;
  const ownId = React.useId();
  const triggerId = id ?? ownId;
  const contentRef = React.useRef<HTMLDivElement>(null);

  const write = (range: DateRange) => {
    if (formatRange) return formatRange(range);
    const day = (date: Date) => format(date, "LLL d, y", { locale });
    if (!range.from) return "";
    return range.to ? `${day(range.from)} – ${day(range.to)}` : day(range.from);
  };
  const text = value?.from ? write(value) : "";

  return (
    <div
      data-slot="date-range-picker"
      data-state={open ? "open" : "closed"}
      data-disabled={disabled ? "" : undefined}
      className={cn("inline-flex max-w-full", className)}
      {...props}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              id={triggerId}
              data-slot="date-range-picker-trigger"
              data-placeholder={text ? undefined : ""}
              disabled={disabled}
              aria-haspopup="dialog"
              // The trigger's name is the field's label, then the range or the placeholder.
              aria-labelledby={ariaLabelledBy ? `${ariaLabelledBy} ${triggerId}` : undefined}
              aria-invalid={ariaInvalid}
              aria-describedby={ariaDescribedBy}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown" && !open) {
                  event.preventDefault();
                  setOpen(true);
                }
              }}
              className="max-w-full min-w-0 justify-start font-normal data-placeholder:text-muted-foreground aria-invalid:[--ink:var(--destructive)]"
            />
          }
        >
          <CalendarIcon aria-hidden="true" />
          <span className="truncate">{text || placeholder}</span>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          // Into the calendar's selected day, or today's: the one day button in the tab order.
          initialFocus={() =>
            contentRef.current?.querySelector<HTMLElement>(
              '[data-slot="date-range-picker-calendar"] button[tabindex="0"]',
            ) ?? true
          }
          className="w-[calc(100vw-(--spacing(8)))] max-w-max p-2 motion-reduce:animate-none! md:w-auto"
        >
          <div
            ref={contentRef}
            data-slot="date-range-picker-content"
            className="flex flex-col gap-2 md:flex-row"
          >
            {presets.length > 0 && (
              // biome-ignore lint/a11y/useSemanticElements: APG's group of buttons; a fieldset would draw a legend box.
              <div
                role="group"
                aria-label={labels.presets}
                data-slot="date-range-picker-presets"
                className="flex flex-wrap gap-1 md:flex-col md:flex-nowrap"
              >
                {presets.map((preset) => {
                  const pressed = sameRange(value, preset.range());
                  return (
                    <Button
                      key={preset.label}
                      type="button"
                      size="sm"
                      variant={pressed ? "default" : "ghost"}
                      data-slot="date-range-picker-preset"
                      aria-pressed={pressed}
                      className="justify-start"
                      onClick={() => {
                        setValue(preset.range());
                        setOpen(false);
                      }}
                    >
                      {preset.label}
                    </Button>
                  );
                })}
              </div>
            )}
            <div data-slot="date-range-picker-calendar" className="flex justify-center">
              <Calendar
                defaultMonth={value?.from}
                locale={locale}
                {...calendarProps}
                mode="range"
                selected={value}
                onSelect={setValue}
                numberOfMonths={months}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
      {name !== undefined && (
        <>
          <input
            type="hidden"
            name={`${name}-from`}
            value={value?.from ? format(value.from, ISO_DAY) : ""}
          />
          <input
            type="hidden"
            name={`${name}-to`}
            value={value?.to ? format(value.to, ISO_DAY) : ""}
          />
        </>
      )}
    </div>
  );
}
