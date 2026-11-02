import { llms, loader } from "fumadocs-core/source";
import { applyMdxPreset } from "fumadocs-mdx/config";
import { defineDocs } from "fumadocs-mdx/macro";
import { getMarkdownComponents } from "@/components/docs/markdown";
import { inkDark, inkLight } from "./code-theme";
import { renderIndex, renderMarkdownPage } from "./llms";

// Expanded at build time by the bundler plugin from `createMDX()` (next.config.ts) into static
// imports of every file under content/docs, so `dir` and the globs must stay literals. A
// collection-level `mdxOptions` replaces the default preset, so it is applied here with only the
// code themes changed. The processed Markdown is a component, so the site components in a page
// render their own Markdown forms (components/docs/markdown.tsx) instead of JSX tags.
const docs = defineDocs({
  dir: "content/docs",
  docs: {
    mdxOptions: applyMdxPreset({
      rehypeCodeOptions: { themes: { light: inkLight, dark: inkDark } },
    }),
    postprocess: { includeProcessedMarkdown: { output: "function", headingIds: false } },
  },
});

export const source = loader({ baseUrl: "/docs", source: docs.toFumadocsSource() });

/** /llms-full.txt (`full()`) and /docs/<slug>.md (`page()`); /llms.txt is `llmsIndex()`. */
export const docsLlms = llms(source, {
  renderPage: (page) => renderMarkdownPage(page, getMarkdownComponents()),
});

/** /llms.txt: the sidebar tree as Markdown links, under the introduction's description. */
export async function llmsIndex(): Promise<string> {
  const nodes = await Promise.all(
    source.getPageTree().children.map((node) => docsLlms.indexNode(node)),
  );
  return renderIndex(nodes.join("\n"), source.getPage([])?.data.description);
}
