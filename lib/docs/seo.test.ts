import { describe, expect, it } from "vitest";
import { docsJsonLd, docsMetadata, docsTitle, jsonLdHtml, type SeoPage } from "./seo";

const page = (slugs: string[], title: string, description?: string): SeoPage => ({
  url: slugs.length ? `/docs/${slugs.join("/")}` : "/docs",
  slugs,
  data: { title, description },
});

describe("docsTitle", () => {
  it("says what an item page is", () => {
    expect(docsTitle(page(["components", "speech-bubble"], "Speech Bubble"))).toBe(
      "Speech Bubble: manga React component",
    );
    expect(docsTitle(page(["blocks", "chat-thread"], "Chat Thread"))).toBe(
      "Chat Thread: manga shadcn block",
    );
  });

  it("keeps section and guide titles, and names the introduction Docs", () => {
    expect(docsTitle(page(["components"], "Components"))).toBe("Components");
    expect(docsTitle(page(["theming"], "Theming"))).toBe("Theming");
    expect(docsTitle(page([], "Introduction"))).toBe("Docs");
  });
});

describe("docsMetadata", () => {
  it("sets the canonical URL and the Markdown alternate", () => {
    const meta = docsMetadata(page(["theming"], "Theming", "Tokens."));
    expect(meta.description).toBe("Tokens.");
    expect(meta.alternates?.canonical).toBe("/docs/theming");
    expect(meta.alternates?.types).toEqual({ "text/markdown": "/docs/theming.md" });
  });
});

describe("docsJsonLd", () => {
  it("builds the breadcrumb from the slugs", () => {
    const data = docsJsonLd(page(["components", "speech-bubble"], "Speech Bubble")) as {
      "@graph": [unknown, { itemListElement: { name: string; item: string }[] }];
    };
    expect(data["@graph"][1].itemListElement.map(({ name, item }) => [name, item])).toEqual([
      ["Docs", "https://www.mangacn.com/docs"],
      ["Components", "https://www.mangacn.com/docs/components"],
      ["Speech Bubble", "https://www.mangacn.com/docs/components/speech-bubble"],
    ]);
  });
});

describe("jsonLdHtml", () => {
  it("escapes < so the data cannot close the script tag", () => {
    expect(jsonLdHtml({ a: "</script>" })).toBe('{"a":"\\u003c/script>"}');
  });
});
