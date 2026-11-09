import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadRegistry } from "@/lib/registry";
import { collectDemos } from "@/lib/registry/demo-map";
import { CATEGORIES, CATEGORY_LABELS } from "./catalog";
import { renderSkillCatalog, SKILL_CATALOG_HEADER, SKILL_CATALOG_PATH, SKILL_DIR } from "./skill";

const registry = loadRegistry();
const catalog = renderSkillCatalog(registry, collectDemos(registry));

describe("renderSkillCatalog", () => {
  it("lists every registry item once, with its install command and docs URL", () => {
    for (const item of registry.items) {
      const lines = catalog.split("\n");
      const at = lines.findIndex((line) => line.startsWith(`- \`${item.name}\`: `));
      expect(at, item.name).toBeGreaterThan(-1);
      expect(lines.filter((line) => line.startsWith(`- \`${item.name}\`: `))).toHaveLength(1);
      expect(lines[at + 1]).toMatch(
        new RegExp(`^ {2}Install: \`npx shadcn@latest add .*@mangacn/${item.name}[ \`]`),
      );
      expect(lines[at + 2]).toMatch(/^ {2}Docs: https:\/\/www\.mangacn\.com\//);
    }
  });

  it("ends with the blocks under their own heading", () => {
    const blocks = catalog.slice(catalog.indexOf("\n## Blocks\n"));
    expect(blocks).toContain("- `chapter-list`: ");
    expect(blocks.match(/^## /gm)).toHaveLength(1);
  });

  it("starts with the generated header and the foundation, then categories in order", () => {
    expect(catalog.startsWith(`${SKILL_CATALOG_HEADER}\n`)).toBe(true);
    const headings = catalog
      .split("\n")
      .filter((line) => line.startsWith("## "))
      .map((line) => line.slice(3));
    expect(headings[0]).toBe("Foundation");
    const order = CATEGORIES.map((category) => CATEGORY_LABELS[category]);
    const rest = headings.slice(1);
    expect(rest).toEqual(order.filter((label) => rest.includes(label)));
  });

  it("gives component items their page and its Markdown, and the theme its guide", () => {
    expect(catalog).toContain(
      "  Docs: https://www.mangacn.com/docs/components/speech-bubble (Markdown: https://www.mangacn.com/docs/components/speech-bubble.md)",
    );
    expect(catalog).toContain("  Docs: https://www.mangacn.com/docs/theming\n");
    expect(catalog).toContain(
      "  Docs: https://www.mangacn.com/docs/blocks/chapter-list (Markdown: https://www.mangacn.com/docs/blocks/chapter-list.md)",
    );
    expect(catalog).toContain("Install: `npx shadcn@latest add @mangacn/theme --yes --overwrite`");
  });

  it("matches the committed references/catalog.md (run `pnpm gen:skill`)", () => {
    expect(readFileSync(path.resolve(SKILL_CATALOG_PATH), "utf8")).toBe(catalog);
  });
});

describe("skills/mangacn", () => {
  const skill = readFileSync(path.resolve(SKILL_DIR, "SKILL.md"), "utf8");
  const frontmatter = /^---\n([\s\S]*?)\n---\n/.exec(skill)?.[1] ?? "";

  it("names the skill after its folder and keeps the description under 1024 characters", () => {
    expect(frontmatter).toMatch(new RegExp(`^name: ${path.basename(SKILL_DIR)}$`, "m"));
    const description = /^description: '(.*)'$/m.exec(frontmatter)?.[1] ?? "";
    expect(description.length).toBeGreaterThan(0);
    expect(description.length).toBeLessThanOrEqual(1024);
    for (const trigger of ["manga", "comic", "hand-drawn", "speech bubble", "@mangacn"]) {
      expect(description).toContain(trigger);
    }
  });

  it("keeps the frontmatter a YAML block with the metadata nested (Biome must not format it)", () => {
    expect(skill.startsWith("---\nname: ")).toBe(true);
    expect(frontmatter).toMatch(/^license: MIT$/m);
    expect(frontmatter).toMatch(
      /^metadata:\n {2}site: "https:\/\/www\.mangacn\.com"\n {2}registry: ".+"\n {2}version: "\d+\.\d+\.\d+"$/m,
    );
  });

  it("stays under 200 lines", () => {
    expect(skill.split("\n").length).toBeLessThan(200);
  });

  it("links every reference file, and every link resolves", () => {
    const linked = [...skill.matchAll(/\]\((references\/[^)]+)\)/g)].map((match) => match[1]);
    for (const link of linked) {
      expect(existsSync(path.resolve(SKILL_DIR, link)), link).toBe(true);
    }
    const files = readdirSync(path.resolve(SKILL_DIR, "references"));
    for (const file of files) expect(linked, file).toContain(`references/${file}`);
  });
});
