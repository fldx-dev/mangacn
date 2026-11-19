"use client";

import { cn } from "cn";
import { ArrowDownIcon, ArrowUpIcon, MinusIcon } from "lucide-react";
import type * as React from "react";
import { Area, AreaChart, Line, LineChart } from "recharts";
import { Card } from "@/components/ui/card";
import { type ChartConfig, ChartContainer } from "@/components/ui/chart";

// mangacn stat card: a KPI on card's ink frame. The value is the one display face here; the
// change reads as words ("up 12.5% vs last month"), in spot only when it goes the bad way; the
// sparkline is decoration in ink over a tone, through chart's container.

/** Built-in words, each overridable through `labels`. */
const defaultChangeLabels = { up: "up", down: "down", flat: "no change" };

const trendIcons = { up: ArrowUpIcon, down: ArrowDownIcon, flat: MinusIcon };

const sparklineConfig = { value: { label: "Value", color: "var(--ink)" } } satisfies ChartConfig;

/** Card's props. Label, value, change and sparkline go inside. */
export interface StatCardProps extends React.ComponentProps<typeof Card> {
  /**
   * Card's spacing; `sm` is tighter.
   * @default "default"
   */
  size?: "default" | "sm";
  /**
   * Card's shadow: none, a solid ink one or a hatched one.
   * @default "none"
   */
  shadow?: "none" | "ink" | "hatch";
}

export function StatCard({ className, ...props }: StatCardProps) {
  return (
    <Card
      data-slot="stat-card"
      className={cn("min-w-0 gap-1 [--card-spacing:--spacing(4)]", className)}
      {...props}
    />
  );
}

export function StatCardLabel({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="stat-card-label"
      className={cn("truncate px-(--card-spacing) text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

/** Any node: the app formats the number. */
export function StatCardValue({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="stat-card-value"
      className={cn(
        "truncate px-(--card-spacing) font-display text-3xl leading-tight tracking-wide tabular-nums",
        className,
      )}
      {...props}
    />
  );
}

export interface StatCardChangeProps extends Omit<React.ComponentProps<"div">, "children"> {
  /**
   * The change in percent, signed: `12.5` is up 12.5%, `-3` down 3%, `0` flat. `NaN` (a change
   * from zero, say) renders the flat state, "0%".
   */
  value: number;
  /**
   * Which way is good. A change the other way is drawn in spot; a good or flat one in ink.
   * @default "up"
   */
  goodDirection?: "up" | "down";
  /** The period, after the number: "vs last month". */
  children?: React.ReactNode;
  /**
   * The direction words screen readers hear before the number.
   * @default { up: "up", down: "down", flat: "no change" }
   */
  labels?: Partial<typeof defaultChangeLabels>;
  /**
   * The locale the percentage is formatted in, through `Intl.NumberFormat`.
   * @default "en-US"
   */
  locale?: string;
}

export function StatCardChange({
  value,
  goodDirection = "up",
  labels,
  locale = "en-US",
  className,
  children,
  ...props
}: StatCardChangeProps) {
  const words = { ...defaultChangeLabels, ...labels };
  const change = Number.isNaN(value) ? 0 : value;
  const trend = change > 0 ? "up" : change < 0 ? "down" : "flat";
  const good = trend === "flat" || trend === goodDirection;
  const Icon = trendIcons[trend];
  const percent = new Intl.NumberFormat(locale, {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(Math.abs(change) / 100);

  return (
    <div
      data-slot="stat-card-change"
      data-trend={trend}
      data-good={good ? "" : undefined}
      className={cn(
        "flex min-w-0 items-center gap-1 px-(--card-spacing) text-sm text-ink",
        !good && "text-spot",
        className,
      )}
      {...props}
    >
      <Icon aria-hidden="true" className="size-4 shrink-0" />
      <span className="sr-only">{words[trend]} </span>
      <span className="font-medium tabular-nums">{percent}</span>
      {children && <span className="truncate text-muted-foreground">{children}</span>}
    </div>
  );
}

export interface StatCardSparklineProps extends Omit<React.ComponentProps<"div">, "children"> {
  /** The series, oldest first. */
  data: number[];
  /**
   * A line, or a line with a tone fill under it.
   * @default "area"
   */
  variant?: "line" | "area";
}

/** Decoration: the number carries the meaning, so the sparkline is hidden from assistive tech. */
export function StatCardSparkline({
  data,
  variant = "area",
  className,
  ...props
}: StatCardSparklineProps) {
  const points = data.map((value, index) => ({ index, value }));
  const margin = { top: 4, right: 0, bottom: 0, left: 0 };
  return (
    <div
      data-slot="stat-card-sparkline"
      data-variant={variant}
      aria-hidden="true"
      className={cn("mt-2 px-(--card-spacing)", className)}
      {...props}
    >
      <ChartContainer config={sparklineConfig} className="aspect-auto h-12 w-full">
        {variant === "line" ? (
          <LineChart data={points} margin={margin} accessibilityLayer={false}>
            <Line
              dataKey="value"
              type="monotone"
              stroke="var(--color-value)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        ) : (
          <AreaChart data={points} margin={margin} accessibilityLayer={false}>
            <Area
              dataKey="value"
              type="monotone"
              stroke="var(--color-value)"
              strokeWidth={2}
              fill="var(--tone-1)"
              fillOpacity={1}
              isAnimationActive={false}
            />
          </AreaChart>
        )}
      </ChartContainer>
    </div>
  );
}
