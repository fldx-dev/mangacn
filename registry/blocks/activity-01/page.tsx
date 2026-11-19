import { activityEvents, activityStats } from "./components/activity-data";
import { ActivityFeed } from "./components/activity-feed";
import { ActivityStats } from "./components/activity-stats";

// A reader's own activity: four stat cards, then a filterable timeline of what they read, what
// they wrote and who followed whom. Replace the two constants in activity-data.ts with your fetch.
export default function Page() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-8 md:px-8 md:py-12">
      <h1 className="font-display text-3xl">Activity</h1>
      <ActivityStats stats={activityStats} />
      <ActivityFeed events={activityEvents} />
    </main>
  );
}
