import { asMarkdown, renderToMarkdown } from "fumadocs-core/server";
import type { GeneratedDoc } from "fumadocs-typescript";
import type { MDXComponents } from "mdx/types";
import { createElement, type FC } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { agentsSnippet, MCP_URL } from "@/lib/docs/agents";
import { getDemoSource } from "@/lib/docs/demo-source";
import { installCommand } from "@/lib/docs/install-command";
import { renderMarkdownPage } from "@/lib/docs/llms";
import { generateOwnProps } from "@/lib/docs/typescript";
import { fence, getMarkdownComponents } from "./markdown";

// `cacheLife` only runs inside a Next.js "use cache" scope; Vitest ignores the directive.
vi.mock("next/cache", () => ({ cacheLife: () => {} }));

// The compiler-backed generation has its own test (lib/docs/typescript.test.ts).
vi.mock(import("@/lib/docs/typescript"), async (original) => ({
  ...(await original()),
  generateOwnProps: vi.fn(),
}));

afterEach(() => {
  vi.mocked(generateOwnProps).mockReset();
});

const md = getMarkdownComponents();

type Component = FC<Record<string, unknown>>;

/** Renders one MDX component of the map the way `getText("processed")` does. */
function render(name: string, props: Record<string, unknown> = {}) {
  return renderToMarkdown(createElement(md[name] as Component, props));
}

describe("Markdown forms of the docs components", () => {
  it("writes the four install lines in one bash block", async () => {
    const out = await render("InstallCommand", { item: "speech-bubble" });
    expect(out).toMatch(/^```bash\n# pnpm\n/);
    expect(out).toContain(installCommand("speech-bubble", "npm"));
    expect(out).toContain(installCommand("speech-bubble", "bun"));
  });

  it("drops the copy-prompt button and the playground", async () => {
    expect(await render("CopyPrompt", { item: "speech-bubble" })).toBe("");
    expect(await render("ThemePlayground")).toBe("");
  });

  it("writes a demo as its source", async () => {
    expect(await render("DemoFrame", { item: "speech-bubble", demo: "default" })).toBe(
      `\`\`\`tsx title="speech-bubble/default.tsx"\n${getDemoSource("speech-bubble", "default")}\n\`\`\``,
    );
  });

  it("links a primitive to shadcn and tables what mangacn adds", async () => {
    const out = await render("PropsTable", { item: "button" });
    expect(out).toContain(
      "Keeps the stock props: see [shadcn's button page](https://ui.shadcn.com/docs/components/base/button). mangacn adds:",
    );
    expect(out).toMatch(/\| `variant\?` +\| `"sfx"` +\| Added value: .* Default: `"default"` +\|/);
    expect(await render("PropsTable", { item: "input" })).toBe(
      "Keeps the stock props: see [shadcn's input page](https://ui.shadcn.com/docs/components/base/input).",
    );
  });

  it("tables a manga-native item's generated props", async () => {
    const docs: GeneratedDoc[] = [
      {
        id: "speech-bubble",
        name: "SpeechBubbleProps",
        entries: [
          {
            name: "shape",
            description: "The outline.",
            type: '"round" | "square"',
            simplifiedType: '"round" | "square"',
            tags: [{ name: "default", text: '"round"' }],
            required: false,
            deprecated: false,
          },
        ],
      },
    ];
    vi.mocked(generateOwnProps).mockResolvedValue(docs);
    const out = await render("PropsTable", { item: "speech-bubble" });
    expect(out).toMatch(/^### SpeechBubbleProps\n/);
    expect(out).toMatch(/\| `shape\?` +\| `"round" \\\| "square"` +\| The outline\. Default/);

    vi.mocked(generateOwnProps).mockResolvedValue(undefined);
    expect(await render("PropsTable", { item: "speech-bubble" })).toBe(
      "The props of `SpeechBubbleProps` are in the speech-bubble source.",
    );
  });

  it("lists every item under its category with a link to its Markdown", async () => {
    const out = await render("ComponentIndex");
    expect(out).toMatch(/^## Primitives\n\n- \[Button\]\(\/docs\/components\/button\.md\): /);
    expect(out).toContain("- [Speech Bubble](/docs/components/speech-bubble.md): ");
  });

  it("tables the tokens in both modes", async () => {
    const out = await render("TokenSwatches");
    expect(out).toMatch(/^\| Token \| Light \| Dark \|/);
    expect(out).toContain("| `--spot-foreground` |");
  });

  it("writes each MCP client in bold with its config fenced", async () => {
    const out = await render("McpConfig");
    expect(out).toMatch(
      /^\*\*Claude Code\*\*\n\n```bash\nclaude mcp add --transport http mangacn /,
    );
    expect(out).toContain(`\`.mcp.json\`:\n\n\`\`\`json\n{\n  "mcpServers": {`);
    expect(out).toContain("**Cursor**");
    expect(out).toContain('`.vscode/mcp.json`:\n\n```json\n{\n  "servers": {');
    expect(out).toContain(
      `**Codex**\n\n\`~/.codex/config.toml\`:\n\n\`\`\`toml\n[mcp_servers.mangacn]\nurl = "${MCP_URL}"\n\`\`\``,
    );
    expect(out.match(/```(bash|json|toml)\n/g)).toHaveLength(5);
  });

  it("writes the AGENTS.md snippet as a fenced markdown block", async () => {
    expect(await render("AgentsSnippet")).toBe(`\`\`\`markdown\n${agentsSnippet()}\n\`\`\``);
  });

  it("writes a callout as a blockquote with its title", async () => {
    expect(await render("Callout", { title: "Decoration only", children: "Texture." })).toBe(
      "> **Decoration only**\n>\n> Texture.",
    );
  });
});

// What `includeProcessedMarkdown: { output: "function" }` exports: Markdown kept as authored,
// site components as JSX resolved from `props.components`, opted in to Markdown.
function Processed({ components }: { components?: MDXComponents }) {
  asMarkdown();
  const { DemoFrame, CopyPrompt } = components as Record<string, Component>;
  return [
    "\n## Examples\n\n",
    createElement(CopyPrompt, { key: "prompt", item: "speech-bubble" }),
    createElement(DemoFrame, { key: "demo", item: "speech-bubble", demo: "default" }),
  ];
}

describe("a page through renderMarkdownPage", () => {
  it("renders the page's Markdown component with the Markdown forms", async () => {
    const markdown = await renderMarkdownPage(
      {
        url: "/docs/components/speech-bubble",
        data: {
          title: "Speech Bubble",
          description: "Dialogue.",
          getText: (_type, options) =>
            renderToMarkdown(createElement(Processed, { components: options?.components })),
        },
      },
      md,
    );
    expect(markdown).toContain("## Examples\n\n```tsx");
    expect(markdown).not.toContain("<CopyPrompt");
  });
});

describe("fence", () => {
  it("outgrows the longest backtick run in the code", () => {
    expect(fence("a ```` b", "md")).toBe("\n`````md\na ```` b\n`````\n\n");
    expect(fence("x")).toBe("\n```\nx\n```\n\n");
  });
});
