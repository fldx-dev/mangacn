import {
  CodeBlock,
  CodeBlockTab,
  CodeBlockTabs,
  CodeBlockTabsList,
  CodeBlockTabsTrigger,
  Pre,
} from "fumadocs-ui/components/codeblock";
import {
  commandFor,
  type InstallCommandProps,
  itemClientNote,
  PACKAGE_MANAGERS,
} from "@/lib/docs/install-command";

/**
 * The one-line `add` for pnpm, npm, yarn and bun, each with a copy button, and on an item page
 * whether the item is a client component (read from its file's `"use client"`). The tabs share a
 * group id with persistence, so the manager picked on one page is selected on every page.
 */
export function InstallCommand(props: InstallCommandProps) {
  const label = props.setup ? "the theme, the fonts, the ink frame and speech-bubble" : props.item;
  const note = itemClientNote(props);
  return (
    <>
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
            <CodeBlock viewportProps={{ "aria-label": `Install ${label} with ${manager}` }}>
              <Pre>
                <code>
                  <span className="line">{commandFor(props, manager)}</span>
                </code>
              </Pre>
            </CodeBlock>
          </CodeBlockTab>
        ))}
      </CodeBlockTabs>
      {note ? (
        <p data-slot="install-client-note" className="text-sm text-fd-muted-foreground">
          {note}
        </p>
      ) : null}
    </>
  );
}
