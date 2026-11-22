import { TimePicker } from "@/registry/ui/time-picker/time-picker";

export default function TimePickerTwelveHourVariant() {
  return <TimePicker aria-label="Signing starts" hourCycle={12} defaultValue="14:00" />;
}
