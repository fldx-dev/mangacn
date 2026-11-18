"use client";

import { cn } from "cn";
import * as React from "react";
import { InkFrame } from "@/components/ink-frame";

// mangacn's time picker (SPEC-components-7 §4.2): hour and minute fields, and AM/PM in 12-hour
// mode, in one ink frame, each an APG spinbutton. The value is "HH:mm" in 24 hours, as
// <input type="time"> posts it. Segments are contentEditable so a phone opens its number pad;
// every edit goes through the key handlers, so React keeps the text.

type Segment = "hour" | "minute" | "period";
type Period = "AM" | "PM";

/** The words the picker says: each segment's accessible name. */
export interface TimePickerLabels {
  /** @default "Hours" */
  hours?: string;
  /** @default "Minutes" */
  minutes?: string;
  /** @default "AM/PM" */
  period?: string;
}

export interface TimePickerProps
  extends Omit<React.ComponentProps<"div">, "defaultValue" | "onChange" | "children"> {
  /** The time as "HH:mm" in 24 hours (as `<input type="time">`), or null when unset. Controlled. */
  value?: string | null;
  /** The starting time when uncontrolled. */
  defaultValue?: string | null;
  /** Called with "HH:mm" once hours and minutes are set (and AM/PM in 12-hour mode), else null. */
  onValueChange?: (value: string | null) => void;
  /**
   * 24 shows 00–23; 12 shows 1–12 and an AM/PM segment.
   * @default 24
   */
  hourCycle?: 12 | 24;
  /**
   * How far Up and Down move the minutes.
   * @default 1
   */
  minuteStep?: number;
  /** The earliest valid time, "HH:mm"; an earlier value sets `aria-invalid`. */
  min?: string;
  /** The latest valid time, "HH:mm"; a later value sets `aria-invalid`. */
  max?: string;
  /**
   * Stops editing and greys the frame.
   * @default false
   */
  disabled?: boolean;
  /**
   * Marks each segment `aria-required`.
   * @default false
   */
  required?: boolean;
  /** Posts the value as "HH:mm" in a hidden input of this name (empty when unset). */
  name?: string;
  /** Overrides the segments' names. */
  labels?: TimePickerLabels;
  /** Set on the hour segment, so a field's label can point at it. */
  id?: string;
  /** Marks every segment invalid, as a field's error does; out-of-range values set it too. */
  "aria-invalid"?: boolean | "true" | "false";
  /** Set on every segment: the field's description and error. */
  "aria-describedby"?: string;
}

interface Segments {
  /** In display units: 0–23, or 1–12 in 12-hour mode. */
  hour: number | null;
  minute: number | null;
  period: Period | null;
}

const DEFAULT_LABELS: Required<TimePickerLabels> = {
  hours: "Hours",
  minutes: "Minutes",
  period: "AM/PM",
};

const pad = (n: number) => String(n).padStart(2, "0");

function parse(value: string | null | undefined, cycle: 12 | 24): Segments {
  const match = value ? /^(\d{2}):(\d{2})$/.exec(value) : null;
  if (!match) return { hour: null, minute: null, period: null };
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (cycle === 24) return { hour, minute, period: null };
  return { hour: hour % 12 || 12, minute, period: hour < 12 ? "AM" : "PM" };
}

function compose({ hour, minute, period }: Segments, cycle: 12 | 24): string | null {
  if (hour === null || minute === null) return null;
  if (cycle === 24) return `${pad(hour)}:${pad(minute)}`;
  if (period === null) return null;
  return `${pad((hour % 12) + (period === "PM" ? 12 : 0))}:${pad(minute)}`;
}

const wrap = (n: number, lo: number, hi: number) => {
  const size = hi - lo + 1;
  return ((((n - lo) % size) + size) % size) + lo;
};

export function TimePicker({
  value: valueProp,
  defaultValue,
  onValueChange,
  hourCycle = 24,
  minuteStep = 1,
  min,
  max,
  disabled = false,
  required = false,
  name,
  labels: labelsProp,
  id,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
  className,
  ...props
}: TimePickerProps) {
  const labels = { ...DEFAULT_LABELS, ...labelsProp };
  const controlled = valueProp !== undefined;
  const [segments, setSegments] = React.useState<Segments>(() =>
    parse(controlled ? valueProp : defaultValue, hourCycle),
  );
  // A controlled value that differs from what the segments compose replaces them; a partial
  // entry (hours typed, minutes not yet) composes null and stays while the value is null.
  const [seen, setSeen] = React.useState(valueProp);
  if (controlled && valueProp !== seen) {
    setSeen(valueProp);
    if (valueProp !== compose(segments, hourCycle)) setSegments(parse(valueProp, hourCycle));
  }

  const value = compose(segments, hourCycle);
  const outOfRange = value !== null && ((min && value < min) || (max && value > max));
  const invalid = Boolean(outOfRange) || ariaInvalid === true || ariaInvalid === "true";

  const order: Segment[] = hourCycle === 12 ? ["hour", "minute", "period"] : ["hour", "minute"];
  const refs = React.useRef<Partial<Record<Segment, HTMLElement | null>>>({});
  /** Digits typed into the focused segment so far, so "1" then "5" makes 15. */
  const typed = React.useRef("");

  const update = (patch: Partial<Segments>) => {
    const next = { ...segments, ...patch };
    setSegments(next);
    const nextValue = compose(next, hourCycle);
    if (nextValue !== value) onValueChange?.(nextValue);
  };

  const focusSibling = (segment: Segment, step: 1 | -1) => {
    const target = order[order.indexOf(segment) + step];
    if (target) refs.current[target]?.focus();
  };

  const hourMin = hourCycle === 12 ? 1 : 0;
  const hourMax = hourCycle === 12 ? 12 : 23;
  const step = Math.max(1, Math.floor(minuteStep));
  const lastMinute = 59 - (59 % step);

  const stepSegment = (segment: Segment, key: string) => {
    if (segment === "period") {
      if (key === "Home") return update({ period: "AM" });
      if (key === "End") return update({ period: "PM" });
      return update({ period: segments.period === "AM" ? "PM" : "AM" });
    }
    if (segment === "hour") {
      const current = segments.hour;
      if (key === "Home") return update({ hour: hourMin });
      if (key === "End") return update({ hour: hourMax });
      const by = key.startsWith("Page") ? 3 : 1;
      const dir = key === "ArrowUp" || key === "PageUp" ? 1 : -1;
      if (current === null) return update({ hour: dir > 0 ? hourMin : hourMax });
      return update({ hour: wrap(current + dir * by, hourMin, hourMax) });
    }
    const current = segments.minute;
    if (key === "Home") return update({ minute: 0 });
    if (key === "End") return update({ minute: lastMinute });
    const dir = key === "ArrowUp" || key === "PageUp" ? 1 : -1;
    if (current === null) return update({ minute: dir > 0 ? 0 : lastMinute });
    if (key.startsWith("Page")) return update({ minute: wrap(current + dir * 10, 0, 59) });
    // Up and Down land on the step's multiples, wrapping past the hour.
    const next =
      dir > 0 ? Math.floor(current / step) * step + step : Math.ceil(current / step) * step - step;
    return update({ minute: next > lastMinute ? 0 : next < 0 ? lastMinute : next });
  };

  const typeDigit = (segment: Segment, digit: number) => {
    if (segment === "period") return;
    const top = segment === "hour" ? hourMax : 59;
    let text = `${typed.current}${digit}`;
    if (Number(text) > top) text = String(digit);
    typed.current = text;
    const number = Number(text);
    // 0 is no hour on a 12-hour clock: keep it in the buffer, wait for the second digit.
    if (!(segment === "hour" && hourCycle === 12 && number === 0)) {
      update({ [segment]: number } as Partial<Segments>);
    }
    // Full once two digits are in, or once no second digit could stay in range.
    if (text.length === 2 || number * 10 > top) {
      typed.current = "";
      focusSibling(segment, 1);
    }
  };

  const clear = (segment: Segment) => {
    typed.current = "";
    update({ [segment]: null } as Partial<Segments>);
  };

  const onKeyDown = (segment: Segment) => (event: React.KeyboardEvent<HTMLElement>) => {
    if (disabled) return;
    const { key } = event;
    if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End"].includes(key)) {
      event.preventDefault();
      typed.current = "";
      stepSegment(segment, key);
    } else if (key === "ArrowLeft" || key === "ArrowRight") {
      event.preventDefault();
      focusSibling(segment, key === "ArrowRight" ? 1 : -1);
    } else if (key === "Backspace" || key === "Delete") {
      event.preventDefault();
      clear(segment);
    } else if (/^\d$/.test(key)) {
      event.preventDefault();
      typeDigit(segment, Number(key));
    } else if (segment === "period" && /^[ap]$/i.test(key)) {
      event.preventDefault();
      update({ period: key.toLowerCase() === "a" ? "AM" : "PM" });
    } else if (key.length === 1 || key === "Enter") {
      // Any other character would land in the contentEditable text.
      event.preventDefault();
    }
  };

  // Phones send "Unidentified" key events and the character in a native beforeinput instead
  // (React's onBeforeInput is a synthetic event that does not carry it), so a listener on each
  // segment takes it; every other edit is cancelled, so the text stays React's.
  const onBeforeInput = (segment: Segment, event: InputEvent) => {
    event.preventDefault();
    if (disabled) return;
    if (event.inputType?.startsWith("delete")) return clear(segment);
    const char = event.data?.slice(-1) ?? "";
    if (/^\d$/.test(char)) typeDigit(segment, Number(char));
    else if (segment === "period" && /^[ap]$/i.test(char)) {
      update({ period: char.toLowerCase() === "a" ? "AM" : "PM" });
    }
  };

  const segmentAria = (segment: Segment) => {
    if (segment === "hour") {
      return {
        label: labels.hours,
        now: segments.hour,
        lo: hourMin,
        hi: hourMax,
        text: segments.hour === null ? null : pad(segments.hour),
      };
    }
    if (segment === "minute") {
      return {
        label: labels.minutes,
        now: segments.minute,
        lo: 0,
        hi: 59,
        text: segments.minute === null ? null : pad(segments.minute),
      };
    }
    return {
      label: labels.period,
      now: segments.period === null ? null : segments.period === "AM" ? 0 : 1,
      lo: 0,
      hi: 1,
      text: segments.period,
    };
  };

  return (
    // biome-ignore lint/a11y/useSemanticElements: APG's spinbutton group; a fieldset would draw a legend box.
    <div
      role="group"
      data-slot="time-picker"
      data-grouped=""
      data-disabled={disabled ? "" : undefined}
      data-invalid={invalid ? "" : undefined}
      className={cn(
        "relative isolate inline-flex h-8 w-36 max-w-full items-center rounded-lg px-2.5 text-base tabular-nums md:text-sm has-[[data-slot=time-picker-segment]:focus-visible]:ring-3 has-[[data-slot=time-picker-segment]:focus-visible]:ring-ring/50 data-disabled:halftone-light data-disabled:text-muted-foreground data-invalid:ring-3 data-invalid:ring-destructive/20 data-invalid:[--ink:var(--destructive)] dark:data-invalid:ring-destructive/40",
        className,
      )}
      {...props}
    >
      {/* The picker's one outline; a disabled picker shows its halftone through the paper. */}
      <InkFrame
        as="span"
        fill="paper"
        className="pointer-events-none absolute inset-0 -z-1 rounded-lg in-data-disabled:[--paper:transparent]"
      />
      {order.map((segment, index) => {
        const { label, now, lo, hi, text } = segmentAria(segment);
        return (
          <React.Fragment key={segment}>
            {segment === "minute" && (
              <span data-slot="time-picker-separator" aria-hidden="true" className="px-0.5">
                :
              </span>
            )}
            <span
              ref={(node) => {
                refs.current[segment] = node;
                const listener = (event: Event) => onBeforeInput(segment, event as InputEvent);
                node?.addEventListener("beforeinput", listener);
                return () => {
                  node?.removeEventListener("beforeinput", listener);
                  refs.current[segment] = null;
                };
              }}
              id={index === 0 ? id : undefined}
              role="spinbutton"
              data-slot="time-picker-segment"
              data-segment={segment}
              data-placeholder={text === null ? "" : undefined}
              tabIndex={disabled ? undefined : 0}
              contentEditable={!disabled}
              suppressContentEditableWarning
              inputMode={segment === "period" ? "text" : "numeric"}
              spellCheck={false}
              autoCorrect="off"
              aria-label={label}
              aria-valuenow={now ?? undefined}
              aria-valuemin={lo}
              aria-valuemax={hi}
              aria-valuetext={text ?? undefined}
              aria-invalid={invalid || undefined}
              aria-required={required || undefined}
              aria-disabled={disabled || undefined}
              aria-describedby={ariaDescribedBy}
              onKeyDown={onKeyDown(segment)}
              onPaste={(event) => event.preventDefault()}
              onDrop={(event) => event.preventDefault()}
              onBlur={() => {
                typed.current = "";
              }}
              className={cn(
                "rounded-sm px-0.5 caret-transparent outline-none select-none focus:bg-primary focus:text-primary-foreground data-placeholder:text-muted-foreground focus:data-placeholder:text-primary-foreground",
                segment === "period" && "ml-1.5",
              )}
            >
              {text ?? "--"}
            </span>
          </React.Fragment>
        );
      })}
      {name !== undefined && <input type="hidden" name={name} value={value ?? ""} />}
    </div>
  );
}
