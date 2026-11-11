"use client";

import * as React from "react";
import type { DateRange } from "react-day-picker";
import { Calendar } from "@/registry/ui/calendar/calendar";

const today = new Date(2026, 5, 12);

export default function CalendarRangeDemo() {
  const [range, setRange] = React.useState<DateRange | undefined>({
    from: new Date(2026, 5, 15),
    to: new Date(2026, 5, 24),
  });
  return (
    <Calendar
      mode="range"
      selected={range}
      onSelect={setRange}
      today={today}
      defaultMonth={today}
      numberOfMonths={2}
    />
  );
}
