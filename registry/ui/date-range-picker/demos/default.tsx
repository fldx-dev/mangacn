import { DateRangePicker } from "@/registry/ui/date-range-picker/date-range-picker";

export default function DateRangePickerDefaultDemo() {
  return (
    <DateRangePicker defaultValue={{ from: new Date(2026, 5, 8), to: new Date(2026, 5, 14) }} />
  );
}
