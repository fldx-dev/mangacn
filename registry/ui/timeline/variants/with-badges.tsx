import { Badge } from "@/registry/ui/badge/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/registry/ui/card/card";
import {
  Timeline,
  TimelineContent,
  TimelineDescription,
  TimelineIndicator,
  TimelineItem,
  TimelineTime,
  TimelineTitle,
} from "@/registry/ui/timeline/timeline";

// A series page's update feed in a card: each entry carries a badge for its kind.
const updates = [
  {
    date: "2026-11-27",
    label: "Nov 27",
    title: "Chapter 113",
    text: "Out next Friday.",
    badge: "Next",
    variant: "outline",
    status: "upcoming",
  },
  {
    date: "2026-11-20",
    label: "Nov 20",
    title: "Chapter 112",
    text: "The rooftop chase ends.",
    badge: "New",
    variant: "default",
    status: "current",
  },
  {
    date: "2026-11-13",
    label: "Nov 13",
    title: "One week break",
    text: "The author is on a research trip.",
    badge: "Notice",
    variant: "spot",
    status: "done",
  },
  {
    date: "2026-11-06",
    label: "Nov 6",
    title: "Chapter 111",
    text: "Four colour pages open the chapter.",
    badge: "Colour",
    variant: "secondary",
    status: "done",
  },
] as const;

export default function TimelineWithBadgesVariant() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>
          <h3 id="timeline-badges-title">Updates</h3>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Timeline aria-labelledby="timeline-badges-title">
          {updates.map((update) => (
            <TimelineItem key={update.date} status={update.status}>
              <TimelineIndicator />
              <TimelineContent>
                <div className="flex flex-wrap items-center gap-2">
                  <TimelineTime dateTime={update.date}>{update.label}</TimelineTime>
                  <Badge variant={update.variant}>{update.badge}</Badge>
                </div>
                <TimelineTitle>{update.title}</TimelineTitle>
                <TimelineDescription>{update.text}</TimelineDescription>
              </TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>
      </CardContent>
    </Card>
  );
}
