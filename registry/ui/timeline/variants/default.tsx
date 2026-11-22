import {
  Timeline,
  TimelineContent,
  TimelineDescription,
  TimelineIndicator,
  TimelineItem,
  TimelineTime,
  TimelineTitle,
} from "@/registry/ui/timeline/timeline";

const releases = [
  {
    date: "2024-04-12",
    label: "April 2024",
    title: "One-shot in the spring issue",
    text: "Forty pages, first prize.",
  },
  {
    date: "2024-10-03",
    label: "October 2024",
    title: "Serialisation begins",
    text: "Chapter 1 opens the weekly.",
  },
  {
    date: "2025-06-20",
    label: "June 2025",
    title: "Volume 1 in stores",
    text: "Chapters 1 to 8 and a short.",
  },
];

export default function TimelineDefaultVariant() {
  return (
    <Timeline aria-label="Release history" className="w-full max-w-md">
      {releases.map((release) => (
        <TimelineItem key={release.date}>
          <TimelineIndicator />
          <TimelineContent>
            <TimelineTime dateTime={release.date}>{release.label}</TimelineTime>
            <TimelineTitle>{release.title}</TimelineTitle>
            <TimelineDescription>{release.text}</TimelineDescription>
          </TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  );
}
