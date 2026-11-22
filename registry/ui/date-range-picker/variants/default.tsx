import { DateRangePicker } from "@/registry/ui/date-range-picker/date-range-picker";

export default function DateRangePickerDefaultVariant() {
  return (
    <DateRangePicker defaultValue={{ from: new Date(2026, 5, 8), to: new Date(2026, 5, 14) }} />
  );
}
