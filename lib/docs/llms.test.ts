import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { llms, loader } from "fumadocs-core/source";
import { describe, expect, it } from "vitest";
import { parseFrontmatter } from "./catalog";
import { type MarkdownPage, markdownUrl, renderIndex, renderMarkdownPage } from "./llms";

// `lib/docs/source.ts` only works inside the bundler, so the index test builds the same loader
// from the files on disk (pages and meta.json) and runs `llms()` over it; the real routes are
// checked with `next build` + `curl` (see the task notes).

const CONTENT = path.resolve("content/docs");

function contentFiles(dir = CONTENT): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? contentFiles(path.join(dir, entry.name))
      : [path.relative(CONTENT, path.join(dir, entry.name)).replaceAll("\\", "/")],
  );
}

const diskSource = loader({
  baseUrl: "/docs",
  source: {
    files: contentFiles().map((file) => {
      const text = readFileSync(path.join(CONTENT, file), "utf8");
      return file.endsWith(".json")
        ? { type: "meta" as const, path: file, data: JSON.parse(text) }
        : { type: "page" as const, path: file, data: parseFrontmatter(text) };
    }),
  },
});

describe("llms index over the docs pages", () => {
  // What `llmsIndex()` in source.ts does, over the loader built from disk.
  const diskLlms = llms(diskSource);
  const index = async () =>
    renderIndex(
      (await Promise.all(diskSource.getPageTree().children.map((n) => diskLlms.indexNode(n)))).join(
        "\n",
      ),
      diskSource.getPage([])?.data.description,
    );

  it("lists every docs page as a link to its Markdown, with its title", async () => {
    const text = await index();
    const pages = diskSource.getPages();
    expect(pages.length).toBeGreaterThan(30);
    for (const page of pages) {
      expect(text).toContain(`[${page.data.title}](https://www.mangacn.com${page.url}.md)`);
    }
    expect(text).toContain(
      "- [Speech Bubble](https://www.mangacn.com/docs/components/speech-bubble.md): Dialogue bubble with a hand-drawn tail",
    );
  });

  it("opens with the project name and the introduction's description", async () => {
    expect(await index()).toMatch(
      /^# mangacn\n\n> Manga-styled React components, distributed as a shadcn registry\.\n\nEvery link below/,
    );
  });
});

describe("renderIndex", () => {
  it("rewrites only docs links, keeping titles and descriptions", () => {
    expect(
      renderIndex("- [Docs](/docs): Intro.\n- [Elsewhere](https://example.com)", "Summary."),
    ).toBe(
      [
        "# mangacn",
        "> Summary.",
        "Every link below is the page as Markdown; https://www.mangacn.com/llms-full.txt holds them all in one file.",
        "- [Docs](https://www.mangacn.com/docs.md): Intro.\n- [Elsewhere](https://example.com)\n",
      ].join("\n\n"),
    );
  });
});

function stubPage(body: string, data: Partial<MarkdownPage["data"]> = {}): MarkdownPage {
  return {
    url: "/docs/components/speech-bubble",
    data: {
      title: "Speech Bubble",
      description: "Dialogue bubble with a hand-drawn tail.",
      getText: async () => body,
      ...data,
    },
  };
}

function NoDemo() {
  return null;
}

describe("renderMarkdownPage", () => {
  it("heads the processed Markdown with the title, description and canonical URL", async () => {
    expect(await renderMarkdownPage(stubPage("\n## Examples\n\nText.\n\n"))).toBe(
      [
        "# Speech Bubble",
        "> Dialogue bubble with a hand-drawn tail.",
        "URL: https://www.mangacn.com/docs/components/speech-bubble",
        "## Examples\n\nText.\n",
      ].join("\n\n"),
    );
  });

  it("hands the Markdown components to getText", async () => {
    const components = { DemoFrame: NoDemo };
    let received: unknown;
    await renderMarkdownPage(
      stubPage("", {
        getText: async (_type, options) => {
          received = options?.components;
          return "";
        },
      }),
      components,
    );
    expect(received).toBe(components);
  });

  it("drops a missing description", async () => {
    const markdown = await renderMarkdownPage(stubPage("Body.", { description: undefined }));
    expect(markdown).toBe(
      "# Speech Bubble\n\nURL: https://www.mangacn.com/docs/components/speech-bubble\n\nBody.\n",
    );
  });
});

describe("markdownUrl", () => {
  it("is the page URL plus .md, the root included", () => {
    expect(markdownUrl("/docs/components/button")).toBe("/docs/components/button.md");
    expect(markdownUrl("/docs")).toBe("/docs.md");
  });
});
