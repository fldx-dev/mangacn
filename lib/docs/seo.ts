import type { Metadata } from "next";
import {
  absoluteUrl,
  OG_IMAGE,
  REPOSITORY_URL,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
} from "@/lib/site";
import { markdownUrl } from "./llms";

/** The fields of a docs page that its metadata and JSON-LD read. */
export interface SeoPage {
  url: string;
  slugs: string[];
  data: { title: string; description?: string };
}

const SECTION_NAMES: Record<string, string> = { components: "Components", blocks: "Blocks" };

/**
 * The `<title>` of a docs page (the root template appends " · mangacn"). An item page says
 * what the item is, in the words people search with ("Speech Bubble: manga React component"),
 * so search results and AI answers can tell it apart from the stock shadcn one.
 */
export function docsTitle(page: SeoPage): string {
  const [section, item] = page.slugs;
  if (item && section === "components") return `${page.data.title}: manga React component`;
  if (item && section === "blocks") return `${page.data.title}: manga shadcn block`;
  if (page.slugs.length === 0) return "Docs";
  return page.data.title;
}

/** A docs page's metadata: its own title, description, canonical URL and Markdown copy. */
export function docsMetadata(page: SeoPage): Metadata {
  const title = docsTitle(page);
  const description = page.data.description ?? SITE_DESCRIPTION;
  return {
    title,
    description,
    alternates: {
      canonical: page.url,
      // The same page as Markdown (/docs/<slug>.md), for agents and AI crawlers.
      types: { "text/markdown": markdownUrl(page.url) },
    },
    openGraph: {
      type: "article",
      siteName: SITE_NAME,
      title: `${title} · ${SITE_NAME}`,
      description,
      url: page.url,
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} · ${SITE_NAME}`,
      description,
      images: [OG_IMAGE],
    },
  };
}

/** JSON-LD for a docs page: the article and its breadcrumb trail. */
export function docsJsonLd(page: SeoPage): object {
  const url = absoluteUrl(page.url);
  const crumbs = [
    { name: "Docs", url: absoluteUrl("/docs") },
    ...page.slugs.map((slug, i) => ({
      name:
        i === page.slugs.length - 1
          ? page.data.title
          : (SECTION_NAMES[slug] ?? slug.replace(/-/g, " ")),
      url: absoluteUrl(`/docs/${page.slugs.slice(0, i + 1).join("/")}`),
    })),
  ];
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TechArticle",
        "@id": `${url}#article`,
        headline: page.data.title,
        description: page.data.description,
        url,
        inLanguage: "en",
        isPartOf: { "@id": `${SITE_URL}/#website` },
        about: { "@id": `${SITE_URL}/#software` },
        publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: crumbs.map((crumb, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: crumb.name,
          item: crumb.url,
        })),
      },
    ],
  };
}

/** JSON-LD for the landing: the site and the component library it ships. */
export function siteJsonLd(): object {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        name: SITE_NAME,
        url: SITE_URL,
        description: SITE_DESCRIPTION,
        inLanguage: "en",
      },
      {
        "@type": "SoftwareSourceCode",
        "@id": `${SITE_URL}/#software`,
        name: SITE_NAME,
        description: SITE_DESCRIPTION,
        url: SITE_URL,
        codeRepository: REPOSITORY_URL,
        programmingLanguage: ["TypeScript", "React"],
        runtimePlatform: "React",
        license: "https://opensource.org/licenses/MIT",
        isAccessibleForFree: true,
        keywords: "manga, React, shadcn/ui, shadcn registry, Tailwind CSS, UI components",
      },
    ],
  };
}

/**
 * A JSON-LD `<script>` body. `<` is escaped so a string in the data can never close the tag.
 */
export function jsonLdHtml(data: object): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
