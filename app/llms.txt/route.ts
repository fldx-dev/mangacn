import { cacheLife } from "next/cache";
import { llmsIndex } from "@/lib/docs/source";

// The docs index for agents: every page as a link to its Markdown, in sidebar order.

async function index(): Promise<string> {
  "use cache";
  cacheLife({ revalidate: Infinity, expire: Infinity });
  return llmsIndex();
}

export async function GET() {
  return new Response(await index(), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
