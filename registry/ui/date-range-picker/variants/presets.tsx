"use client";

import { endOfWeek, startOfDay, startOfWeek } from "date-fns";
import {
  DateRangePicker,
  type DateRangePreset,
} from "@/registry/ui/date-range-picker/date-range-picker";

/** A reading log's own ranges: this week's chapters, and the month the last volume came out. */
const readingLog: DateRangePreset[] = [
  {
    label: "This week",
    range: () => ({
      from: startOfWeek(new Date()),
      to: startOfDay(endOfWeek(new Date())),
    }),
  },
  {
    label: "Last volume's release month",
    range: () => ({ from: new Date(2026, 4, 1), to: new Date(2026, 4, 31) }),
  },
];

export default function DateRangePickerPresetsVariant() {
  return (
    <DateRangePicker
      presets={readingLog}
      defaultValue={{ from: new Date(2026, 4, 1), to: new Date(2026, 4, 31) }}
      placeholder="Pick days to log"
    />
  );
}
