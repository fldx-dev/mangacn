import { cacheLife } from "next/cache";
import { docsLlms, source } from "@/lib/docs/source";

// One docs page as Markdown, served at /docs/<slug>.md through the rewrite in next.config.ts.
// Every page prerenders; an unknown slug is a plain 404.

export function generateStaticParams() {
  return source.generateParams();
}

async function pageMarkdown(slug: string[] | undefined): Promise<string | null> {
  "use cache";
  cacheLife({ revalidate: Infinity, expire: Infinity });
  const page = source.getPage(slug);
  return page ? docsLlms.page(page) : null;
}

export async function GET(_request: Request, { params }: RouteContext<"/llms.mdx/[[...slug]]">) {
  const { slug } = await params;
  const markdown = await pageMarkdown(slug);
  if (markdown === null) {
    return new Response("Not found\n", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
  return new Response(markdown, {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
