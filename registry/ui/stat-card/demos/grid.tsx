import {
  StatCard,
  StatCardChange,
  StatCardLabel,
  StatCardSparkline,
  StatCardValue,
} from "@/registry/ui/stat-card/stat-card";

// Four KPIs for a reading app. The grid follows its container: one column on a phone, two on a
// tablet, four on a desktop. Churn falls the good way, so its rise is the one change in spot.
export default function StatCardGridDemo() {
  return (
    <div className="@container w-full max-w-6xl">
      <div className="grid grid-cols-1 gap-4 @2xl:grid-cols-2 @5xl:grid-cols-4">
        <StatCard>
          <StatCardLabel>Readers</StatCardLabel>
          <StatCardValue>48,210</StatCardValue>
          <StatCardChange value={12.5}>vs last month</StatCardChange>
          <StatCardSparkline data={[31, 34, 33, 38, 36, 41, 44, 43, 48]} />
        </StatCard>
        <StatCard>
          <StatCardLabel>Chapters read</StatCardLabel>
          <StatCardValue>1.2M</StatCardValue>
          <StatCardChange value={4.1}>vs last month</StatCardChange>
          <StatCardSparkline data={[9, 10, 10, 11, 10, 11, 12, 12]} variant="line" />
        </StatCard>
        <StatCard>
          <StatCardLabel>Average rating</StatCardLabel>
          <StatCardValue>4.6</StatCardValue>
          <StatCardChange value={0}>vs last month</StatCardChange>
          <StatCardSparkline data={[4.5, 4.6, 4.6, 4.5, 4.6, 4.6, 4.6]} />
        </StatCard>
        <StatCard>
          <StatCardLabel>Churn</StatCardLabel>
          <StatCardValue>3.8%</StatCardValue>
          <StatCardChange value={0.6} goodDirection="down">
            vs last month
          </StatCardChange>
          <StatCardSparkline data={[3.1, 3.0, 3.3, 3.2, 3.5, 3.6, 3.8]} variant="line" />
        </StatCard>
      </div>
    </div>
  );
}
