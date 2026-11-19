// The settings page's data: the reader's saved settings and the choices each control offers.
// This is sample data; replace `settings` with what your account store returns.

export type EmailFrequency = "instant" | "daily" | "weekly";
export type ReadingDirection = "rtl" | "ltr";
export type PageLayout = "single" | "spread";

/** Everything the settings form edits, as one plain object. */
export interface Settings {
  /** The name other readers see. Required. */
  displayName: string;
  email: string;
  /** A value of `settingsLanguages`. */
  language: string;
  /** A value of `settingsTimeZones` (an IANA time zone). */
  timeZone: string;
  notifications: {
    newChapters: boolean;
    replies: boolean;
    weeklyDigest: boolean;
  };
  emailFrequency: EmailFrequency;
  readingDirection: ReadingDirection;
  pageLayout: PageLayout;
  /** Show a warning before a chapter flagged for mature content. */
  contentWarnings: boolean;
}

export interface SettingsOption<T extends string = string> {
  label: string;
  value: T;
}

export const settingsLanguages: SettingsOption[] = [
  { label: "English", value: "en" },
  { label: "日本語 (Japanese)", value: "ja" },
  { label: "Français (French)", value: "fr" },
  { label: "Español (Spanish)", value: "es" },
];

export const settingsTimeZones: SettingsOption[] = [
  { label: "Asia/Tokyo (UTC+9)", value: "Asia/Tokyo" },
  { label: "Europe/Paris (UTC+1)", value: "Europe/Paris" },
  { label: "America/New_York (UTC−5)", value: "America/New_York" },
  { label: "America/Los_Angeles (UTC−8)", value: "America/Los_Angeles" },
];

export const settingsEmailFrequencies: SettingsOption<EmailFrequency>[] = [
  { label: "As it happens", value: "instant" },
  { label: "Once a day", value: "daily" },
  { label: "Once a week", value: "weekly" },
];

export const settings: Settings = {
  displayName: "Aiko Tanaka",
  email: "aiko@example.com",
  language: "en",
  timeZone: "Asia/Tokyo",
  notifications: { newChapters: true, replies: true, weeklyDigest: false },
  emailFrequency: "daily",
  readingDirection: "rtl",
  pageLayout: "spread",
  contentWarnings: true,
};
