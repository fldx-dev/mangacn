import * as React from "react";
import { Calendar } from "@/components/ui/calendar";
import { SidebarGroup, SidebarGroupContent } from "@/components/ui/sidebar";

// Based on shadcn/ui sidebar-12 (MIT, https://ui.shadcn.com), base-nova style, fetched 2026-11-18.
// mangacn's calendar in the sidebar, a month with a day picked. Stock picks the 12th of the
// current month; the sample's fixed month keeps the page the same every day (`today` sets the
// underlined day): drop `today` and `defaultMonth`, and pick from `new Date()`, for a live one.

const today = new Date(2026, 9, 12);

export function DatePicker() {
  const [date, setDate] = React.useState<Date | undefined>(new Date(2026, 9, 12));
  return (
    <SidebarGroup className="px-0">
      <SidebarGroupContent>
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          today={today}
          defaultMonth={today}
          captionLayout="dropdown"
          className="bg-transparent [--cell-size:2.1rem]"
        />
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
