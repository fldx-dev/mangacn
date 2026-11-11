"use client";

import * as React from "react";
import { Calendar } from "@/registry/ui/calendar/calendar";

// Fixed dates keep the page the same every day: `today` sets the underlined day.
const today = new Date(2026, 5, 12);

export default function CalendarDefaultDemo() {
  const [date, setDate] = React.useState<Date | undefined>(new Date(2026, 5, 19));
  return (
    <Calendar mode="single" selected={date} onSelect={setDate} today={today} defaultMonth={today} />
  );
}
