import type { MDXComponents } from "mdx/types";
import { SITE_URL } from "./install-command";

/** What `renderMarkdownPage` reads of a docs page (a Fumadocs page from `source`). */
export interface MarkdownPage {
  url: string;
  data: {
    title?: string;
    description?: string;
    getText: (type: "processed", options?: { components?: MDXComponents }) => Promise<string>;
  };
}

/** `/docs/components/button` → `/docs/components/button.md`, the URL the rewrite serves. */
export function markdownUrl(pageUrl: string): string {
  return `${pageUrl}.md`;
}

/**
 * /llms.txt: the project name, the docs summary as a quote, then the page tree from
 * `indexNode()` with every link pointing at the page's Markdown, absolute.
 */
export function renderIndex(tree: string, summary?: string): string {
  const linked = tree.replace(
    /\]\((\/docs[^)]*)\)/g,
    (_, url: string) => `](${SITE_URL}${markdownUrl(url)})`,
  );
  return [
    "# mangacn",
    summary ? `> ${summary}` : undefined,
    `Every link below is the page as Markdown; ${SITE_URL}/llms-full.txt holds them all in one file.`,
    linked.trim(),
  ]
    .filter((part) => part !== undefined)
    .join("\n\n")
    .concat("\n");
}

/**
 * One docs page as Markdown for agents: the title, the description as a quote, the canonical
 * URL, then the page's processed Markdown with its site components in their Markdown forms.
 */
export async function renderMarkdownPage(
  page: MarkdownPage,
  components?: MDXComponents,
): Promise<string> {
  const { title, description } = page.data;
  const body = await page.data.getText("processed", { components });
  return [
    `# ${title ?? page.url}`,
    description ? `> ${description}` : undefined,
    `URL: ${SITE_URL}${page.url}`,
    body.trim(),
  ]
    .filter((part) => part !== undefined && part.length > 0)
    .join("\n\n")
    .concat("\n");
}
