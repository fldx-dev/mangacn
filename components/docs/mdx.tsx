import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import { ComponentIndex } from "./component-index";
import { CopyPrompt } from "./copy-prompt";
import { DemoFrame } from "./demo-frame";
import { InstallCommand } from "./install-command";
import { PropsTable } from "./props-table";
import { ThemePlayground } from "./theme-playground";
import { TokenSwatches } from "./token-swatches";

// The components every docs page renders its MDX with; site components join them here.
export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    ComponentIndex,
    CopyPrompt,
    DemoFrame,
    InstallCommand,
    PropsTable,
    ThemePlayground,
    TokenSwatches,
    ...components,
  };
}
