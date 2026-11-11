"use client";

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
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
  { month: "Jan", print: 42, digital: 28 },
  { month: "Feb", print: 36, digital: 31 },
  { month: "Mar", print: 30, digital: 39 },
  { month: "Apr", print: 33, digital: 44 },
];

// Series told apart by screentone, not hue: each colour is a chart-tones fill.
const config = {
  print: { label: "Print", color: chartToneFill("dots4") },
  digital: { label: "Digital", color: chartToneFill("hatch") },
} satisfies ChartConfig;

export default function ChartDefaultDemo() {
  return (
    <figure className="flex w-full max-w-sm flex-col gap-1 text-ink">
      <ChartTones />
      <ChartContainer config={config} className="aspect-auto h-48 w-full">
        <BarChart data={data} accessibilityLayer={false}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          {(["print", "digital"] as const).map((key) => (
            <Bar
              key={key}
              dataKey={key}
              fill={`var(--color-${key})`}
              stroke="var(--ink)"
              strokeWidth={1.5}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ChartContainer>
      <figcaption className="text-center text-xs text-muted-foreground">
        Volumes sold, thousands, January to April
      </figcaption>
      <table className="sr-only">
        <caption>Volumes sold, thousands</caption>
        <thead>
          <tr>
            <th scope="col">Month</th>
            <th scope="col">Print</th>
            <th scope="col">Digital</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.month}>
              <th scope="row">{row.month}</th>
              <td>{row.print}</td>
              <td>{row.digital}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
