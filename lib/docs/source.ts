import { loader } from "fumadocs-core/source";
import { applyMdxPreset } from "fumadocs-mdx/config";
import { defineDocs } from "fumadocs-mdx/macro";
import { inkDark, inkLight } from "./code-theme";

// Expanded at build time by the bundler plugin from `createMDX()` (next.config.ts) into static
// imports of every file under content/docs, so `dir` and the globs must stay literals. A
// collection-level `mdxOptions` replaces the default preset, so it is applied here with only the
// code themes changed.
const docs = defineDocs({
  dir: "content/docs",
  docs: {
    mdxOptions: applyMdxPreset({
      rehypeCodeOptions: { themes: { light: inkLight, dark: inkDark } },
    }),
    postprocess: { includeProcessedMarkdown: true },
  },
});

export const source = loader({ baseUrl: "/docs", source: docs.toFumadocsSource() });
