import type { CallToolResult, McpServer } from "@modelcontextprotocol/server";
import type { SearchServer } from "fumadocs-core/search/server";
import type { LLMsWithPages, LoaderConfig, LoaderOutput } from "fumadocs-core/source";
import { z } from "zod";
import { SITE_URL } from "@/lib/docs/install-command";

// The three docs tools of the MCP server: search, list_pages and get_page. They follow
// `registerSearchTool` and `registerSourceTools` from `fumadocs-core/mcp`, with two changes:
// every tool is annotated read-only like the catalog tools, and `search` answers in Markdown,
// one hit per line, like the other six tools rather than as a JSON array.

/** One hit as `fumadocs-core/search/server` returns it (its `SortedResult`). */
export interface SearchHit {
  url: string;
  type: "page" | "heading" | "text";
  content: string;
  breadcrumbs?: string[];
}

const READ_ONLY = { readOnlyHint: true, openWorldHint: false } as const;

/** The longest matched text a hit line keeps. */
const MAX_TEXT = 240;

function oneLine(value: string): string {
  const flat = value.replace(/\s+/g, " ").trim();
  return flat.length > MAX_TEXT ? `${flat.slice(0, MAX_TEXT - 1).trimEnd()}…` : flat;
}

/**
 * search: `- Theming › Dark mode · Dark mode is the .dark class… · https://…/docs/theming#dark-mode`,
 * one hit per line (the breadcrumb, the matched text, the absolute URL), after a header line.
 */
export function searchText(query: string, hits: readonly SearchHit[]): string {
  if (hits.length === 0) {
    return `No docs match "${query}". list_pages lists every page; list_items every item.\n`;
  }
  const lines = hits.map((hit) => {
    const trail = (hit.breadcrumbs ?? []).map(oneLine).filter(Boolean).join(" › ");
    const url = hit.url.startsWith("/") ? `${SITE_URL}${hit.url}` : hit.url;
    return `- ${[trail, oneLine(hit.content), url].filter(Boolean).join(" · ")}`;
  });
  return [
    `${hits.length} docs hit(s) for "${query}", one per line as breadcrumb · matched text · URL. get_page takes a URL's path without the #anchor.`,
    "",
    ...lines,
    "",
  ].join("\n");
}

function text(value: string, isError = false): CallToolResult {
  return { content: [{ type: "text", text: value }], ...(isError ? { isError } : {}) };
}

/** Registers search, list_pages and get_page on `mcp`. */
export function registerDocsTools<C extends LoaderConfig>(
  mcp: McpServer,
  searchServer: SearchServer,
  source: LoaderOutput<C>,
  llms: LLMsWithPages<C["page"]>,
): void {
  mcp.registerTool(
    "search",
    {
      title: "Search Docs",
      description:
        "Search the mangacn docs. Returns Markdown, one hit per line: the breadcrumb, the matched text and the page URL.",
      inputSchema: z.object({
        query: z.string().describe('Free text, such as "dark mode" or "speech bubble tail".'),
        locale: z.string().optional(),
      }),
      annotations: READ_ONLY,
    },
    async ({ query, locale }) =>
      text(searchText(query, (await searchServer.search(query, { locale })) as SearchHit[])),
  );

  mcp.registerTool(
    "list_pages",
    {
      title: "List Pages",
      description: "List every mangacn docs page with its URL (the llms.txt index).",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => text(await llms.index()),
  );

  mcp.registerTool(
    "get_page",
    {
      title: "Get Page",
      description: "Get a mangacn docs page as Markdown by its pathname, such as /docs/theming.",
      inputSchema: z.object({ url: z.string() }),
      annotations: READ_ONLY,
    },
    async ({ url }) => {
      const page = source.getPageByUrl(url);
      if (!page) return text(`page not found: ${url}`, true);
      return text(await llms.page(page));
    },
  );
}
