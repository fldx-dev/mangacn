import { cacheLife } from "next/cache";
import { docsLlms } from "@/lib/docs/source";

// Every docs page as Markdown in one file, rendered at build time: the props tables run the
// TypeScript compiler, which the server does not have.

async function full(): Promise<string> {
  "use cache";
  cacheLife({ revalidate: Infinity, expire: Infinity });
  return docsLlms.full();
}

export async function GET() {
  return new Response(await full(), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
