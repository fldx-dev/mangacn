import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import { DemoFrame } from "./demo-frame";
import { PropsTable } from "./props-table";

// The components every docs page renders its MDX with; site components join them here.
export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    DemoFrame,
    PropsTable,
    ...components,
  };
}
