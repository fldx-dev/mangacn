import { describe, expect, it } from "vitest";
import type { LoadedRegistry, LoadedRegistryItem } from "@/lib/registry";
import {
  BLOCKS_CATALOG,
  CATEGORY_LABELS,
  COMPONENTS_CATALOG,
  DOCS_SECTIONS,
  type DocItem,
  docItems,
  groupByCategory,
  itemPagePath,
  PROSE_PLACEHOLDER,
  parseFrontmatter,
  renderBlocksMeta,
  renderComponentsMeta,
  renderItemPage,
  renderSectionMeta,
} from "./catalog";

function item(name: string, category: string, source = COMPONENTS_CATALOG): LoadedRegistryItem {
  return {
    name,
    type: "registry:component",
    title: name.toUpperCase(),
    description: `The ${name}: with a colon.`,
    categories: [category],
    files: [],
    source,
  };
}

const registry: LoadedRegistry = {
  name: "fixture",
  homepage: "",
  items: [
    item("bubble", "text"),
    item("button", "primitive"),
    item("frame", "decoration", "registry/theme/registry.json"),
    item("lonely", "layout"),
    item("shelf", "block", BLOCKS_CATALOG),
    item("reader", "block", BLOCKS_CATALOG),
  ],
};

const demos = [
  { item: "bubble", demo: "tails" },
  { item: "bubble", demo: "default" },
  { item: "button", demo: "default" },
  { item: "frame", demo: "default" },
  { item: "shelf", demo: "default" },
  { item: "reader", demo: "default" },
];

describe("docItems", () => {
  it("keeps component-catalog items with demos, in category order, default demo first", () => {
    expect(docItems(registry, demos)).toEqual([
      expect.objectContaining({ name: "button", category: "primitive", demos: ["default"] }),
      expect.objectContaining({ name: "bubble", category: "text", demos: ["default", "tails"] }),
    ]);
  });

  it("keeps the block catalog's items, in catalog order, when asked for it", () => {
    expect(docItems(registry, demos, BLOCKS_CATALOG).map((entry) => entry.name)).toEqual([
      "shelf",
      "reader",
    ]);
  });

  it("throws naming an item with an unknown category", () => {
    const odd = { ...registry, items: [item("odd", "misc")] };
    expect(() => docItems(odd, [{ item: "odd", demo: "default" }])).toThrow(/"odd".*"misc"/);
  });
});

describe("renderItemPage", () => {
  const page = renderItemPage(docItems(registry, demos)[1]);

  it("writes frontmatter the parser reads back", () => {
    expect(parseFrontmatter(page)).toEqual({
      title: "BUBBLE",
      description: "The bubble: with a colon.",
      item: "bubble",
    });
  });

  it("lists every demo, the install command, the prompt, the props and the placeholder", () => {
    expect(page).toContain('<InstallCommand item="bubble" />');
    expect(page).toContain('<CopyPrompt item="bubble" />');
    expect(page).toContain(
      '<DemoFrame item="bubble" demo="default" />\n<DemoFrame item="bubble" demo="tails" />',
    );
    expect(page).toContain('<PropsTable item="bubble" />');
    expect(page).toContain(PROSE_PLACEHOLDER);
  });
});

describe("block pages", () => {
  const blocks = docItems(registry, demos, BLOCKS_CATALOG);

  it("list the block's files under the install block", () => {
    expect(renderItemPage(blocks[0])).toContain(
      '<InstallCommand item="shelf" />\n\n<ItemFiles item="shelf" />\n\n<CopyPrompt item="shelf" />',
    );
    expect(renderItemPage(docItems(registry, demos)[0])).not.toContain("ItemFiles");
  });

  it("show a page block's whole page instead of its demos, with no props table of their own", () => {
    const login: DocItem = {
      name: "login-01",
      title: "Login 01",
      description: "A login page.",
      category: "block",
      demos: ["default"],
      page: true,
    };
    const scaffold = renderItemPage(login);
    expect(parseFrontmatter(scaffold).skipDemos).toEqual(["default"]);
    expect(scaffold).toContain('<ItemFiles item="login-01" />');
    expect(scaffold).toContain('## Preview\n\n<BlockPreview item="login-01" />');
    expect(scaffold).not.toContain("DemoFrame");
    expect(scaffold).not.toContain("PropsTable");
  });

  it("sit in the Blocks section, under a separator per group", () => {
    const meta = { title: "Blocks", defaultOpen: true, pages: ["---Manga---", "shelf", "reader"] };
    expect(JSON.parse(renderBlocksMeta(blocks))).toEqual(meta);
    // Biome's layout: the list on one line while it fits in 100 columns, else one per line.
    expect(renderBlocksMeta(blocks)).toBe(
      '{\n  "title": "Blocks",\n  "defaultOpen": true,\n  "pages": ["---Manga---", "shelf", "reader"]\n}\n',
    );
    const many = Array.from({ length: 9 }, (_, i) => ({
      ...blocks[0],
      name: `shelf-${"abcdefghi"[i]}`,
    }));
    expect(renderBlocksMeta(many)).toContain('  "pages": [\n    "---Manga---",\n    "shelf-a",');
    expect(JSON.parse(renderBlocksMeta(many)).pages).toHaveLength(10);
    // A new block joins its family's group by its name alone: Manga first, in catalog order,
    // then App, Login, Signup and Sidebar, each by number.
    const stock = [
      "sidebar-16",
      "login-02",
      "file-manager-01",
      "sidebar-07",
      "signup-01",
      "settings-01",
      "login-01",
    ].map((name) => ({ ...blocks[0], name }));
    expect(JSON.parse(renderBlocksMeta([...stock, ...blocks])).pages).toEqual([
      "---Manga---",
      "shelf",
      "reader",
      "---App---",
      "file-manager-01",
      "settings-01",
      "---Login---",
      "login-01",
      "login-02",
      "---Signup---",
      "signup-01",
      "---Sidebar---",
      "sidebar-07",
      "sidebar-16",
    ]);
    expect(JSON.parse(renderBlocksMeta([])).pages).toEqual([]);
    expect(JSON.parse(renderSectionMeta(DOCS_SECTIONS[1], blocks))).toEqual(meta);
    expect(renderSectionMeta(DOCS_SECTIONS[0], docItems(registry, demos))).toBe(
      renderComponentsMeta(docItems(registry, demos)),
    );
  });

  it("have their own URL; theme-catalog items have none", () => {
    expect(itemPagePath({ name: "shelf", source: BLOCKS_CATALOG })).toBe("/docs/blocks/shelf");
    expect(itemPagePath({ name: "bubble", source: COMPONENTS_CATALOG })).toBe(
      "/docs/components/bubble",
    );
    expect(itemPagePath({ name: "frame", source: "registry/theme/registry.json" })).toBeNull();
  });
});

describe("renderComponentsMeta", () => {
  it("groups the pages under category separators", () => {
    expect(JSON.parse(renderComponentsMeta(docItems(registry, demos)))).toEqual({
      title: "Components",
      defaultOpen: true,
      pages: ["---Primitives---", "button", "---Text---", "bubble"],
    });
  });
});

describe("the Inputs and Display groups (SPEC-components-7 §6)", () => {
  // A form and a display item, listed out of order, with an empty group (layout) between.
  const grouped: LoadedRegistry = {
    ...registry,
    items: [
      item("chips", "display"),
      item("bubble", "text"),
      item("dial", "form"),
      item("button", "primitive"),
    ],
  };
  const groupedDemos = ["chips", "bubble", "dial", "button"].map((name) => ({
    item: name,
    demo: "default",
  }));

  it("come right after Primitives, and an empty group has no heading", () => {
    expect(
      groupByCategory(docItems(grouped, groupedDemos)).map(([category, group]) => [
        CATEGORY_LABELS[category],
        group.map((entry) => entry.name),
      ]),
    ).toEqual([
      ["Primitives", ["button"]],
      ["Inputs", ["dial"]],
      ["Display", ["chips"]],
      ["Text", ["bubble"]],
    ]);
  });

  it("get a sidebar separator each, and an empty group gets none", () => {
    expect(JSON.parse(renderComponentsMeta(docItems(grouped, groupedDemos))).pages).toEqual([
      "---Primitives---",
      "button",
      "---Inputs---",
      "dial",
      "---Display---",
      "chips",
      "---Text---",
      "bubble",
    ]);
  });
});

describe("parseFrontmatter", () => {
  it("reads plain, quoted and array values, and CRLF files", () => {
    expect(
      parseFrontmatter('---\r\ntitle: Dialog\r\nskipDemos: ["open", "nested"]\r\n---\r\nbody'),
    ).toEqual({ title: "Dialog", skipDemos: ["open", "nested"] });
  });

  it("returns nothing without frontmatter and throws on a line it cannot read", () => {
    expect(parseFrontmatter("# no frontmatter")).toEqual({});
    expect(() => parseFrontmatter("---\n- list\n---\n")).toThrow(/Unsupported/);
  });
});
