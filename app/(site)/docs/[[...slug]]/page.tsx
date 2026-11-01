import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/layouts/docs/page";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getMDXComponents } from "@/components/docs/mdx";
import { source } from "@/lib/docs/source";

export function generateStaticParams() {
  return source.generateParams();
}

// Static, as on the demo stage: with Partial Prefetching the App Shell is shared by every docs
// URL, so the page reads `params` only inside the Suspense below.
export const metadata: Metadata = { title: "mangacn docs" };

type DocsProps = PageProps<"/docs/[[...slug]]">;

export default function DocsRoute({ params }: DocsProps) {
  return (
    <Suspense fallback={null}>
      <DocsContent params={params} />
    </Suspense>
  );
}

async function DocsContent({ params }: Pick<DocsProps, "params">) {
  const { slug } = await params;
  const page = source.getPage(slug);
  // Inside the boundary the shell has already streamed, so an unknown slug shows the
  // not-found page with a 200 (`dynamicParams = false` is not allowed with cacheComponents).
  if (!page) notFound();
  const MDX = page.data.body;
  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody>
        <MDX components={getMDXComponents()} />
      </DocsBody>
    </DocsPage>
  );
}
