// The Showcase page's examples: sites built with mangacn, all from the mangacn-showcase repo.
// Items are registry names; the page links each to its docs page where one exists.

export const SHOWCASE_REPOSITORY_URL = "https://github.com/fldx-dev/mangacn-showcase";

export type ShowcaseKind = "Reader app" | "Dashboard" | "Portfolio" | "Landing page";

export interface ShowcaseExample {
  /** Folder in the showcase repo; also the key. */
  id: string;
  title: string;
  /** One line on what the site is. */
  description: string;
  kind: ShowcaseKind;
  /** The mangacn items the site installs directly, as registry names. */
  items: readonly string[];
  /** The app's folder on GitHub. */
  sourceUrl: string;
  /** The deployed site; no button when missing. */
  liveUrl?: string;
  /** A 1280×800 shot under `public/`. */
  screenshot: string;
  /** Shown under the description when set. */
  note?: string;
}

const source = (folder: string) => `${SHOWCASE_REPOSITORY_URL}/tree/main/${folder}`;

export const SHOWCASE: readonly ShowcaseExample[] = [
  {
    id: "reader",
    title: "Inkwell",
    description:
      "A webcomic reading site for three original series: a library of chapters in progress, series pages with chapters, volumes and cast, and a chapter reader that turns two-page spreads.",
    kind: "Reader app",
    items: [
      "theme",
      "theme-sepia",
      "library-page",
      "series-page",
      "chapter-list",
      "volume-grid",
      "character-card",
      "sidebar-07",
      "panel",
      "caption-box",
      "speech-bubble",
      "reader",
      "spread-viewer",
      "page-turn",
      "page-number",
    ],
    sourceUrl: source("reader"),
    screenshot: "/showcase/reader-chapter.webp",
  },
  {
    id: "studio",
    title: "Studio",
    description:
      "A creator dashboard for an invented manga studio: an overview of screentone charts and recent activity, a file manager with uploads, profile and settings forms, onboarding, and split-screen log-in and sign-up.",
    kind: "Dashboard",
    items: [
      "theme",
      "theme-blueline",
      "login-02",
      "signup-02",
      "sidebar-08",
      "manga-frame",
      "halftone-background",
      "focus-lines",
      "sfx-text",
      "panel",
      "chart",
      "chart-tones",
      "activity-01",
      "ink-splash-loader",
      "file-manager-01",
      "upload-01",
      "profile-01",
      "settings-01",
      "sonner",
      "onboarding-01",
    ],
    sourceUrl: source("studio"),
    screenshot: "/showcase/studio-overview.webp",
  },
  {
    id: "portfolio",
    title: "Oriha Sumi",
    description:
      "The site of an invented manga artist: works as character cards, a studio diary with vertical titles, and a contact form told as a chat.",
    kind: "Portfolio",
    items: [
      "theme",
      "theme-weekly",
      "manga-frame",
      "thought-bubble",
      "ink-arrow",
      "ink-mark",
      "character-card",
      "caption-box",
      "vertical-text",
      "chat-thread",
    ],
    sourceUrl: source("portfolio"),
    screenshot: "/showcase/portfolio.webp",
  },
  {
    id: "onepiece",
    title: "One Piece fan page",
    description:
      "A fan landing page for the One Piece manga: a hero spread, a wall of wanted posters for the crew, and a saga chart.",
    kind: "Landing page",
    items: [
      "theme",
      "ink-frame",
      "button",
      "badge",
      "card",
      "panel",
      "panel-grid",
      "speech-bubble",
      "sfx-text",
      "sfx-ticker",
      "vertical-text",
      "speed-lines",
      "focus-lines",
      "halftone-background",
      "emanata",
      "stamp",
      "ink-splatter",
      "caption-box",
      "power-gauge",
    ],
    sourceUrl: source("onepiece"),
    screenshot: "/showcase/onepiece.webp",
    note: "Unofficial fan page, not affiliated with the series' owners. The repo ships no series artwork; the screenshot shows the typeset stand-ins it draws instead.",
  },
];
