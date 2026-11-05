import { type APIRequestContext, expect, test } from "@playwright/test";

// The docs MCP server at /api/mcp against `next start` (SPEC-agent-tooling §8): plain JSON-RPC
// POSTs, as a 2025-era streamable HTTP client sends them, so one project is enough.

const HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json, text/event-stream",
  "Mcp-Protocol-Version": "2025-06-18",
};

interface RpcResult {
  protocolVersion?: string;
  serverInfo?: { name: string };
  tools?: { name: string }[];
  content?: { type: string; text: string }[];
  isError?: boolean;
}

async function rpc(
  request: APIRequestContext,
  method: string,
  params: Record<string, unknown> = {},
): Promise<RpcResult> {
  const response = await request.post("/api/mcp", {
    headers: HEADERS,
    data: { jsonrpc: "2.0", id: 1, method, params },
  });
  expect(response.status()).toBe(200);
  expect(response.headers()["access-control-allow-origin"]).toBe("*");
  const body = await response.text();
  // The stateless fallback answers over a one-message SSE stream.
  const data = body
    .split("\n")
    .filter((line) => line.startsWith("data: "))
    .map((line) => line.slice(6));
  const message = JSON.parse(data.at(-1) ?? body) as { result?: RpcResult; error?: unknown };
  expect(message.error).toBeUndefined();
  return message.result ?? {};
}

async function callTool(
  request: APIRequestContext,
  name: string,
  args: Record<string, unknown> = {},
): Promise<string> {
  const result = await rpc(request, "tools/call", { name, arguments: args });
  expect(result.isError ?? false).toBe(false);
  return result.content?.[0]?.text ?? "";
}

test("the MCP route", async ({ request }, testInfo) => {
  test.skip(testInfo.project.name !== "w1280", "plain requests; one project is enough");

  const init = await rpc(request, "initialize", {
    protocolVersion: "2025-06-18",
    capabilities: {},
    clientInfo: { name: "e2e", version: "0" },
  });
  expect(init.serverInfo?.name).toBe("mangacn");

  const { tools } = await rpc(request, "tools/list");
  expect(tools?.map((tool) => tool.name).sort()).toEqual(
    [
      "get_install_command",
      "get_item",
      "get_page",
      "get_skill",
      "list_items",
      "list_pages",
      "search",
    ].sort(),
  );

  expect(await callTool(request, "list_items")).toContain("- speech-bubble · registry:component");

  const item = await callTool(request, "get_item", { name: "speech-bubble" });
  expect(item).toContain("npx shadcn@latest add @mangacn/ink-frame @mangacn/speech-bubble");
  expect(item).toContain("## Props");
  expect(item).toContain("Files: components/speech-bubble.tsx");

  // Same text as the page's Markdown route, plus the Files line.
  const markdown = await (await request.get("/docs/components/speech-bubble.md")).text();
  expect(item.startsWith(markdown.trimEnd())).toBe(true);

  expect(await callTool(request, "get_page", { url: "/docs/theming" })).toContain("# Theming");

  // SKILL.md's frontmatter once Task 60's skill folder is in the build, the placeholder before.
  expect(await callTool(request, "get_skill")).toMatch(
    /^(---\r?\n|The mangacn Agent Skill is not published yet)/,
  );

  const preflight = await request.fetch("/api/mcp", { method: "OPTIONS" });
  expect(preflight.status()).toBe(204);
  expect(preflight.headers()["access-control-allow-methods"]).toContain("POST");
});
