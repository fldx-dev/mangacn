import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getMDXComponents } from "@/components/docs/mdx";
import { source } from "@/lib/docs/source";

// Docs page, bare for now: the MDX body with its title and description. The docs layout,
// provider and styles arrive with the site shell (SPEC-docs-site §7).

export function generateStaticParams() {
  return source.generateParams();
}

// Static, as on the demo stage: with Partial Prefetching the App Shell is shared by every docs
// URL, so the page reads `params` only inside the Suspense below.
export const metadata: Metadata = { title: "mangacn docs" };

type DocsProps = PageProps<"/docs/[[...slug]]">;

export default function DocsRoute({ params }: DocsProps) {
  return (
    <main data-slot="docs-page">
      <Suspense fallback={null}>
        <DocsContent params={params} />
      </Suspense>
    </main>
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
    <article>
      <h1>{page.data.title}</h1>
      <p>{page.data.description}</p>
      <MDX components={getMDXComponents()} />
    </article>
  );
}
