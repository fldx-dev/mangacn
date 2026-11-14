import { highlightInk } from "@/lib/docs/ink-highlight";
import {
  CodeBlock,
  CodeBlockContent,
  CodeBlockFooter,
  CodeBlockHeader,
  CodeBlockLine,
  CodeBlockTitle,
} from "@/registry/ui/code-block/code-block";

const lines = [
  ["default", "<Panel>"],
  ["removed", '  <SpeechBubble shape="round">Who is there?</SpeechBubble>'],
  ["added", '  <SpeechBubble shape="shout">WHO IS THERE?!</SpeechBubble>'],
  ["highlighted", '  <SfxText size="lg">KYOTO</SfxText>'],
  ["default", "</Panel>"],
] as const;

// Highlighted once, when the module loads on the server.
const highlighted = highlightInk(lines.map(([, line]) => line).join("\n"), "tsx");

export default function CodeBlockDiffDemo() {
  return (
    <CodeBlock className="max-w-xl">
      <CodeBlockHeader>
        <CodeBlockTitle>panel-3.tsx</CodeBlockTitle>
      </CodeBlockHeader>
      <CodeBlockContent lineNumbers startLine={18}>
        {lines.map(([variant], index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: fixed lines
          <CodeBlockLine key={index} variant={variant}>
            {highlighted[index]}
          </CodeBlockLine>
        ))}
      </CodeBlockContent>
      <CodeBlockFooter>One line changed, one line marked.</CodeBlockFooter>
    </CodeBlock>
  );
}
