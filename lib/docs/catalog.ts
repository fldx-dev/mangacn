import type { LoadedRegistry } from "@/lib/registry";
import { BLOCKS_CATALOG } from "@/lib/registry/blocks";

// The docs document the component catalog (registry/ui/registry.json) and the block catalog
// (registry/blocks/registry.json): one page per item that has demos, under "Components" and
// "Blocks" in the sidebar. The theme catalog (theme, fonts, ink-frame, manga-motion) is covered
// by the installation and theming guides instead.
export const COMPONENTS_CATALOG = "registry/ui/registry.json";

export { BLOCKS_CATALOG };

/** Repo-relative folder of the item pages. */
export const COMPONENT_PAGES_DIR = "content/docs/components";

/** Repo-relative folder of the block pages (SPEC-components-3 §5). */
export const BLOCK_PAGES_DIR = "content/docs/blocks";

/** A sidebar section `gen:docs` writes from one catalog: its pages' folder and URL. */
export interface DocsSection {
  catalog: string;
  dir: string;
  /** The pages' URL prefix, `/docs/components`. */
  url: string;
}

/** The generated sections in sidebar order: Components, then Blocks. */
export const DOCS_SECTIONS: readonly DocsSection[] = [
  { catalog: COMPONENTS_CATALOG, dir: COMPONENT_PAGES_DIR, url: "/docs/components" },
  { catalog: BLOCKS_CATALOG, dir: BLOCK_PAGES_DIR, url: "/docs/blocks" },
];

/**
 * The docs page of a component or block (`/docs/components/button`, `/docs/blocks/chapter-list`),
 * or null for an item of another catalog (the theme's guide is not its own page).
 */
export function itemPagePath(item: { name: string; source: string }): string | null {
  const section = DOCS_SECTIONS.find((candidate) => candidate.catalog === item.source);
  return section ? `${section.url}/${item.name}` : null;
}

/**
 * Catalog categories in sidebar and index order (SPEC-docs-site §4); `block` is the block
 * catalog's one category and comes last.
 */
export const CATEGORIES = [
  "primitive",
  "layout",
  "text",
  "background",
  "decoration",
  "feedback",
  "animation",
  "data",
  "block",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  primitive: "Primitives",
  layout: "Layout",
  text: "Text",
  background: "Background",
  decoration: "Decoration",
  feedback: "Feedback",
  animation: "Animation",
  data: "Data",
  block: "Blocks",
};

/** The line `gen:docs` writes where the item's prose goes; the page test rejects it. */
export const PROSE_PLACEHOLDER =
  "{/* gen:docs: replace with one or two sentences on when to use it and what it pairs with. */}";

export interface DocItem {
  name: string;
  title: string;
  description: string;
  category: Category;
  /** The item's demos, `default` first, then by name. */
  demos: string[];
}

function isCategory(value: string | undefined): value is Category {
  return (CATEGORIES as readonly string[]).includes(value ?? "");
}

/**
 * Every component-catalog item that has demos, in category order and catalog order within a
 * category. Throws naming an item whose first category is not one of `CATEGORIES`. `catalog`
 * picks the section: the components (the default, which the component index lists) or the blocks.
 */
export function docItems(
  registry: LoadedRegistry,
  demos: readonly { item: string; demo: string }[],
  catalog: string = COMPONENTS_CATALOG,
): DocItem[] {
  const items: DocItem[] = [];
  for (const entry of registry.items) {
    if (entry.source !== catalog) continue;
    const names = demos.filter((demo) => demo.item === entry.name).map((demo) => demo.demo);
    if (names.length === 0) continue;
    const category = entry.categories?.[0];
    if (!isCategory(category)) {
      throw new Error(
        `Catalog item "${entry.name}" has category "${category}"; expected one of ${CATEGORIES.join(", ")}.`,
      );
    }
    items.push({
      name: entry.name,
      title: entry.title ?? entry.name,
      description: entry.description ?? "",
      category,
      demos: [...names].sort((a, b) =>
        a === "default" ? -1 : b === "default" ? 1 : a < b ? -1 : a > b ? 1 : 0,
      ),
    });
  }
  return items.sort((a, b) => CATEGORIES.indexOf(a.category) - CATEGORIES.indexOf(b.category));
}

/** `items` grouped by category in `CATEGORIES` order; empty categories are left out. */
export function groupByCategory(items: readonly DocItem[]): [Category, DocItem[]][] {
  const groups = CATEGORIES.map((category): [Category, DocItem[]] => [
    category,
    items.filter((item) => item.category === category),
  ]);
  return groups.filter(([, group]) => group.length > 0);
}

/** A YAML scalar: plain when it is a simple phrase, else double-quoted (JSON is valid YAML). */
function yamlScalar(value: string): string {
  return /^[A-Za-z0-9][A-Za-z0-9 .,()-]*$/.test(value) ? value : JSON.stringify(value);
}

/**
 * The scaffold of one item page (SPEC-docs-site §6); the author replaces the placeholder. A
 * block's page (SPEC-components-3 §5) also lists the files it installs, under the install block.
 */
export function renderItemPage(item: DocItem): string {
  const attr = `item="${item.name}"`;
  return [
    "---",
    `title: ${yamlScalar(item.title)}`,
    `description: ${yamlScalar(item.description)}`,
    `item: ${item.name}`,
    "---",
    "",
    `<InstallCommand ${attr} />`,
    "",
    ...(item.category === "block" ? [`<ItemFiles ${attr} />`, ""] : []),
    `<CopyPrompt ${attr} />`,
    "",
    PROSE_PLACEHOLDER,
    "",
    "## Examples",
    "",
    ...item.demos.map((demo) => `<DemoFrame ${attr} demo="${demo}" />`),
    "",
    "## Props",
    "",
    `<PropsTable ${attr} />`,
    "",
  ].join("\n");
}

/**
 * `content/docs/components/meta.json`: the item pages under one separator per category. The
 * folder's `index.mdx` is left out of `pages` so Fumadocs makes it the folder's own link.
 */
export function renderComponentsMeta(items: readonly DocItem[]): string {
  const pages = groupByCategory(items).flatMap(([category, group]) => [
    `---${CATEGORY_LABELS[category]}---`,
    ...group.map((item) => item.name),
  ]);
  return `${JSON.stringify({ title: "Components", defaultOpen: true, pages }, null, 2)}\n`;
}

/** Biome's line width (biome.json): a JSON array that fits on one line is written on one. */
const JSON_LINE_WIDTH = 100;

/**
 * `content/docs/blocks/meta.json`: the block pages in catalog order, no separators, laid out as
 * Biome formats it (the page list on one line while it fits), so `gen:docs --check` and
 * `biome check` agree.
 */
export function renderBlocksMeta(items: readonly DocItem[]): string {
  const pages = items.map((item) => JSON.stringify(item.name));
  const inline = `  "pages": [${pages.join(", ")}]`;
  const list =
    inline.length <= JSON_LINE_WIDTH
      ? inline
      : `  "pages": [\n${pages.map((page) => `    ${page}`).join(",\n")}\n  ]`;
  return `{\n  "title": "Blocks",\n  "defaultOpen": true,\n${list}\n}\n`;
}

/** The meta.json `gen:docs` writes into a section's folder. */
export function renderSectionMeta(section: DocsSection, items: readonly DocItem[]): string {
  return section.catalog === BLOCKS_CATALOG ? renderBlocksMeta(items) : renderComponentsMeta(items);
}

export interface Frontmatter {
  [key: string]: string | string[] | undefined;
}

/**
 * The frontmatter of an MDX page: `key: value` lines, where a value is a plain scalar, a
 * double-quoted string or a JSON array of strings (`skipDemos: ["open"]`). Enough for the
 * pages this repo writes; anything fancier is reported as an error.
 */
export function parseFrontmatter(source: string): Frontmatter {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(source);
  if (!match) return {};
  const data: Frontmatter = {};
  for (const line of match[1].split(/\r?\n/)) {
    if (line.trim() === "" || line.trimStart().startsWith("#")) continue;
    const pair = /^([A-Za-z][\w-]*):\s*(.*)$/.exec(line);
    if (!pair) throw new Error(`Unsupported frontmatter line: ${line}`);
    const [, key, raw] = pair;
    const value = raw.trim();
    data[key] =
      value.startsWith('"') || value.startsWith("[")
        ? (JSON.parse(value) as string | string[])
        : value;
  }
  return data;
}
