"use client";

import { cn } from "cn";
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import * as React from "react";
import { type DayButton, DayPicker, getDefaultClassNames, type Locale } from "react-day-picker";
import { InkFrame } from "@/components/ink-frame";
import { Button, buttonVariants } from "@/components/ui/button";

// Based on shadcn/ui Calendar (MIT, https://ui.shadcn.com), base-nova style, fetched 2026-11-12.
// Restyled for mangacn through react-day-picker's `classNames` and stock's overrides only: an
// outlined paper card (the frame is the root's first child; none inside a card or popover,
// which draw their own), the caption in the display face, today underlined in ink, the
// selected day and a range's ends ink-filled by the pen, a range's middle on halftone-light,
// outside days in muted text, navigation in mangacn's button classes, and the caption
// dropdowns boxed in ink as native-select is.

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  locale,
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"];
}) {
  const defaultClassNames = getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "group/calendar relative isolate bg-background p-2 [--cell-radius:var(--radius-md)] [--cell-size:--spacing(7)] has-[>[data-inked=true]]:bg-transparent in-data-[slot=card-content]:bg-transparent in-data-[slot=popover-content]:bg-transparent",
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className,
      )}
      captionLayout={captionLayout}
      locale={locale}
      formatters={{
        formatMonthDropdown: (date) => date.toLocaleString(locale?.code, { month: "short" }),
        ...formatters,
      }}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn("relative flex flex-col gap-4 md:flex-row", defaultClassNames.months),
        month: cn("flex w-full flex-col gap-4", defaultClassNames.month),
        nav: cn(
          "absolute inset-x-0 top-0 z-10 flex w-full items-center justify-between gap-1",
          defaultClassNames.nav,
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-(--cell-size) p-0 select-none aria-disabled:opacity-50",
          defaultClassNames.button_previous,
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-(--cell-size) p-0 select-none aria-disabled:opacity-50",
          defaultClassNames.button_next,
        ),
        month_caption: cn(
          "flex h-(--cell-size) w-full items-center justify-center px-(--cell-size)",
          defaultClassNames.month_caption,
        ),
        dropdowns: cn(
          "flex h-(--cell-size) w-full items-center justify-center gap-1.5 text-sm font-medium",
          defaultClassNames.dropdowns,
        ),
        dropdown_root: cn(
          "relative rounded-(--cell-radius) has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
          defaultClassNames.dropdown_root,
        ),
        dropdown: cn("absolute inset-0 bg-popover opacity-0", defaultClassNames.dropdown),
        caption_label: cn(
          "font-display select-none",
          captionLayout === "label"
            ? "text-base tracking-wide"
            : "flex h-(--cell-size) items-center gap-1 rounded-(--cell-radius) bg-background pr-1.5 pl-2 text-sm ink-border [&>svg]:size-3.5 [&>svg]:text-foreground",
          defaultClassNames.caption_label,
        ),
        month_grid: cn("w-full border-collapse", defaultClassNames.month_grid),
        weekdays: cn("flex", defaultClassNames.weekdays),
        weekday: cn(
          "flex-1 rounded-(--cell-radius) text-[0.8rem] font-normal text-muted-foreground select-none",
          defaultClassNames.weekday,
        ),
        week: cn("mt-2 flex w-full", defaultClassNames.week),
        week_number_header: cn("w-(--cell-size) select-none", defaultClassNames.week_number_header),
        week_number: cn(
          "text-[0.8rem] text-muted-foreground select-none",
          defaultClassNames.week_number,
        ),
        day: cn(
          "group/day relative aspect-square h-full w-full rounded-(--cell-radius) p-0 text-center select-none [&:last-child[data-selected=true]_button]:rounded-r-(--cell-radius)",
          props.showWeekNumber
            ? "[&:nth-child(2)[data-selected=true]_button]:rounded-l-(--cell-radius)"
            : "[&:first-child[data-selected=true]_button]:rounded-l-(--cell-radius)",
          defaultClassNames.day,
        ),
        range_start: cn(
          "relative isolate z-0 rounded-l-(--cell-radius) after:absolute after:inset-y-0 after:right-0 after:w-4 after:halftone-light",
          defaultClassNames.range_start,
        ),
        range_middle: cn("rounded-none halftone-light", defaultClassNames.range_middle),
        range_end: cn(
          "relative isolate z-0 rounded-r-(--cell-radius) after:absolute after:inset-y-0 after:left-0 after:w-4 after:halftone-light",
          defaultClassNames.range_end,
        ),
        today: cn(
          "rounded-(--cell-radius) text-foreground data-[selected=true]:rounded-none [&_button]:underline [&_button]:decoration-[length:var(--outline-width-heavy)] [&_button]:underline-offset-4",
          defaultClassNames.today,
        ),
        outside: cn(
          "text-muted-foreground aria-selected:text-muted-foreground",
          defaultClassNames.outside,
        ),
        disabled: cn("text-muted-foreground opacity-50", defaultClassNames.disabled),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        // biome-ignore lint/correctness/noComponentHookFactories: stock's inline override, kept as stock has it.
        Root: ({ className, rootRef, children, ...props }) => {
          return (
            <div data-slot="calendar" ref={rootRef} className={cn(className)} {...props}>
              {/* The card's outline; a card or popover around the calendar draws its own. */}
              <InkFrame
                as="span"
                fill="paper"
                className="pointer-events-none absolute inset-0 -z-1 rounded-lg in-data-[slot=card-content]:hidden in-data-[slot=popover-content]:hidden"
              />
              {children}
            </div>
          );
        },
        // biome-ignore lint/correctness/noComponentHookFactories: stock's inline override, kept as stock has it.
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return <ChevronLeftIcon className={cn("size-4", className)} {...props} />;
          }

          if (orientation === "right") {
            return <ChevronRightIcon className={cn("size-4", className)} {...props} />;
          }

          return <ChevronDownIcon className={cn("size-4", className)} {...props} />;
        },
        // biome-ignore lint/correctness/noComponentHookFactories: stock's inline override, kept as stock has it.
        DayButton: ({ ...props }) => <CalendarDayButton locale={locale} {...props} />,
        // biome-ignore lint/correctness/noComponentHookFactories: stock's inline override, kept as stock has it.
        WeekNumber: ({ children, ...props }) => {
          return (
            <td {...props}>
              <div className="flex size-(--cell-size) items-center justify-center text-center">
                {children}
              </div>
            </td>
          );
        },
        ...components,
      }}
      {...props}
    />
  );
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  locale,
  children,
  ...props
}: React.ComponentProps<typeof DayButton> & { locale?: Partial<Locale> }) {
  const defaultClassNames = getDefaultClassNames();

  const ref = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  const selectedSingle =
    modifiers.selected && !modifiers.range_start && !modifiers.range_end && !modifiers.range_middle;
  // The selected day and a range's two ends are ink-filled by the pen; every other day is a
  // plain ghost button, so a month draws one or two frames, not forty-two.
  const inked = Boolean(selectedSingle || modifiers.range_start || modifiers.range_end);

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString(locale?.code)}
      data-selected-single={selectedSingle}
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        "relative isolate z-10 flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 border-0 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-[3px] group-data-[focused=true]/day:ring-ring/50 data-[range-end=true]:rounded-(--cell-radius) data-[range-end=true]:rounded-r-(--cell-radius) data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground data-[range-middle=true]:rounded-none data-[range-middle=true]:bg-transparent data-[range-middle=true]:text-foreground data-[range-start=true]:rounded-(--cell-radius) data-[range-start=true]:rounded-l-(--cell-radius) data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground dark:hover:text-foreground [&>span:not([data-slot=ink-frame])]:text-xs [&>span:not([data-slot=ink-frame])]:opacity-70",
        defaultClassNames.day,
        className,
      )}
      {...props}
    >
      {inked && (
        <InkFrame
          as="span"
          fill="ink"
          className="pointer-events-none absolute inset-0 -z-1 rounded-(--cell-radius)"
        />
      )}
      {children}
    </Button>
  );
}

export { Calendar, CalendarDayButton };
