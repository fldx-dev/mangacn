import { Alert, AlertDescription, AlertTitle } from "@/registry/ui/alert/alert";
import { Badge } from "@/registry/ui/badge/badge";

const CHIPS = ["/llms.txt", "/docs/*.md", "copy prompt", "MCP · soon"];

/** Section 8: what an agent can read and copy, in an alert used as a callout. */
export function AgentStrip() {
  return (
    <section data-landing="agent-ready" aria-labelledby="landing-agents" className="border-t">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 md:py-16">
        {/* A standing callout, not a live message: `note`, so nothing is announced on load. */}
        <Alert role="note" className="gap-3 px-5 py-5 sm:px-6">
          <AlertTitle>
            <h2 id="landing-agents" className="font-display text-2xl sm:text-3xl">
              Agent-ready
            </h2>
          </AlertTitle>
          <AlertDescription className="text-base text-foreground">
            The docs come as Markdown for agents: an index at /llms.txt and a .md twin of every
            page. Each item page copies a prompt that installs the right item with the right
            command. An MCP server comes next.
          </AlertDescription>
          <ul className="flex flex-wrap gap-2" aria-label="Agent features">
            {CHIPS.map((chip) => (
              <li key={chip}>
                <Badge variant={chip.startsWith("MCP") ? "outline" : "secondary"}>{chip}</Badge>
              </li>
            ))}
          </ul>
        </Alert>
      </div>
    </section>
  );
}
