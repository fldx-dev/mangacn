import {
  Timeline,
  TimelineContent,
  TimelineDescription,
  TimelineIndicator,
  TimelineItem,
  TimelineTime,
  TimelineTitle,
} from "@/registry/ui/timeline/timeline";

const year = [
  {
    date: "2026-01",
    label: "January",
    title: "Storyboards approved",
    text: "Twelve episodes boarded.",
    status: "done",
  },
  {
    date: "2026-04",
    label: "April",
    title: "Key animation",
    text: "Episodes 1 to 6 in key frames.",
    status: "done",
  },
  {
    date: "2026-08",
    label: "August",
    title: "Inking and colour",
    text: "Clean-up on the first cour.",
    status: "current",
  },
  {
    date: "2026-11",
    label: "November",
    title: "Broadcast",
    text: "Episode 1 airs on a Sunday night.",
    status: "upcoming",
  },
] as const;

export default function TimelineAlternateDemo() {
  return (
    <Timeline align="alternate" aria-label="The studio's year" className="w-full max-w-2xl">
      {year.map((event) => (
        <TimelineItem key={event.date} status={event.status}>
          <TimelineIndicator />
          <TimelineContent>
            <TimelineTime dateTime={event.date}>{event.label}</TimelineTime>
            <TimelineTitle>{event.title}</TimelineTitle>
            <TimelineDescription>{event.text}</TimelineDescription>
          </TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  );
}
