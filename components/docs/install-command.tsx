import {
  CodeBlock,
  CodeBlockTab,
  CodeBlockTabs,
  CodeBlockTabsList,
  CodeBlockTabsTrigger,
  Pre,
} from "fumadocs-ui/components/codeblock";
import { installCommand, PACKAGE_MANAGERS } from "@/lib/docs/install-command";

/**
 * The item's one-line `add` for pnpm, npm, yarn and bun, each with a copy button. The tabs share
 * a group id with persistence, so the manager picked on one page is selected on every page.
 */
export function InstallCommand({ item }: { item: string }) {
  return (
    <CodeBlockTabs
      defaultValue={PACKAGE_MANAGERS[0]}
      groupId="package-manager"
      persist
      data-slot="install-command"
    >
      <CodeBlockTabsList>
        {PACKAGE_MANAGERS.map((manager) => (
          <CodeBlockTabsTrigger key={manager} value={manager}>
            {manager}
          </CodeBlockTabsTrigger>
        ))}
      </CodeBlockTabsList>
      {PACKAGE_MANAGERS.map((manager) => (
        <CodeBlockTab key={manager} value={manager}>
          <CodeBlock>
            <Pre>
              <code>
                <span className="line">{installCommand(item, manager)}</span>
              </code>
            </Pre>
          </CodeBlock>
        </CodeBlockTab>
      ))}
    </CodeBlockTabs>
  );
}
