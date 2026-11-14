import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { collectDemos } from "@/lib/registry/demo-map";
import { loadRegistry } from "@/lib/registry/index";
import {
  DOCS_SECTIONS,
  docItems,
  PROSE_PLACEHOLDER,
  parseFrontmatter,
  renderSectionMeta,
} from "./catalog";

// The content contract (SPEC-docs-site §6, SPEC-components-3 §5), for each generated section:
// the component pages and the block pages. `lib/docs/source.ts` only works inside the bundler,
// so this reads the pages from disk, like `pnpm gen:docs --check`.

const registry = loadRegistry();
const demoEntries = collectDemos(registry);

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

describe.each(DOCS_SECTIONS)("$dir", (section) => {
  const items = docItems(registry, demoEntries, section.catalog);
  // The names this section's pages may document: its own catalog's items.
  const catalogNames = new Set(
    registry.items.filter((item) => item.source === section.catalog).map((item) => item.name),
  );
  const dir = path.resolve(section.dir);
  const pages = (existsSync(dir) ? readdirSync(dir) : [])
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

  describe("item pages", () => {
    it("exist for every catalog item with demos (run `pnpm gen:docs`)", () => {
      const slugs = new Set(pages.map((page) => page.slug));
      expect(items.filter((item) => !slugs.has(item.name)).map((item) => item.name)).toEqual([]);
    });

    it("name an item of this section's catalog in `item`, the one in their file name", () => {
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

    it("list a block's files under its install block", () => {
      const without = pages
        .filter((page) =>
          items.some((item) => item.name === page.slug && item.category === "block"),
        )
        .filter((page) => !page.source.includes(`<ItemFiles item="${page.slug}" />`))
        .map((page) => page.file);
      expect(without).toEqual([]);
    });
  });

  describe("meta.json", () => {
    const metaPath = path.join(dir, "meta.json");

    it("lists every item page once and nothing else", () => {
      const meta = JSON.parse(readFileSync(metaPath, "utf8")) as { pages: string[] };
      const listed = meta.pages.filter((entry) => !/^---.*---$/.test(entry));
      const counts = new Map<string, number>();
      for (const entry of listed) counts.set(entry, (counts.get(entry) ?? 0) + 1);
      expect([...counts].filter(([, count]) => count > 1).map(([entry]) => entry)).toEqual([]);
      expect([...listed].sort()).toEqual(pages.map((page) => page.slug).sort());
    });

    it("is what `pnpm gen:docs` writes", () => {
      expect(readFileSync(metaPath, "utf8")).toBe(renderSectionMeta(section, items));
    });
  });
});

describe("content/docs/meta.json", () => {
  it("lists the guides, then Components, then Blocks", () => {
    const root = JSON.parse(readFileSync(path.resolve("content/docs/meta.json"), "utf8")) as {
      pages: string[];
    };
    expect(root.pages.filter((entry) => !entry.startsWith("---"))).toEqual([
      "index",
      "installation",
      "theming",
      "agents",
      "shadcn",
      ...DOCS_SECTIONS.map((section) => path.posix.basename(section.dir)),
    ]);
  });
});
