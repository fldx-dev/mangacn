import { Slider } from "@/registry/ui/slider/slider";

const channels = [
  { id: "slider-vertical-ink", label: "Ink", value: 70 },
  { id: "slider-vertical-tone", label: "Tone", value: 35 },
  { id: "slider-vertical-paper", label: "Paper", value: 90 },
] as const;

export default function SliderVerticalDemo() {
  return (
    <div className="flex h-48 items-stretch gap-10">
      {channels.map(({ id, label, value }) => (
        <div key={id} className="flex flex-col items-center gap-3">
          <Slider aria-labelledby={id} orientation="vertical" defaultValue={[value]} />
          <span id={id} className="text-sm font-medium">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
