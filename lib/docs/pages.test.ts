import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { collectDemos } from "@/lib/registry/demo-map";
import { loadRegistry } from "@/lib/registry/index";
import {
  COMPONENT_PAGES_DIR,
  docItems,
  PROSE_PLACEHOLDER,
  parseFrontmatter,
  renderComponentsMeta,
} from "./catalog";

// The content contract (SPEC-docs-site §6). `lib/docs/source.ts` only works inside the
// bundler, so this reads the pages from disk, like `pnpm gen:docs --check`.

const registry = loadRegistry();
const items = docItems(registry, collectDemos(registry));
const catalogNames = new Set(registry.items.map((item) => item.name));

const dir = path.resolve(COMPONENT_PAGES_DIR);
const pages = readdirSync(dir)
  .filter((file) => file.endsWith(".mdx") && file !== "index.mdx")
  .map((file) => {
    const source = readFileSync(path.join(dir, file), "utf8");
    return {
      file,
      slug: file.slice(0, -".mdx".length),
      source,
      data: parseFrontmatter(source),
    };
  });

/** The demos a page renders, from its `<DemoFrame item="…" demo="…" />` tags. */
function framedDemos(source: string, item: string): string[] {
  return [...source.matchAll(/<DemoFrame\s+item="([^"]+)"\s+demo="([^"]+)"/g)]
    .filter(([, frameItem]) => frameItem === item)
    .map(([, , demo]) => demo);
}

function skipDemos(data: ReturnType<typeof parseFrontmatter>): string[] {
  const skip = data.skipDemos ?? [];
  return Array.isArray(skip) ? skip : [skip];
}

describe("item pages", () => {
  it("exist for every catalog item with demos (run `pnpm gen:docs`)", () => {
    const slugs = new Set(pages.map((page) => page.slug));
    expect(items.filter((item) => !slugs.has(item.name)).map((item) => item.name)).toEqual([]);
  });

  it("name a catalog item in `item`, the one in their file name", () => {
    const wrong = pages
      .filter((page) => {
        const item = page.data.item;
        return typeof item !== "string" || !catalogNames.has(item) || item !== page.slug;
      })
      .map((page) => `${page.file}: item ${JSON.stringify(page.data.item)}`);
    expect(wrong).toEqual([]);
  });

  it("render every demo in the demo map unless it is listed in `skipDemos`", () => {
    const omitted = items.flatMap((item) => {
      const page = pages.find((candidate) => candidate.slug === item.name);
      if (!page) return [];
      const shown = new Set([...framedDemos(page.source, item.name), ...skipDemos(page.data)]);
      return item.demos.filter((demo) => !shown.has(demo)).map((demo) => `${item.name}/${demo}`);
    });
    expect(omitted).toEqual([]);
  });

  it("frame and skip only demos that exist", () => {
    const unknown = pages.flatMap((page) => {
      const demos = new Set(items.find((item) => item.name === page.slug)?.demos);
      return [...framedDemos(page.source, page.slug), ...skipDemos(page.data)]
        .filter((demo) => !demos.has(demo))
        .map((demo) => `${page.slug}/${demo}`);
    });
    expect(unknown).toEqual([]);
  });

  it("replace the scaffold's prose placeholder", () => {
    expect(
      pages.filter((page) => page.source.includes(PROSE_PLACEHOLDER)).map((p) => p.file),
    ).toEqual([]);
  });

  it("have a title and description", () => {
    const bare = pages.filter((page) => !page.data.title || !page.data.description);
    expect(bare.map((page) => page.file)).toEqual([]);
  });

  it("keep the catalog description (warning only)", () => {
    for (const page of pages) {
      const item = items.find((candidate) => candidate.name === page.slug);
      if (item && page.data.description !== item.description) {
        console.warn(`${page.file}: description differs from the catalog's`);
      }
    }
  });
});

describe("components/meta.json", () => {
  const meta = JSON.parse(readFileSync(path.join(dir, "meta.json"), "utf8")) as {
    pages: string[];
  };
  const listed = meta.pages.filter((entry) => !/^---.*---$/.test(entry));

  it("lists every item page once and nothing else", () => {
    const counts = new Map<string, number>();
    for (const entry of listed) counts.set(entry, (counts.get(entry) ?? 0) + 1);
    expect([...counts].filter(([, count]) => count > 1).map(([entry]) => entry)).toEqual([]);
    expect([...listed].sort()).toEqual(pages.map((page) => page.slug).sort());
  });

  it("is what `pnpm gen:docs` writes (category separators in spec order)", () => {
    expect(readFileSync(path.join(dir, "meta.json"), "utf8")).toBe(renderComponentsMeta(items));
  });

  it("is listed in the root meta.json after the guides", () => {
    const root = JSON.parse(readFileSync(path.resolve("content/docs/meta.json"), "utf8")) as {
      pages: string[];
    };
    expect(root.pages.filter((entry) => !entry.startsWith("---"))).toEqual([
      "index",
      "installation",
      "theming",
      "components",
    ]);
  });
});
