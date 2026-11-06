import { McpServer } from "@modelcontextprotocol/server";
import type { SearchServer } from "fumadocs-core/search/server";
import type { LLMsWithPages, LoaderConfig, LoaderOutput } from "fumadocs-core/source";
import packageJson from "@/package.json";
import { registerDocsTools } from "./docs-tools";
import { type CatalogReaders, registerCatalogTools } from "./tools";

/** What the server reads; the route passes the docs source and cached readers, tests stubs. */
export interface McpDeps<C extends LoaderConfig = LoaderConfig> {
  /** The Fumadocs loader `get_page` looks pages up in. */
  source: LoaderOutput<C>;
  /** The `llms()` renderer: `index()` for `list_pages`, `page()` for `get_page`. */
  llms: LLMsWithPages<C["page"]>;
  /** The docs search server behind `search`. */
  searchServer: SearchServer;
  /** The catalog, page and skill reads behind the four mangacn tools. */
  read: CatalogReaders;
}

const INSTRUCTIONS =
  "Read-only docs and catalog for mangacn, manga-styled React components on a shadcn registry. Find an item with list_items or search, read its props and demos with get_item before using it, install it with the line get_install_command returns, and follow the design rules from get_skill.";

/** A fresh server with the seven tools; the route makes one per request (stateless). */
export function createMcpServer<C extends LoaderConfig>(deps: McpDeps<C>): McpServer {
  const mcp = new McpServer(
    { name: "mangacn", title: "mangacn docs", version: packageJson.version },
    { instructions: INSTRUCTIONS },
  );
  registerDocsTools(mcp, deps.searchServer, deps.source, deps.llms);
  registerCatalogTools(mcp, deps.read);
  return mcp;
}
