import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

// One wildcard rule, so search, AI-answer and agent crawlers all read the docs, the registry
// JSON (/r/) and the Markdown copies (llms.txt, /docs/*.md). The demo stage and block views stay
// crawlable because the docs frame them; they carry `noindex` themselves. Only the API is closed.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}
