"use client";

import * as React from "react";
import { Calendar } from "@/registry/ui/calendar/calendar";

const today = new Date(2026, 5, 12);

export default function CalendarDropdownsDemo() {
  const [date, setDate] = React.useState<Date | undefined>(new Date(2026, 5, 3));
  return (
    <Calendar
      mode="single"
      captionLayout="dropdown"
      selected={date}
      onSelect={setDate}
      today={today}
      defaultMonth={today}
      startMonth={new Date(2020, 0)}
      endMonth={new Date(2030, 11)}
    />
  );
}
