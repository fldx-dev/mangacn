import type { Metadata } from "next";
import { Dela_Gothic_One, Geist, Geist_Mono, Shantell_Sans, Yusei_Magic } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

// Japanese glyphs ship as Google's unicode-range slices without a "japanese" subset entry
// (next/font only lists preloadable subsets); see SPEC-manga-theme §8.
const delaGothicOne = Dela_Gothic_One({
  variable: "--font-display",
  weight: "400",
  subsets: ["latin", "latin-ext"],
});

// Variable font (300–800); italic is loaded here because registry:font cannot request it.
const shantellSans = Shantell_Sans({
  variable: "--font-dialogue",
  subsets: ["latin", "latin-ext"],
  style: ["normal", "italic"],
});

// Japanese fallback of the dialogue stack (Shantell Sans has no kana or kanji). Like the
// display face, the Japanese glyphs come as unicode-range slices fetched on use; the Latin
// slice is never drawn (Shantell Sans covers Latin first), so it is not preloaded.
const yuseiMagic = Yusei_Magic({
  variable: "--font-dialogue-ja",
  weight: "400",
  subsets: ["latin"],
  preload: false,
});

export const metadata: Metadata = {
  title: "mangacn",
  description: "Manga-styled React components, distributed as a shadcn registry.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${delaGothicOne.variable} ${shantellSans.variable} ${yuseiMagic.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
