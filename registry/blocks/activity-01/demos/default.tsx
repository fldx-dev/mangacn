import {
  activityEvents,
  activityStats,
} from "@/registry/blocks/activity-01/components/activity-data";
import { ActivityFeed } from "@/registry/blocks/activity-01/components/activity-feed";
import { ActivityStats } from "@/registry/blocks/activity-01/components/activity-stats";

// The page's content without its `main` and `h1`; /view/activity-01 is the whole page.
export default function Activity01DefaultDemo() {
  return (
    <div className="flex w-full max-w-7xl flex-col gap-10">
      <ActivityStats stats={activityStats} />
      <ActivityFeed events={activityEvents} />
    </div>
  );
}
