import { cn } from "cn";
import { ServerCodeBlock } from "fumadocs-ui/components/codeblock.rsc";
import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import { cacheLife } from "next/cache";
import { inkDark, inkLight } from "@/lib/docs/code-theme";
import { getDemoEntry, getDemoSource } from "@/lib/docs/demo-source";
import { getDemoLoader } from "@/lib/registry/demos";
import { StageFrame } from "./stage-frame";

// Overlay items render their stage in an iframe, so two open dialogs or sheets never stack on
// one page; every other demo renders inline, which keeps the docs pages free of iframes.
export const OVERLAY_ITEMS: ReadonlySet<string> = new Set([
  "dialog",
  "sheet",
  "tooltip",
  "popover",
]);

export interface DemoFrameProps {
  item: string;
  demo: string;
  /** The iframe's accessible name (overlay items). Defaults to `<item> / <demo>`. */
  title?: string;
  /** The iframe's height (overlay items). */
  height?: string;
}

/** One demo with Preview / Code tabs and a link to its lone stage. Throws on an unknown demo. */
export async function DemoFrame({ item, demo, title, height }: DemoFrameProps) {
  const preview = await DemoPreview({ item, demo, title, height });
  const stage = `/demo/${item}/${demo}`;
  const code = await highlightDemoSource(item, demo);

  return (
    <Tabs data-slot="demo-frame" items={["Preview", "Code"]} className="not-prose">
      <Tab value="Preview" className="flex flex-col gap-2">
        {preview}
        <a
          href={stage}
          aria-label={`Open stage: ${item} / ${demo}`}
          className="self-end text-sm text-fd-muted-foreground underline underline-offset-4 hover:text-fd-foreground"
        >
          Open stage
        </a>
      </Tab>
      <Tab value="Code">{code}</Tab>
    </Tabs>
  );
}

export interface DemoPreviewProps extends DemoFrameProps {
  /** Classes for the paper box of an inline demo. */
  className?: string;
}

/**
 * The demo itself: inline in a paper box, or the stage in an iframe for overlay items. Throws
 * on an unknown demo.
 */
export async function DemoPreview({
  item,
  demo,
  title,
  height = "32rem",
  className,
}: DemoPreviewProps) {
  getDemoEntry(item, demo);
  const load = getDemoLoader(item, demo);
  if (!load) throw new Error(`No loader for demo "${item}/${demo}"; run \`pnpm gen:demos\`.`);

  if (OVERLAY_ITEMS.has(item)) {
    return (
      <StageFrame
        src={`/demo/${item}/${demo}`}
        title={title ?? `${item} / ${demo}`}
        height={height}
      />
    );
  }
  const { default: Demo } = await load();
  return (
    <div
      className={cn(
        "relative isolate flex min-h-40 min-w-0 items-center justify-center overflow-x-auto rounded-sm border bg-paper p-4 text-ink sm:p-8",
        className,
      )}
    >
      <Demo />
    </div>
  );
}

/**
 * The demo's source as a Fumadocs code block in the ink themes of the MDX code blocks, cached
 * for good: Shiki reads the clock while it works, which a prerender rejects, and the source
 * only changes with a new build.
 */
async function highlightDemoSource(item: string, demo: string) {
  "use cache";
  cacheLife({ revalidate: Infinity, expire: Infinity });
  return ServerCodeBlock({
    code: getDemoSource(item, demo),
    lang: "tsx",
    themes: { light: inkLight, dark: inkDark },
  });
}
