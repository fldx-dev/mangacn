import { HomeLayout } from "fumadocs-ui/layouts/home";
import type { Metadata } from "next";
import { LandingSections } from "@/components/docs/landing/landing-sections";
import { faqJsonLd } from "@/lib/docs/faq";
import { baseOptions } from "@/lib/docs/layout.shared";
import { jsonLdHtml, siteJsonLd } from "@/lib/docs/seo";

// The root layout's default title and description; only the canonical URL is the landing's own.
export const metadata: Metadata = {
  alternates: { canonical: "/", types: { "text/plain": "/llms.txt" } },
};

// The landing (SPEC-docs-site §4.1): the Fumadocs navbar, then the sections, all built from
// registry items and prerendered.
export default function Home() {
  return (
    <HomeLayout {...baseOptions()}>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD built from site constants, `<` escaped.
        dangerouslySetInnerHTML={{ __html: jsonLdHtml(siteJsonLd()) }}
      />
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD built from lib/docs/faq.ts, `<` escaped.
        dangerouslySetInnerHTML={{ __html: jsonLdHtml(faqJsonLd()) }}
      />
      <LandingSections />
    </HomeLayout>
  );
}
