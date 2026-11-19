import {
  StatCard,
  StatCardChange,
  StatCardLabel,
  StatCardSparkline,
  StatCardValue,
} from "@/registry/ui/stat-card/stat-card";

export default function StatCardDefaultDemo() {
  return (
    <StatCard className="w-full max-w-xs">
      <StatCardLabel>Monthly readers</StatCardLabel>
      <StatCardValue>48,210</StatCardValue>
      <StatCardChange value={12.5}>vs last month</StatCardChange>
      <StatCardSparkline data={[31, 34, 33, 38, 36, 41, 44, 43, 48]} />
    </StatCard>
  );
}
