import { createMcpHandler } from "@modelcontextprotocol/server";
import { searchServer } from "@/lib/docs/search-server";
import { mcpDeps } from "@/lib/mcp/readers";
import { createMcpServer } from "@/lib/mcp/server";

// The docs MCP server (SPEC-agent-tooling §4): streamable HTTP, stateless, read-only. The SDK's
// web-standard handler serves both protocol eras from one factory; 2025-era clients get the
// stateless fallback, which answers GET and DELETE (session operations) with 405. One handler and
// one server per request, so nothing is created or awaited at module scope. CORS is open, as on
// /r (next.config.ts adds the headers to every /api/mcp response).

function handle(request: Request): Promise<Response> {
  return createMcpHandler(() => createMcpServer(mcpDeps(searchServer))).fetch(request);
}

export const GET = handle;
export const POST = handle;
export const DELETE = handle;

export function OPTIONS() {
  return new Response(null, { status: 204 });
}
