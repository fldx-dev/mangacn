import { asMarkdown } from "fumadocs-core/server";
import type { DocEntry } from "fumadocs-typescript";
import type { MDXComponents } from "mdx/types";
import type { ReactNode } from "react";
import { agentsSnippet, MCP_CLIENTS } from "@/lib/docs/agents";
import { BLOCKS_CATALOG, CATEGORY_LABELS, docItems, groupByCategory } from "@/lib/docs/catalog";
import { getDemoSource } from "@/lib/docs/demo-source";
import {
  commandFor,
  type InstallCommandProps,
  itemClientNote,
  PACKAGE_MANAGERS,
} from "@/lib/docs/install-command";
import { generatedProps, propsInterfaceName, typeTableToMarkdown } from "@/lib/docs/props";
import { PROPS_DELTA, shadcnDocsUrl } from "@/lib/docs/props-delta";
import { loadRegistry } from "@/lib/registry";
import { listDemos } from "@/lib/registry/demos";
import type { DemoFrameProps } from "./demo-frame";
import { itemFilesMarkdown } from "./item-files";
import type { PropsTableProps } from "./props-table";
import { TOKENS, tokenValues } from "./token-swatches";

// The Markdown form of every site component a docs page uses, for `getText("processed")`
// (`includeProcessedMarkdown` with `output: "function"`) and so for /llms-full.txt and
// /docs/<slug>.md. Each calls `asMarkdown()` to opt in; `renderToMarkdown` from
// `fumadocs-core/server` writes any component that does not as JSX syntax. Server only.

/** A fenced block, with a fence longer than any backtick run in the code. */
export function fence(code: string, lang = "", meta = ""): string {
  const longest = Math.max(0, ...(code.match(/`+/g) ?? []).map((run) => run.length));
  const ticks = "`".repeat(Math.max(3, longest + 1));
  return `\n${ticks}${[lang, meta].filter(Boolean).join(" ")}\n${code}\n${ticks}\n\n`;
}

/** The four `add` lines in one shell block, pnpm first as on the page, then the client line. */
export function InstallCommandMarkdown(props: InstallCommandProps) {
  asMarkdown();
  const block = fence(
    PACKAGE_MANAGERS.map((manager) => `# ${manager}\n${commandFor(props, manager)}`).join("\n\n"),
    "bash",
  );
  const note = itemClientNote(props);
  return note ? `${block}${note}\n\n` : block;
}

/** Each client under its name in bold, then its blocks, each fenced, the file named before it. */
export function McpConfigMarkdown() {
  asMarkdown();
  return MCP_CLIENTS.map(
    (client) =>
      `\n**${client.label}**\n\n${client.blocks
        .map(
          (block) => `${block.file ? `\`${block.file}\`:\n` : ""}${fence(block.code, block.lang)}`,
        )
        .join("")}`,
  ).join("");
}

/** The AGENTS.md block, as the skill's reference holds it. */
export function AgentsSnippetMarkdown() {
  asMarkdown();
  return fence(agentsSnippet(), "markdown");
}

/** The page itself is what an agent reads, so the prompt button has no Markdown form. */
export function CopyPromptMarkdown() {
  asMarkdown();
  return null;
}

/** A demo is its source, with the install-path imports the Code tab shows. */
export function DemoFrameMarkdown({ item, demo }: DemoFrameProps) {
  asMarkdown();
  return fence(getDemoSource(item, demo), "tsx", `title="${item}/${demo}.tsx"`);
}

/** The props as a Markdown table: generated for manga-native items, the delta for primitives. */
export async function PropsTableMarkdown({
  item,
  name = propsInterfaceName(item),
}: PropsTableProps) {
  asMarkdown();
  const entry = loadRegistry().items.find((candidate) => candidate.name === item);
  if (!entry) throw new Error(`PropsTable: unknown item "${item}" (not in the catalog).`);

  if (entry.type === "registry:ui") {
    const delta = PROPS_DELTA[item];
    const stock = `Keeps the stock props: see [shadcn's ${item} page](${shadcnDocsUrl(item)})`;
    if (!delta) return `\n${stock}.\n\n`;
    const entries = Object.entries(delta).map(
      ([prop, { type, default: fallback, description }]): DocEntry => ({
        name: prop,
        description,
        type,
        simplifiedType: type,
        tags: fallback ? [{ name: "default", text: fallback }] : [],
        required: false,
        deprecated: false,
      }),
    );
    const table = typeTableToMarkdown({ id: item, name: "What mangacn adds", entries });
    return `\n${stock}. mangacn adds:\n\n${table}\n\n`;
  }

  // Read from lib/docs/props.generated.json (`pnpm gen:props`): the MCP route renders this on
  // Vercel, where the compiler cannot run. Missing only when the file is stale, which
  // `gen:props --check` and the e2e guard on get_item catch.
  const docs = generatedProps(item, name);
  if (!docs) return `\nThe props of \`${name}\` are in the ${item} source.\n\n`;
  return `\n${docs.map(typeTableToMarkdown).join("\n\n")}\n\n`;
}

/** Every item as a link with its description, grouped by category in sidebar order. */
export function ComponentIndexMarkdown() {
  asMarkdown();
  return groupByCategory(docItems(loadRegistry(), listDemos()))
    .map(
      ([category, group]) =>
        `\n## ${CATEGORY_LABELS[category]}\n\n${group
          .map((item) => `- [${item.title}](/docs/components/${item.name}.md): ${item.description}`)
          .join("\n")}\n\n`,
    )
    .join("");
}

/** Every block as a link with its description, in catalog order. */
export function BlockIndexMarkdown() {
  asMarkdown();
  const items = docItems(loadRegistry(), listDemos(), BLOCKS_CATALOG);
  return `\n${items
    .map((item) => `- [${item.title}](/docs/blocks/${item.name}.md): ${item.description}`)
    .join("\n")}\n\n`;
}

/** A page block's preview is the page itself, at its own URL. */
export function BlockPreviewMarkdown({ item }: { item: string }) {
  asMarkdown();
  return `\nThe whole page, on its own: [/view/${item}](/view/${item}).\n\n`;
}

/** The playground is interactive; the pen table above it in the page holds the defaults. */
export function ThemePlaygroundMarkdown() {
  asMarkdown();
  return null;
}

/** The eight tokens with their light and dark values. */
export function TokenSwatchesMarkdown() {
  asMarkdown();
  const light = tokenValues("light");
  const dark = tokenValues("dark");
  const rows = TOKENS.map(
    (token) => `| \`--${token}\` | \`${light[token]}\` | \`${dark[token]}\` |`,
  );
  return `\n| Token | Light | Dark |\n|---|---|---|\n${rows.join("\n")}\n\n`;
}

/** A block's Files line, the paths as code. */
export function ItemFilesMarkdown({ item }: { item: string }) {
  asMarkdown();
  return itemFilesMarkdown(item);
}

/** A Fumadocs callout as a blockquote, its title in bold. */
export function CalloutMarkdown({ title, children }: { title?: ReactNode; children?: ReactNode }) {
  asMarkdown();
  return (
    <blockquote>
      {title ? (
        <p>
          <strong>{title}</strong>
        </p>
      ) : null}
      {children}
    </blockquote>
  );
}

/** Steps and Step only lay their content out, so their Markdown is their children. */
export function StepsMarkdown({ children }: { children?: ReactNode }) {
  asMarkdown();
  return children;
}

export function getMarkdownComponents(): MDXComponents {
  return {
    InstallCommand: InstallCommandMarkdown,
    McpConfig: McpConfigMarkdown,
    AgentsSnippet: AgentsSnippetMarkdown,
    BlockIndex: BlockIndexMarkdown,
    BlockPreview: BlockPreviewMarkdown,
    CopyPrompt: CopyPromptMarkdown,
    DemoFrame: DemoFrameMarkdown,
    ItemFiles: ItemFilesMarkdown,
    PropsTable: PropsTableMarkdown,
    ComponentIndex: ComponentIndexMarkdown,
    ThemePlayground: ThemePlaygroundMarkdown,
    TokenSwatches: TokenSwatchesMarkdown,
    Callout: CalloutMarkdown,
    Steps: StepsMarkdown,
    Step: StepsMarkdown,
  };
}
