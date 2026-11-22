// The variant's activity: one reader's two weeks in October 2026. Replace both constants with your
// own data (a fetch in the page, passed down as props); nothing here reads the clock, so the page
// renders the same on the server and the client, on any day.

/** What an event is about; the filter's values. */
export type ActivityKind = "reading" | "comments" | "follows";

/** One line of the timeline: "{actor} {action} *{title}*". */
export interface ActivityEvent {
  /** Stable and unique: the event's key and the id of its heading. */
  id: string;
  kind: ActivityKind;
  /** Who did it; the avatar shows their initials. */
  actor: string;
  /** What they did: "finished", "commented on", "followed". */
  action: string;
  /** What they did it to, set in italics: "Lantern Keepers, Volume 3". */
  title?: string;
  /** When, as a local ISO date and time without a zone ("2026-10-12T21:40"). */
  at: string;
}

/** One stat card: a value, its change in percent and seven days of history, oldest first. */
export interface ActivityStat {
  label: string;
  value: string;
  change: number;
  trend: number[];
}

/** The filter's buttons, in order; `all` shows every kind. */
export const ACTIVITY_FILTERS: { value: ActivityKind | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "reading", label: "Reading" },
  { value: "comments", label: "Comments" },
  { value: "follows", label: "Follows" },
];

/** The badge on each event. */
export const ACTIVITY_KIND_LABELS: Record<ActivityKind, string> = {
  reading: "Reading",
  comments: "Comment",
  follows: "Follow",
};

export const activityStats: ActivityStat[] = [
  { label: "Chapters read", value: "128", change: 14.2, trend: [12, 15, 14, 18, 17, 21, 24] },
  { label: "Reading streak", value: "12 days", change: 20, trend: [6, 7, 8, 9, 10, 11, 12] },
  { label: "Comments", value: "34", change: -8.1, trend: [6, 5, 7, 4, 5, 3, 4] },
  { label: "Followers", value: "210", change: 3.4, trend: [196, 199, 201, 203, 205, 208, 210] },
];

// Thirty events from October 12 to 25, 2026, newest first.
export const activityEvents: ActivityEvent[] = [
  ["reading", "Aiko", "finished", "Lantern Keepers, Volume 3", "2026-10-25T21:40"],
  ["comments", "Aiko", "commented on", "Lantern Keepers, Chapter 24", "2026-10-25T20:15"],
  ["follows", "Ren Kuroda", "followed", "Aiko", "2026-10-25T09:05"],
  ["reading", "Aiko", "read", "Kitchen Spirits, Chapter 31", "2026-10-24T22:30"],
  [
    "comments",
    "Mio Amano",
    "replied to Aiko on",
    "Kitchen Spirits, Chapter 31",
    "2026-10-24T18:02",
  ],
  ["reading", "Aiko", "started", "Starboard Academy", "2026-10-23T23:10"],
  ["follows", "Aiko", "followed", "Hana Mori", "2026-10-23T12:44"],
  ["reading", "Aiko", "read", "Moonlit Ronin, Chapter 12", "2026-10-22T21:05"],
  ["comments", "Aiko", "commented on", "Moonlit Ronin, Chapter 12", "2026-10-22T21:20"],
  ["reading", "Aiko", "finished", "Kitchen Spirits, Volume 4", "2026-10-21T20:50"],
  ["follows", "Sora Ito", "followed", "Aiko", "2026-10-21T08:30"],
  ["reading", "Aiko", "read", "Lantern Keepers, Chapter 23", "2026-10-20T22:12"],
  [
    "comments",
    "Kei Arata",
    "replied to Aiko on",
    "Lantern Keepers, Chapter 23",
    "2026-10-20T19:48",
  ],
  ["reading", "Aiko", "read", "Starboard Academy, Chapter 2", "2026-10-19T21:35"],
  ["follows", "Aiko", "followed", "Kei Arata", "2026-10-19T10:15"],
  ["reading", "Aiko", "read", "Starboard Academy, Chapter 1", "2026-10-18T23:02"],
  ["comments", "Aiko", "commented on", "Starboard Academy, Chapter 1", "2026-10-18T23:20"],
  ["reading", "Aiko", "read", "Moonlit Ronin, Chapter 11", "2026-10-17T20:40"],
  ["follows", "Yuki Sato", "followed", "Aiko", "2026-10-17T13:25"],
  ["reading", "Aiko", "finished", "Moonlit Ronin, Volume 2", "2026-10-16T22:55"],
  ["comments", "Aiko", "commented on", "Moonlit Ronin, Volume 2", "2026-10-16T23:05"],
  ["reading", "Aiko", "read", "Kitchen Spirits, Chapter 30", "2026-10-15T21:18"],
  [
    "comments",
    "Ren Kuroda",
    "replied to Aiko on",
    "Kitchen Spirits, Chapter 30",
    "2026-10-15T17:30",
  ],
  ["follows", "Aiko", "followed", "Ren Kuroda", "2026-10-14T19:00"],
  ["reading", "Aiko", "read", "Lantern Keepers, Chapter 22", "2026-10-14T22:40"],
  ["comments", "Aiko", "commented on", "Lantern Keepers, Chapter 22", "2026-10-13T08:10"],
  ["reading", "Aiko", "read", "Lantern Keepers, Chapter 21", "2026-10-13T21:55"],
  ["follows", "Mio Amano", "followed", "Aiko", "2026-10-12T16:20"],
  ["comments", "Aiko", "commented on", "Kitchen Spirits, Chapter 29", "2026-10-12T22:05"],
  ["reading", "Aiko", "read", "Kitchen Spirits, Chapter 29", "2026-10-12T21:40"],
]
  .map(([kind, actor, action, title, at], index) => ({
    id: `event-${index + 1}`,
    kind: kind as ActivityKind,
    actor,
    action,
    title,
    at,
  }))
  .sort((a, b) => b.at.localeCompare(a.at));
