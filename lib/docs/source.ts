import { loader } from "fumadocs-core/source";
import { defineDocs } from "fumadocs-mdx/macro";

// Expanded at build time by the bundler plugin from `createMDX()` (next.config.ts) into static
// imports of every file under content/docs, so the arguments must stay literals.
const docs = defineDocs({
  dir: "content/docs",
  docs: { postprocess: { includeProcessedMarkdown: true } },
});

export const source = loader({ baseUrl: "/docs", source: docs.toFumadocsSource() });
