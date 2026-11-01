import defaultMdxComponents from "fumadocs-ui/mdx";

// The components every docs page renders its MDX with; site components join them here.
// Typed by inference rather than `MDXComponents` from `mdx/types`, which would need
// `@types/mdx` as a direct dependency; the page body's `components` prop checks the result.
export function getMDXComponents<T extends object>(components?: T) {
  return { ...defaultMdxComponents, ...components };
}
