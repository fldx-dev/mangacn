import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import type { CallToolResult, McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { CATEGORIES, COMPONENTS_CATALOG } from "@/lib/docs/catalog";
import {
  addCommand,
  itemsToAdd,
  PACKAGE_MANAGERS,
  type PackageManager,
  SITE_URL,
} from "@/lib/docs/install-command";
import {
  type LoadedRegistry,
  loadRegistry,
  mangacnItemName,
  REGISTRY_ITEM_URL,
  registryItemUrl,
} from "@/lib/registry";
import { installTarget } from "@/lib/registry/install-target";

// The four mangacn tools of the MCP server (SPEC-agent-tooling §4): list_items, get_item,
// get_install_command and get_skill. Everything here is plain functions over the catalog and the
// skill folder; the route hands `registerCatalogTools` readers that cache them.

/** One catalog item as the tools describe it. */
export interface CatalogEntry {
  name: string;
  title: string;
  type: string;
  category: string;
  description: string;
  /** npm packages the item installs. */
  dependencies: string[];
  /** Where `shadcn add` writes each shipped file, at the default `components.json` aliases. */
  files: string[];
  /**
   * What the item's mangacn registry dependencies write too, transitively, in the same form
   * (`components/ink-frame.tsx`), without the item's own files.
   */
  dependencyFiles: string[];
  /** The items one add names for this item, as bare names (ink-frame first when it outlines). */
  adds: string[];
  /** The item's own docs page (`/docs/components/speech-bubble`), or null when it has none. */
  page: string | null;
  /** Absolute docs URL: the item's page, else the guide that covers it. */
  docs: string;
}

/** What the tools read; the route passes cached versions, tests pass plain ones. */
export interface CatalogReaders {
  catalog(): Promise<CatalogEntry[]>;
  /** A docs page as Markdown (the `/docs/<slug>.md` text) by its URL, or null. */
  pageMarkdown(url: string): Promise<string | null>;
  /** `get_skill`'s text for `topic` (SKILL.md when undefined). */
  skill(topic?: string): Promise<string>;
}

/** The skill folder Task 60 writes, repo-relative. */
export const SKILL_DIR = "skills/mangacn";

export { installTarget };

const THEMING_PAGE = "/docs/theming";

function categoryRank(category: string): number {
  const index = (CATEGORIES as readonly string[]).indexOf(category);
  return index === -1 ? CATEGORIES.length : index;
}

/**
 * The install targets of every mangacn item `name` depends on, depth first in declaration order,
 * each once: power-gauge → ink-frame's and sfx-text's files. Dependencies outside mangacn
 * (shadcn's own items) are not followed.
 */
export function dependencyFiles(name: string, registry: LoadedRegistry): string[] {
  const byName = new Map(registry.items.map((item) => [item.name, item]));
  const seen = new Set([name]);
  const files: string[] = [];
  const visit = (itemName: string) => {
    for (const dependency of byName.get(itemName)?.registryDependencies ?? []) {
      const depName = mangacnItemName(dependency);
      if (!depName || seen.has(depName)) continue;
      seen.add(depName);
      const depItem = byName.get(depName);
      if (!depItem) continue;
      files.push(...depItem.files.map(installTarget));
      visit(depName);
    }
  };
  visit(name);
  const own = new Set(byName.get(name)?.files.map(installTarget) ?? []);
  return [...new Set(files)].filter((file) => !own.has(file));
}

/** Every registry item in `CATEGORIES` order, catalog order within a category. */
export function readCatalog(registry: LoadedRegistry = loadRegistry()): CatalogEntry[] {
  const entries = registry.items.map((item): CatalogEntry => {
    const page =
      item.source === COMPONENTS_CATALOG
        ? `/docs/components/${item.name}`
        : item.type === "registry:theme"
          ? THEMING_PAGE
          : null;
    return {
      name: item.name,
      title: item.title ?? item.name,
      type: item.type,
      category: item.categories?.[0] ?? "",
      description: item.description ?? "",
      dependencies: item.dependencies ?? [],
      files: item.files.map(installTarget),
      dependencyFiles: dependencyFiles(item.name, registry),
      adds: itemsToAdd(item.name),
      page,
      docs: `${SITE_URL}${page ?? THEMING_PAGE}`,
    };
  });
  return entries.sort((a, b) => categoryRank(a.category) - categoryRank(b.category));
}

function distance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let diagonal = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const above = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1));
      diagonal = above;
    }
  }
  return row[b.length];
}

/** Up to three catalog names closest to `name` (substring matches first, then edit distance). */
export function nearestNames(name: string, catalog: readonly CatalogEntry[]): string[] {
  const score = (candidate: string) =>
    candidate.includes(name) || name.includes(candidate) ? 0 : distance(name, candidate);
  return catalog
    .map((entry) => ({ name: entry.name, score: score(entry.name) }))
    .sort((a, b) => a.score - b.score || a.name.localeCompare(b.name))
    .slice(0, 3)
    .map((entry) => entry.name);
}

/** `@mangacn/Speech-Bubble ` → `speech-bubble`. */
function normalizeName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/^@mangacn\//, "");
}

function unknownItem(name: string, catalog: readonly CatalogEntry[]): string {
  return `Unknown mangacn item "${name}". Nearest names: ${nearestNames(name, catalog).join(", ")}. list_items lists every item.`;
}

/** list_items: one line per item, optionally one category. */
export function listItemsText(catalog: readonly CatalogEntry[], category?: string): string {
  const entries = category ? catalog.filter((entry) => entry.category === category) : catalog;
  const lines = entries.map((entry) =>
    [
      `- ${entry.name} · ${entry.type} · ${entry.category}: ${entry.description}`,
      entry.dependencies.length > 0 ? `Needs: ${entry.dependencies.join(", ")}.` : undefined,
      `Install: \`${addCommand(entry.adds, "pnpm")}\`.`,
      `Docs: ${entry.docs}`,
    ]
      .filter((part) => part !== undefined)
      .join(" "),
  );
  const scope = category ? ` in "${category}"` : "";
  return [
    `mangacn catalog: ${entries.length} items${scope}, one per line as name · type · category: description, then the install command and the docs page. get_item returns an item's props and demos.`,
    "",
    ...lines,
    "",
  ].join("\n");
}

const ALIASES_NOTE = "(where `shadcn add` writes them with the default components.json aliases)";

/**
 * `Files: components/power-gauge.tsx; also adds components/ink-frame.tsx, components/sfx-text.tsx
 * through its registry dependencies (where …)`: everything one add writes, the item's own first.
 */
export function filesLine(entry: Pick<CatalogEntry, "files" | "dependencyFiles">): string {
  const deps = entry.dependencyFiles;
  const through = `through its registry dependencies ${ALIASES_NOTE}.`;
  if (entry.files.length === 0) {
    return deps.length > 0
      ? `Files: none of its own; adds ${deps.join(", ")} ${through}`
      : "Files: none; the item writes into your globals.css and root layout instead.";
  }
  const own = entry.files.join(", ");
  return deps.length > 0
    ? `Files: ${own}; also adds ${deps.join(", ")} ${through}`
    : `Files: ${own} ${ALIASES_NOTE}.`;
}

/** The Markdown get_item returns for an item without a page of its own (fonts, ink-frame). */
function summaryMarkdown(entry: CatalogEntry): string {
  return [
    `# ${entry.title}`,
    `> ${entry.description}`,
    `URL: ${registryItemUrl(entry.name)}`,
    `This item has no docs page of its own; ${entry.docs} covers it.`,
    [
      "```bash",
      ...PACKAGE_MANAGERS.flatMap((manager, index) => [
        ...(index > 0 ? [""] : []),
        `# ${manager}`,
        addCommand(entry.adds, manager),
      ]),
      "```",
    ].join("\n"),
    entry.dependencies.length > 0 ? `Dependencies: ${entry.dependencies.join(", ")}.` : undefined,
  ]
    .filter((part) => part !== undefined)
    .join("\n\n");
}

/** get_item: the item's docs page Markdown (or a summary) plus the Files line. */
export function itemText(entry: CatalogEntry, markdown: string | null): string {
  return `${(markdown ?? summaryMarkdown(entry)).trimEnd()}\n\n${filesLine(entry)}\n`;
}

function addOrder(name: string, catalog: readonly CatalogEntry[]): number {
  const type = catalog.find((entry) => entry.name === name)?.type;
  if (type === "registry:theme") return 0;
  if (type === "registry:font") return 1;
  return name === "ink-frame" ? 2 : 3;
}

/** get_install_command: the registries note, then one add for every item in `entries`. */
export function installText(
  entries: readonly CatalogEntry[],
  catalog: readonly CatalogEntry[],
  manager: PackageManager = "npm",
): string {
  const items = [...new Set(entries.flatMap((entry) => entry.adds))].sort(
    (a, b) => addOrder(a, catalog) - addOrder(b, catalog),
  );
  return [
    'Name the registry in components.json once (skip this when it already has "@mangacn"):',
    `"registries": { "@mangacn": "${REGISTRY_ITEM_URL}" }`,
    "Then one add for the set; --overwrite replaces the stock files shadcn init wrote (components/ui/button.tsx), which --yes alone stops at:",
    "",
    `${addCommand(items, manager)} --overwrite`,
    "",
  ].join("\n");
}

/** The one line get_skill returns while the skill folder is missing. */
export const SKILL_PLACEHOLDER =
  "The mangacn Agent Skill is not published yet (it ships with Task 60); until then use list_items, get_item and the docs at https://www.mangacn.com/llms.txt.";

/** get_skill: SKILL.md, or `references/<topic>.md`, read from `dir`. */
export function readSkill(topic?: string, dir: string = path.resolve(SKILL_DIR)): string {
  const skillFile = path.join(dir, "SKILL.md");
  if (!existsSync(skillFile)) return SKILL_PLACEHOLDER;
  if (topic === undefined) return readFileSync(skillFile, "utf8");
  const name = topic.replace(/\.md$/, "");
  const referencesDir = path.join(dir, "references");
  const file = path.join(referencesDir, `${name}.md`);
  if (existsSync(file)) return readFileSync(file, "utf8");
  const topics = existsSync(referencesDir)
    ? readdirSync(referencesDir)
        .filter((entry) => entry.endsWith(".md"))
        .map((entry) => entry.slice(0, -3))
        .sort()
    : [];
  return `No reference "${name}" in the mangacn skill; topics: ${topics.join(", ") || "none yet"}.`;
}

function text(value: string, isError = false): CallToolResult {
  return { content: [{ type: "text", text: value }], ...(isError ? { isError } : {}) };
}

const READ_ONLY = { readOnlyHint: true, openWorldHint: false } as const;

const MANAGERS = ["npm", "pnpm", "yarn", "bun"] as const satisfies readonly PackageManager[];

/** Registers list_items, get_item, get_install_command and get_skill on `mcp`. */
export function registerCatalogTools(mcp: McpServer, read: CatalogReaders): void {
  mcp.registerTool(
    "list_items",
    {
      title: "List Items",
      description:
        "List the mangacn catalog, one line per item with its type, category, description, pnpm install command and docs URL.",
      inputSchema: z.object({
        category: z.enum(CATEGORIES).optional().describe("Only the items of this category."),
      }),
      annotations: READ_ONLY,
    },
    async ({ category }) => text(listItemsText(await read.catalog(), category)),
  );

  mcp.registerTool(
    "get_item",
    {
      title: "Get Item",
      description:
        "Get one mangacn item's docs page as Markdown (install commands, every demo's source, the props table) plus the files it installs.",
      inputSchema: z.object({
        name: z.string().describe('The item name, such as "speech-bubble".'),
      }),
      annotations: READ_ONLY,
    },
    async ({ name }) => {
      const catalog = await read.catalog();
      const wanted = normalizeName(name);
      const entry = catalog.find((item) => item.name === wanted);
      if (!entry) return text(unknownItem(wanted, catalog), true);
      const markdown = entry.page ? await read.pageMarkdown(entry.page) : null;
      return text(itemText(entry, markdown));
    },
  );

  mcp.registerTool(
    "get_install_command",
    {
      title: "Get Install Command",
      description:
        "Get the one shadcn add command (with --overwrite) that installs the named mangacn items, after the components.json registries line it needs.",
      inputSchema: z.object({
        names: z.array(z.string()).min(1).describe('Item names, such as ["speech-bubble"].'),
        manager: z.enum(MANAGERS).optional().describe("The package manager; npm when left out."),
      }),
      annotations: READ_ONLY,
    },
    async ({ names, manager }) => {
      const catalog = await read.catalog();
      const wanted = [...new Set(names.map(normalizeName))];
      const unknown = wanted.filter((name) => !catalog.some((entry) => entry.name === name));
      if (unknown.length > 0) {
        return text(unknown.map((name) => unknownItem(name, catalog)).join("\n"), true);
      }
      const entries = wanted.flatMap((name) => catalog.filter((entry) => entry.name === name));
      return text(installText(entries, catalog, manager));
    },
  );

  mcp.registerTool(
    "get_skill",
    {
      title: "Get Skill",
      description:
        "Get the mangacn Agent Skill as Markdown: SKILL.md with the workflow and design rules, or one of its references by topic.",
      inputSchema: z.object({
        topic: z
          .string()
          .regex(/^[a-z0-9-]+(\.md)?$/)
          .optional()
          .describe('A references/ file, such as "design-rules"; SKILL.md when left out.'),
      }),
      annotations: READ_ONLY,
    },
    async ({ topic }) => text(await read.skill(topic)),
  );
}
