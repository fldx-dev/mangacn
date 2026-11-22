import { ChartTones, chartToneFill } from "@/registry/ui/chart-tones/chart-tones";

const poll = [
  { series: "Ronin Nights", votes: 412 },
  { series: "Night Bus", votes: 356, yours: true },
  { series: "Paper Moon", votes: 298 },
  { series: "Ink & Iron", votes: 187 },
];

const MAX = 450;

// Two sets of tones: the ink set for the field, and a `spot-` set drawn in the spot colour for
// the one series the reader is looking at. Each bar is a percentage-wide rect, so rows fit any
// width.
export default function ChartTonesSpotHighlightVariant() {
  return (
    <figure className="grid w-full max-w-md gap-3 text-ink">
      <ChartTones />
      <ChartTones prefix="spot-" className="text-spot" />
      <figcaption className="text-sm font-medium">Reader poll, week 32</figcaption>
      <ol className="grid gap-2">
        {poll.map((item) => (
          <li
            key={item.series}
            className="grid grid-cols-[7rem_1fr_auto] items-center gap-2 text-sm"
          >
            <span className={item.yours ? "font-semibold" : undefined}>
              {item.series}
              {item.yours && <span className="sr-only"> (your series)</span>}
            </span>
            <svg aria-hidden="true" className="h-5 w-full overflow-visible">
              <rect
                x="0.75"
                y="0.75"
                width={`${(item.votes / MAX) * 100}%`}
                height="18.5"
                fill={item.yours ? chartToneFill("dots4", "spot-") : chartToneFill("dots2")}
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
            <span className="tabular-nums">{item.votes}</span>
          </li>
        ))}
      </ol>
    </figure>
  );
}
