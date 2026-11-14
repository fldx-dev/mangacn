// The site's name, address and pitch, shared by the root metadata, robots.txt, the sitemap,
// the Open Graph image and the JSON-LD. The canonical host is www (the apex redirects to it).

export const SITE_URL = "https://www.mangacn.com";
export const SITE_NAME = "mangacn";
export const REPOSITORY_URL = "https://github.com/fldx-dev/mangacn";

/** The default `<title>`: the name plus what it is, in the words people search with. */
export const SITE_TITLE = "mangacn: manga-styled React components for shadcn/ui";

/** The default meta description (about 155 characters, so search results show it whole). */
export const SITE_DESCRIPTION =
  "Open-source manga-styled React components for shadcn/ui: speech bubbles, screentone, ink panels, SFX lettering and page blocks. Install them with the shadcn CLI.";

/**
 * The share card (app/opengraph-image.tsx). A page that sets its own `openGraph` replaces the
 * root's whole object, file-based image included, so it lists this one again.
 */
export const OG_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: SITE_TITLE,
};

/** Absolute URL of a site path. */
export function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
}
