import { describe, expect, it } from "vitest";
import type { LoadedRegistry, LoadedRegistryItem } from "@/lib/registry";
import {
  COMPONENTS_CATALOG,
  docItems,
  PROSE_PLACEHOLDER,
  parseFrontmatter,
  renderComponentsMeta,
  renderItemPage,
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
  ],
};

const demos = [
  { item: "bubble", demo: "tails" },
  { item: "bubble", demo: "default" },
  { item: "button", demo: "default" },
  { item: "frame", demo: "default" },
];

describe("docItems", () => {
  it("keeps component-catalog items with demos, in category order, default demo first", () => {
    expect(docItems(registry, demos)).toEqual([
      expect.objectContaining({ name: "button", category: "primitive", demos: ["default"] }),
      expect.objectContaining({ name: "bubble", category: "text", demos: ["default", "tails"] }),
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

describe("renderComponentsMeta", () => {
  it("groups the pages under category separators", () => {
    expect(JSON.parse(renderComponentsMeta(docItems(registry, demos)))).toEqual({
      title: "Components",
      defaultOpen: true,
      pages: ["---Primitives---", "button", "---Text---", "bubble"],
    });
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
