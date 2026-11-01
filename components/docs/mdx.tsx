import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import { ThemePlayground } from "@/components/docs/theme-playground";
import { TokenSwatches } from "@/components/docs/token-swatches";

// The components every docs page renders its MDX with; site components join them here.
export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    ThemePlayground,
    TokenSwatches,
    ...components,
  };
}
