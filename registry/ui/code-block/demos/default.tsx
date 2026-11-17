import { FileCodeIcon } from "lucide-react";
import { highlightCode } from "@/registry/hooks/lib/highlighter";
import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockContent,
  CodeBlockCopyButton,
  CodeBlockHeader,
  CodeBlockLine,
  CodeBlockTitle,
} from "@/registry/ui/code-block/code-block";

const code = `import { SpeechBubble } from "@/components/speech-bubble";

// The first panel of chapter 12.
export function Opening() {
  return <SpeechBubble shape="shout">Wait for me!</SpeechBubble>;
}
`;

// Highlighted once, when the module loads on the server, in the highlighter's default ink theme.
// The trailing newline is left off, so it renders no extra empty line.
const lines = (await highlightCode(code.trimEnd(), "tsx")) ?? code.trimEnd().split("\n");

export default function CodeBlockDefaultDemo() {
  return (
    <CodeBlock className="max-w-xl">
      <CodeBlockHeader>
        <CodeBlockTitle>
          <FileCodeIcon />
          opening.tsx
        </CodeBlockTitle>
        <CodeBlockActions>
          <CodeBlockCopyButton value={code} />
        </CodeBlockActions>
      </CodeBlockHeader>
      <CodeBlockContent lineNumbers>
        {lines.map((line, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: fixed lines
          <CodeBlockLine key={index}>{line}</CodeBlockLine>
        ))}
      </CodeBlockContent>
    </CodeBlock>
  );
}
