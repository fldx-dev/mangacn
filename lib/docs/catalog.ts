import type { LoadedRegistry } from "@/lib/registry";

// The docs document the component catalog (registry/ui/registry.json): one page per item that
// has demos. The theme catalog (theme, fonts, ink-frame, manga-motion) is covered by the
// installation and theming guides instead.
export const COMPONENTS_CATALOG = "registry/ui/registry.json";

/** Repo-relative folder of the item pages. */
export const COMPONENT_PAGES_DIR = "content/docs/components";

/** Catalog categories in sidebar and index order (SPEC-docs-site §4). */
export const CATEGORIES = [
  "primitive",
  "layout",
  "text",
  "background",
  "decoration",
  "feedback",
  "animation",
  "data",
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
 * category. Throws naming an item whose first category is not one of `CATEGORIES`.
 */
export function docItems(
  registry: LoadedRegistry,
  demos: readonly { item: string; demo: string }[],
): DocItem[] {
  const items: DocItem[] = [];
  for (const entry of registry.items) {
    if (entry.source !== COMPONENTS_CATALOG) continue;
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

/** The scaffold of one item page (SPEC-docs-site §6); the author replaces the placeholder. */
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
