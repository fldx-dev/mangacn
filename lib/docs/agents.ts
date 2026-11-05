import { readFileSync } from "node:fs";
import path from "node:path";
import { MCP_URL } from "./install-command";

// What the agents page (/docs/agents) shows: the docs MCP's address, the config each client
// needs to reach it, and the AGENTS.md snippet the skill ships. Shapes checked against each
// client's own docs on 2026-11-05 (sources in the Task 61 notes).

export { MCP_URL, SKILL_INSTALL_COMMAND } from "./install-command";

export interface McpConfigBlock {
  /** The file the block goes in; none for a shell command. */
  file?: string;
  lang: "bash" | "json" | "toml";
  code: string;
}

export interface McpClient {
  id: "claude-code" | "cursor" | "vscode" | "codex";
  label: string;
  blocks: McpConfigBlock[];
}

const json = (value: unknown) => JSON.stringify(value, null, 2);

export const MCP_CLIENTS: McpClient[] = [
  {
    id: "claude-code",
    label: "Claude Code",
    blocks: [
      { lang: "bash", code: `claude mcp add --transport http mangacn ${MCP_URL}` },
      {
        file: ".mcp.json",
        lang: "json",
        code: json({ mcpServers: { mangacn: { type: "http", url: MCP_URL } } }),
      },
    ],
  },
  {
    id: "cursor",
    label: "Cursor",
    blocks: [
      {
        file: ".cursor/mcp.json",
        lang: "json",
        code: json({ mcpServers: { mangacn: { url: MCP_URL } } }),
      },
    ],
  },
  {
    id: "vscode",
    label: "VS Code",
    blocks: [
      {
        file: ".vscode/mcp.json",
        lang: "json",
        code: json({ servers: { mangacn: { type: "http", url: MCP_URL } } }),
      },
    ],
  },
  {
    id: "codex",
    label: "Codex",
    blocks: [
      {
        file: "~/.codex/config.toml",
        lang: "toml",
        code: `[mcp_servers.mangacn]\nurl = "${MCP_URL}"`,
      },
    ],
  },
];

/** Where the skill keeps the snippet; the agents page renders it from here so they never drift. */
export const AGENTS_SNIPPET_PATH = "skills/mangacn/references/agents-snippet.md";

/** The ten-line AGENTS.md block: the body of the reference's fenced `markdown` block. */
export function agentsSnippet(): string {
  // A literal path keeps the bundler's file tracing to this one file.
  const file = path.join(process.cwd(), "skills", "mangacn", "references", "agents-snippet.md");
  const text = readFileSync(file, "utf8").replace(/\r\n/g, "\n");
  const match = /^```markdown\n([\s\S]*?)\n```$/m.exec(text);
  if (!match) throw new Error(`No fenced markdown block in ${AGENTS_SNIPPET_PATH}`);
  return match[1];
}
