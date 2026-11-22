import { highlightCode } from "@/registry/hooks/lib/highlighter";
import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockContent,
  CodeBlockCopyButton,
  CodeBlockLine,
} from "@/registry/ui/code-block/code-block";

const command = "npx shadcn@latest add @mangacn/code-block --overwrite";

// Highlighted once, when the module loads on the server, in the highlighter's default ink theme.
const [line] = (await highlightCode(command, "bash")) ?? [command];

export default function CodeBlockCommandVariant() {
  return (
    <CodeBlock size="sm" className="max-w-lg">
      <CodeBlockContent className="pe-10">
        <CodeBlockLine>{line}</CodeBlockLine>
      </CodeBlockContent>
      <CodeBlockActions>
        <CodeBlockCopyButton value={command} />
      </CodeBlockActions>
    </CodeBlock>
  );
}
