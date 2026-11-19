// The demo's choices and starting answers. Replace them with your own; the flow keeps its answers
// in local state and posts nothing, so wire `onComplete` to your save.

/** Where the reader mostly reads: the Profile step's radio group. */
export type OnboardingDevice = "phone" | "tablet" | "computer";

/** Which way pages turn: the Habits step's toggle group. */
export type OnboardingDirection = "rtl" | "ltr";

/** Everything the flow asks, in the shape a form would post it. */
export interface OnboardingAnswers {
  /** Required. */
  name: string;
  device: OnboardingDevice;
  /** At least `ONBOARDING_MIN_GENRES` of `onboardingGenres`. */
  genres: string[];
  /** A daily reminder to read. */
  reminder: boolean;
  /** The reminder's time, "HH:mm" in 24 hours; null while unset. */
  reminderTime: string | null;
  direction: OnboardingDirection;
}

/** The four steps, in order: three forms, then the summary. */
export const ONBOARDING_STEPS = ["Profile", "Interests", "Habits", "Done"] as const;

/** How many genres the Interests step asks for. */
export const ONBOARDING_MIN_GENRES = 3;

export const onboardingDevices: { value: OnboardingDevice; label: string }[] = [
  { value: "phone", label: "On my phone" },
  { value: "tablet", label: "On a tablet" },
  { value: "computer", label: "On a computer" },
];

export const onboardingDirections: { value: OnboardingDirection; label: string }[] = [
  { value: "rtl", label: "Right to left" },
  { value: "ltr", label: "Left to right" },
];

export const onboardingGenres: string[] = [
  "Action",
  "Adventure",
  "Comedy",
  "Drama",
  "Fantasy",
  "Historical",
  "Horror",
  "Mystery",
  "Romance",
  "Sci-fi",
  "Slice of life",
  "Sports",
];

/** Where a new reader starts: no name, no genres, the reminder off at 21:00. */
export const onboardingDefaults: OnboardingAnswers = {
  name: "",
  device: "phone",
  genres: [],
  reminder: false,
  reminderTime: "21:00",
  direction: "rtl",
};
