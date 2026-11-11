"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/registry/ui/chart/chart";

const data = [
  { week: "W1", ronin: 12, paper: 8, night: 5 },
  { week: "W2", ronin: 15, paper: 9, night: 7 },
  { week: "W3", ronin: 14, paper: 13, night: 6 },
  { week: "W4", ronin: 19, paper: 12, night: 9 },
  { week: "W5", ronin: 22, paper: 15, night: 8 },
];

// Three series in ink, told apart by weight and dash rather than hue.
const config = {
  ronin: { label: "Ronin Nights", color: "var(--chart-1)" },
  paper: { label: "Paper Moon", color: "var(--chart-1)" },
  night: { label: "Night Bus", color: "var(--chart-2)" },
} satisfies ChartConfig;

const strokes = {
  ronin: { strokeWidth: 3 },
  paper: { strokeWidth: 1.5, strokeDasharray: "6 4" },
  night: { strokeWidth: 1.5, strokeDasharray: "2 3" },
} as const;

export default function ChartLinesDemo() {
  return (
    <figure className="flex w-full max-w-sm flex-col gap-1">
      <ChartContainer config={config} className="aspect-auto h-52 w-full">
        <LineChart data={data} margin={{ left: -16, right: 8 }} accessibilityLayer={false}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="week" tickLine={false} tickMargin={8} />
          <YAxis tickLine={false} width={40} />
          <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
          <ChartLegend content={<ChartLegendContent />} />
          {(["ronin", "paper", "night"] as const).map((key) => (
            <Line
              key={key}
              dataKey={key}
              type="monotone"
              stroke={`var(--color-${key})`}
              dot={false}
              isAnimationActive={false}
              {...strokes[key]}
            />
          ))}
        </LineChart>
      </ChartContainer>
      <figcaption className="text-center text-xs text-muted-foreground">
        Readers a week, thousands
      </figcaption>
      <table className="sr-only">
        <caption>Readers a week, thousands</caption>
        <thead>
          <tr>
            <th scope="col">Week</th>
            <th scope="col">Ronin Nights</th>
            <th scope="col">Paper Moon</th>
            <th scope="col">Night Bus</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.week}>
              <th scope="row">{row.week}</th>
              <td>{row.ronin}</td>
              <td>{row.paper}</td>
              <td>{row.night}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
