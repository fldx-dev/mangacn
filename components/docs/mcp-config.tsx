import {
  CodeBlock,
  CodeBlockTab,
  CodeBlockTabsList,
  CodeBlockTabsTrigger,
  Pre,
} from "fumadocs-ui/components/codeblock";
import { Fragment, type ReactNode } from "react";
import { MCP_CLIENTS } from "@/lib/docs/agents";
import { PersistedTabs } from "./persisted-tabs";

/** Code as shiki-style `.line` spans joined by newlines, so copy gives back the exact text. */
export function codeLines(code: string): ReactNode {
  return code.split("\n").map((line, index, lines) => (
    // biome-ignore lint/suspicious/noArrayIndexKey: the lines of static code, never reordered
    <Fragment key={index}>
      <span className="line">{line}</span>
      {index < lines.length - 1 ? "\n" : null}
    </Fragment>
  ));
}

/**
 * The docs MCP's config for Claude Code, Cursor, VS Code and Codex, one tab each, every block
 * with a copy button. The tabs share a persisted group id, like the package-manager tabs, so
 * the client picked here stays picked on the next visit.
 */
export function McpConfig() {
  return (
    <PersistedTabs defaultValue={MCP_CLIENTS[0].id} groupId="mcp-client" data-slot="mcp-config">
      <CodeBlockTabsList>
        {MCP_CLIENTS.map((client) => (
          <CodeBlockTabsTrigger key={client.id} value={client.id}>
            {client.label}
          </CodeBlockTabsTrigger>
        ))}
      </CodeBlockTabsList>
      {MCP_CLIENTS.map((client) => (
        <CodeBlockTab key={client.id} value={client.id} className="flex flex-col gap-2">
          {client.blocks.map((block) => (
            <CodeBlock
              key={block.code}
              title={block.file}
              className="my-0"
              viewportProps={{
                "aria-label": `${client.label}: ${block.file ?? "terminal command"}`,
              }}
            >
              <Pre>
                <code>{codeLines(block.code)}</code>
              </Pre>
            </CodeBlock>
          ))}
        </CodeBlockTab>
      ))}
    </PersistedTabs>
  );
}
