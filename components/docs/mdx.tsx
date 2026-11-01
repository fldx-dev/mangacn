import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import { CopyPrompt } from "./copy-prompt";
import { InstallCommand } from "./install-command";

// The components every docs page renders its MDX with; site components join them here.
export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    CopyPrompt,
    InstallCommand,
    ...components,
  };
}
