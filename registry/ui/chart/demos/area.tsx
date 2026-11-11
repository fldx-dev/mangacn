"use client";

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/registry/ui/chart/chart";
import { ChartTones, chartToneFill } from "@/registry/ui/chart-tones/chart-tones";

const data = [
  { day: "Mon", average: 34, today: 28 },
  { day: "Tue", average: 31, today: 35 },
  { day: "Wed", average: 36, today: 30 },
  { day: "Thu", average: 33, today: 46 },
  { day: "Fri", average: 38, today: 52 },
];

// One spot series over an ink one: the spot area takes a second tone set drawn in the spot
// colour (prefix "spot-"), the average an ink hatch.
const config = {
  average: { label: "Average", color: "var(--chart-1)" },
  today: { label: "This week", color: "var(--spot)" },
} satisfies ChartConfig;

export default function ChartAreaDemo() {
  return (
    <figure className="flex w-full max-w-sm flex-col gap-1 text-ink">
      <ChartTones />
      <ChartTones prefix="spot-" className="text-spot" />
      <ChartContainer config={config} className="aspect-auto h-48 w-full">
        <AreaChart data={data} margin={{ left: 20, right: 20 }} accessibilityLayer={false}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} />
          <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Area
            dataKey="average"
            type="monotone"
            stroke="var(--color-average)"
            strokeWidth={1.5}
            fill={chartToneFill("hatch")}
            isAnimationActive={false}
          />
          <Area
            dataKey="today"
            type="monotone"
            stroke="var(--color-today)"
            strokeWidth={2.5}
            fill={chartToneFill("dots2", "spot-")}
            isAnimationActive={false}
          />
        </AreaChart>
      </ChartContainer>
      <figcaption className="text-center text-xs text-muted-foreground">
        Minutes read a day: this week against the average
      </figcaption>
      <table className="sr-only">
        <caption>Minutes read a day</caption>
        <thead>
          <tr>
            <th scope="col">Day</th>
            <th scope="col">Average</th>
            <th scope="col">This week</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.day}>
              <th scope="row">{row.day}</th>
              <td>{row.average}</td>
              <td>{row.today}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
