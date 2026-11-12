import { highlightInk } from "@/lib/docs/ink-highlight";
import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockContent,
  CodeBlockCopyButton,
  CodeBlockLine,
} from "@/registry/ui/code-block/code-block";

const command = "npx shadcn@latest add @mangacn/code-block --overwrite";

// Highlighted once, when the module loads on the server.
const [line] = highlightInk(command, "bash");

export default function CodeBlockCommandDemo() {
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
