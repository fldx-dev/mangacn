import { useId } from "react";
import {
  StatCard,
  StatCardChange,
  StatCardLabel,
  StatCardSparkline,
  StatCardValue,
} from "@/components/ui/stat-card";
import type { ActivityStat } from "./activity-data";

export interface ActivityStatsProps {
  /** The four cards, in order: a value, its change and seven days of history each. */
  stats: ActivityStat[];
  /**
   * The section's heading, read by screen readers only.
   * @default "Overview"
   */
  title?: string;
}

/** A row of stat cards: one column on a phone, two on a tablet, four on a desktop. */
export function ActivityStats({ stats, title = "Overview" }: ActivityStatsProps) {
  const titleId = useId();
  return (
    <section aria-labelledby={titleId}>
      <h2 id={titleId} className="sr-only">
        {title}
      </h2>
      <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <li key={stat.label} className="flex min-w-0 flex-col">
            <StatCard className="flex-1">
              <StatCardLabel>{stat.label}</StatCardLabel>
              <StatCardValue>{stat.value}</StatCardValue>
              <StatCardChange value={stat.change}>vs last week</StatCardChange>
              <StatCardSparkline data={stat.trend} />
            </StatCard>
          </li>
        ))}
      </ul>
    </section>
  );
}
