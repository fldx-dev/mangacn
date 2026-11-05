import type { SearchServer } from "fumadocs-core/search/server";
import type { LoaderOutput } from "fumadocs-core/source";
import { cacheLife } from "next/cache";
import { docsLlms, llmsIndex, source } from "@/lib/docs/source";
import type { McpDeps } from "./server";
import { type CatalogEntry, readCatalog, readSkill } from "./tools";

// The MCP route's reads, cached for good as the Markdown routes are: the catalog, every page's
// Markdown, the llms.txt index and the skill files. The route is dynamic (every MCP call is a
// POST), so each entry is filled on its first call and served from the cache after that.

/** The loader config of the docs source, so the deps type-check against its pages. */
type DocsConfig = typeof source extends LoaderOutput<infer C> ? C : never;

async function catalog(): Promise<CatalogEntry[]> {
  "use cache";
  cacheLife({ revalidate: Infinity, expire: Infinity });
  return readCatalog();
}

async function pageMarkdown(url: string): Promise<string | null> {
  "use cache";
  cacheLife({ revalidate: Infinity, expire: Infinity });
  const page = source.getPageByUrl(url);
  return page ? docsLlms.page(page) : null;
}

async function index(): Promise<string> {
  "use cache";
  cacheLife({ revalidate: Infinity, expire: Infinity });
  return llmsIndex();
}

async function skill(topic?: string): Promise<string> {
  "use cache";
  cacheLife({ revalidate: Infinity, expire: Infinity });
  return readSkill(topic);
}

/** The deps `createMcpServer` gets in production. */
export function mcpDeps(searchServer: SearchServer) {
  return {
    source,
    // list_pages answers with /llms.txt's text, get_page with /docs/<slug>.md's, both cached.
    llms: {
      ...docsLlms,
      index,
      page: async (page) => (await pageMarkdown(page.url)) ?? docsLlms.page(page),
    },
    searchServer,
    read: { catalog, pageMarkdown, skill },
  } satisfies McpDeps<DocsConfig>;
}
