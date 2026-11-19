import { highlightCode } from "@/registry/hooks/lib/highlighter";
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

// Highlighted once, when the module loads on the server, in the highlighter's default ink theme.
const source = lines.map(([, line]) => line).join("\n");
const highlighted = (await highlightCode(source, "tsx")) ?? source.split("\n");

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
