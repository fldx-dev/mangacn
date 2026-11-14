import type { Metadata } from "next";
import { Dela_Gothic_One, Geist, Geist_Mono, Shantell_Sans, Yusei_Magic } from "next/font/google";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from "@/lib/site";
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
  variable: "--font-dialogue-latin",
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

// Pages set their own title (the template appends the name) and their own canonical URL; a
// canonical here would leak into every page that sets none. The Open Graph image comes from
// app/opengraph-image.tsx.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_TITLE, template: `%s · ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: "/",
    locale: "en_US",
  },
  twitter: { card: "summary_large_image", title: SITE_TITLE, description: SITE_DESCRIPTION },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      // next-themes (site provider) sets the theme class before hydration.
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${delaGothicOne.variable} ${shantellSans.variable} ${yuseiMagic.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
