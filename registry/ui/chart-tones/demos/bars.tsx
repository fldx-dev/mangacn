import { ChartTones, chartToneFill } from "@/registry/ui/chart-tones/chart-tones";

const sales = [
  { series: "Ronin Nights", volumes: 42, tone: "dots4" },
  { series: "Paper Moon", volumes: 31, tone: "crossHatch" },
  { series: "Ink & Iron", volumes: 24, tone: "dots2" },
  { series: "Night Bus", volumes: 15, tone: "hatch" },
] as const;

const MAX = 50;
const HEIGHT = 140;
const BAR = 40;
const GAP = 24;

// A plain SVG bar set, no chart library: each bar takes a tone, outlined in ink. The figure's
// caption and the hidden list carry the numbers for screen readers.
export default function ChartTonesBarsDemo() {
  const width = sales.length * (BAR + GAP) + GAP;
  return (
    <figure className="flex flex-col items-center gap-2 text-ink">
      <ChartTones />
      <svg
        aria-hidden="true"
        width={width}
        height={HEIGHT + 2}
        viewBox={`0 0 ${width} ${HEIGHT + 2}`}
        className="max-w-full"
      >
        {sales.map((item, index) => {
          const height = (item.volumes / MAX) * HEIGHT;
          return (
            <rect
              key={item.series}
              x={GAP + index * (BAR + GAP)}
              y={HEIGHT - height + 1}
              width={BAR}
              height={height}
              fill={chartToneFill(item.tone)}
              stroke="currentColor"
              strokeWidth="1.5"
            />
          );
        })}
        <line
          x1="0"
          y1={HEIGHT + 1}
          x2={width}
          y2={HEIGHT + 1}
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
      <figcaption className="text-center text-xs">
        Volumes sold this month, thousands
        <ul className="sr-only">
          {sales.map((item) => (
            <li key={item.series}>{`${item.series}: ${item.volumes}`}</li>
          ))}
        </ul>
      </figcaption>
      <ul aria-hidden="true" className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs">
        {sales.map((item) => (
          <li key={item.series} className="flex items-center gap-1">
            <svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12">
              <rect
                x="0.75"
                y="0.75"
                width="10.5"
                height="10.5"
                fill={chartToneFill(item.tone)}
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
            {item.series}
          </li>
        ))}
      </ul>
    </figure>
  );
}
