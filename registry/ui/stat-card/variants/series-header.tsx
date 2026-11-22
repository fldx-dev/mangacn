import {
  StatCard,
  StatCardChange,
  StatCardLabel,
  StatCardValue,
} from "@/registry/ui/stat-card/stat-card";

// A series page's header: the title, then three small cards with hatched shadows and no
// sparkline. Weekly readers fell, so theirs is the one change in spot.
export default function StatCardSeriesHeaderVariant() {
  return (
    <section
      aria-labelledby="stat-card-series-title"
      className="flex w-full max-w-2xl flex-col gap-4"
    >
      <div>
        <h3 id="stat-card-series-title" className="font-display text-2xl tracking-wide">
          Ink &amp; Steel
        </h3>
        <p className="text-sm text-muted-foreground">Weekly, by Aiko Mori</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard size="sm" shadow="hatch">
          <StatCardLabel>Followers</StatCardLabel>
          <StatCardValue>82,400</StatCardValue>
          <StatCardChange value={6.2}>this week</StatCardChange>
        </StatCard>
        <StatCard size="sm" shadow="hatch">
          <StatCardLabel>Likes</StatCardLabel>
          <StatCardValue>12,100</StatCardValue>
          <StatCardChange value={4.1}>this week</StatCardChange>
        </StatCard>
        <StatCard size="sm" shadow="hatch">
          <StatCardLabel>Readers</StatCardLabel>
          <StatCardValue>31,900</StatCardValue>
          <StatCardChange value={-3.4}>this week</StatCardChange>
        </StatCard>
      </div>
    </section>
  );
}
