import { CHART_TONES, ChartTones, chartToneFill } from "@/registry/ui/chart-tones/chart-tones";

const LABELS = {
  dots1: "Dots 1",
  dots2: "Dots 2",
  dots3: "Dots 3",
  dots4: "Dots 4",
  hatch: "Hatch",
  crossHatch: "Cross-hatch",
} as const;

// The six tones as swatches: each square is filled with url(#tone-…) from the defs above it.
export default function ChartTonesDefaultDemo() {
  return (
    <div className="text-ink">
      <ChartTones />
      <ul className="grid grid-cols-3 gap-x-6 gap-y-4 sm:grid-cols-6">
        {CHART_TONES.map((tone) => (
          <li key={tone} className="flex flex-col items-center gap-1.5">
            <svg aria-hidden="true" width="56" height="56" viewBox="0 0 56 56">
              <rect
                x="1"
                y="1"
                width="54"
                height="54"
                fill={chartToneFill(tone)}
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
            <span className="text-xs">{LABELS[tone]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
