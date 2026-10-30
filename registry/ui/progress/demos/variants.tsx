import { Progress, ProgressLabel, ProgressValue } from "@/registry/ui/progress/progress";

const bars = [
  { label: "Pencils", value: 100, variant: "default" },
  { label: "Inks", value: 64, variant: "default" },
  { label: "Screentone", value: 40, variant: "tone" },
  { label: "Lettering", value: 0, variant: "tone" },
] as const;

export default function ProgressVariantsDemo() {
  return (
    <div className="grid w-full max-w-xs gap-5">
      {bars.map(({ label, value, variant }) => (
        <Progress key={label} value={value} variant={variant}>
          <ProgressLabel>{label}</ProgressLabel>
          <ProgressValue />
        </Progress>
      ))}
    </div>
  );
}
