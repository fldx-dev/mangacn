import { CodeBlock, Pre } from "fumadocs-ui/components/codeblock";
import { agentsSnippet } from "@/lib/docs/agents";
import { codeLines } from "./mcp-config";

/**
 * The AGENTS.md block from the skill's `references/agents-snippet.md`, read at build so the
 * page and the skill never drift, with a copy button.
 */
export function AgentsSnippet() {
  return (
    <CodeBlock
      title="AGENTS.md"
      data-slot="agents-snippet"
      viewportProps={{ "aria-label": "AGENTS.md snippet" }}
    >
      <Pre>
        <code>{codeLines(agentsSnippet())}</code>
      </Pre>
    </CodeBlock>
  );
}
