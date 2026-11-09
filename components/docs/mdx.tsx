import { CodeBlock, Pre } from "fumadocs-ui/components/codeblock";
import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import { type HTMLAttributes, isValidElement, type ReactNode } from "react";
import { AgentsSnippet } from "./agents-snippet";
import { ComponentIndex } from "./component-index";
import { CopyPrompt } from "./copy-prompt";
import { DemoFrame } from "./demo-frame";
import { InstallCommand } from "./install-command";
import { ItemFiles } from "./item-files";
import { McpConfig } from "./mcp-config";
import { PropsTable } from "./props-table";
import { ThemePlayground } from "./theme-playground";
import { TokenSwatches } from "./token-swatches";

/** The text of a React tree, as the code block will show it. */
function textOf(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) return textOf(node.props.children);
  return "";
}

/**
 * Fumadocs' MDX `pre`, plus a name: every code viewport is a `region`, and unnamed ones repeat
 * the same landmark. Named by the block's title, else its first line (`npx shadcn@latest add …`).
 */
function CodeFence(props: HTMLAttributes<HTMLPreElement>) {
  const label = props.title || textOf(props.children).trim().split("\n")[0];
  return (
    <CodeBlock {...props} viewportProps={{ "aria-label": label }}>
      <Pre>{props.children}</Pre>
    </CodeBlock>
  );
}

// The components every docs page renders its MDX with; site components join them here.
export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    pre: CodeFence,
    AgentsSnippet,
    ComponentIndex,
    CopyPrompt,
    DemoFrame,
    InstallCommand,
    ItemFiles,
    McpConfig,
    PropsTable,
    ThemePlayground,
    TokenSwatches,
    ...components,
  };
}
