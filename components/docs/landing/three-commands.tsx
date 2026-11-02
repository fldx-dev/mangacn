import { cn } from "cn";
import { CodeBlock, Pre } from "fumadocs-ui/components/codeblock";
import { installCommand } from "@/lib/docs/install-command";
import { Panel } from "@/registry/ui/panel/panel";
import { PanelGrid, PanelGridItem } from "@/registry/ui/panel-grid/panel-grid";
import { CODE_WRAPS } from "./fit";

/** The three adds a project needs, in order; the commands come from `installCommand()`. */
const STEPS = [
  {
    item: "theme",
    title: "Theme and fonts",
    body: "Ink-on-paper tokens, screentone utilities and both typefaces, Japanese fallback included.",
  },
  {
    item: "ink-frame",
    title: "The pen",
    body: "InkFrame, the rough.js outline every drawn item uses. Items that need it bring it along.",
  },
  {
    item: "sfx-text",
    title: "Any item",
    body: "Lands in components/ui as a plain file. Edit it like your own code, because it is.",
  },
] as const;

/** Section 3: theme + fonts, ink-frame, an item; one numbered panel each. */
export function ThreeCommands() {
  return (
    <section
      data-landing="three-commands"
      aria-labelledby="landing-commands"
      className="border-t bg-tone-1"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-14 sm:px-6 md:py-20">
        <h2 id="landing-commands" className="font-display text-3xl text-balance sm:text-4xl">
          Three commands, then the source is yours.
        </h2>
        <PanelGrid columns={{ base: 1, md: 3 }} gutter="lg">
          {STEPS.map((step, index) => (
            <PanelGridItem key={step.item}>
              <Panel
                as="div"
                caption={<span className="font-display text-base">{index + 1}</span>}
                className="gap-4"
              >
                <h3 className="font-display text-xl">{step.title}</h3>
                <CodeBlock
                  className={cn("my-0", CODE_WRAPS)}
                  viewportProps={{ "aria-label": `${step.title}: command` }}
                >
                  <Pre>
                    <code>
                      <span className="line">{installCommand(step.item, "pnpm")}</span>
                    </code>
                  </Pre>
                </CodeBlock>
                <p className="text-sm text-pretty">{step.body}</p>
              </Panel>
            </PanelGridItem>
          ))}
        </PanelGrid>
      </div>
    </section>
  );
}
