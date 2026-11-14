import type { MetadataRoute } from "next";
import { source } from "@/lib/docs/source";
import { absoluteUrl } from "@/lib/site";

// Every indexable page: the landing, Create and each docs page. The demo stage and block views
// are `noindex`, so they are left out. No `lastModified`: the docs carry no dates, and a build
// date would claim every page changed on every deploy.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: absoluteUrl("/"), changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/create"), changeFrequency: "monthly", priority: 0.8 },
    ...source.getPages().map((page) => ({
      url: absoluteUrl(page.url),
      changeFrequency: "weekly" as const,
      priority: page.slugs.length <= 1 ? 0.9 : 0.7,
    })),
  ];
}
