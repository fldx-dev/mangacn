import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadRegistry } from "@/lib/registry";
import {
  addCommand,
  addFlags,
  commandFor,
  docsUrl,
  initCommand,
  installCommand,
  itemClientNote,
  itemFiles,
  PACKAGE_MANAGERS,
  promptFor,
  SETUP_ITEMS,
  setCommand,
  setToAdd,
} from "./install-command";

describe("installCommand", () => {
  it("writes one add line per package manager", () => {
    expect(PACKAGE_MANAGERS.map((manager) => installCommand("speech-bubble", manager))).toEqual([
      "pnpm dlx shadcn@latest add @mangacn/ink-frame @mangacn/speech-bubble --overwrite",
      "npx shadcn@latest add @mangacn/ink-frame @mangacn/speech-bubble --overwrite",
      "yarn dlx shadcn@latest add @mangacn/ink-frame @mangacn/speech-bubble --overwrite",
      "bunx --bun shadcn@latest add @mangacn/ink-frame @mangacn/speech-bubble --overwrite",
    ]);
  });

  it("adds ink-frame first for an item that imports it and not for one that does not", () => {
    expect(installCommand("button", "npm")).toBe(
      "npx shadcn@latest add @mangacn/ink-frame @mangacn/button --overwrite",
    );
    expect(installCommand("sfx-text", "npm")).toBe(
      "npx shadcn@latest add @mangacn/sfx-text --overwrite",
    );
    expect(installCommand("ink-frame", "npm")).toBe(
      "npx shadcn@latest add @mangacn/ink-frame --overwrite",
    );
  });

  it("names the theme alone (it brings its three fonts by URL) and no ink-frame", () => {
    expect(installCommand("theme", "pnpm")).toBe(
      "pnpm dlx shadcn@latest add @mangacn/theme --yes --overwrite",
    );
  });

  it("derives the prefix for every catalog item from its shipped files", () => {
    const items = loadRegistry().items.filter((item) => item.type !== "registry:theme");
    const drawn = items.filter((item) =>
      item.files.some((file) =>
        readFileSync(path.resolve(file.path), "utf8").includes('from "@/components/ink-frame"'),
      ),
    );
    expect(drawn.length).toBeGreaterThan(20);
    for (const item of items) {
      const expected = drawn.includes(item)
        ? `npx shadcn@latest add @mangacn/ink-frame @mangacn/${item.name} --overwrite`
        : `npx shadcn@latest add @mangacn/${item.name} --overwrite`;
      expect(installCommand(item.name, "npm")).toBe(expected);
    }
  });

  it("throws on an unknown item", () => {
    expect(() => installCommand("nope", "npm")).toThrow('Unknown registry item "nope"');
  });
});

describe("addFlags", () => {
  it("is --overwrite for every set and --yes --overwrite with the theme in it", () => {
    expect(addFlags(["speech-bubble"])).toEqual(["--overwrite"]);
    expect(addFlags(["font-display"])).toEqual(["--overwrite"]);
    expect(addFlags(["ink-frame", "theme"])).toEqual(["--yes", "--overwrite"]);
    expect(addCommand(["theme", "button"], "bun")).toBe(
      "bunx --bun shadcn@latest add @mangacn/theme @mangacn/button --yes --overwrite",
    );
  });
});

describe("setCommand", () => {
  it("names each item once: the theme, its fonts, ink-frame, then the rest", () => {
    expect(setToAdd(["button", "speech-bubble", "theme"])).toEqual([
      "theme",
      "ink-frame",
      "button",
      "speech-bubble",
    ]);
  });

  it("leaves the fonts out beside the theme, which brings them (two sources double them)", () => {
    expect(setToAdd(["font-display", "theme", "font-dialogue-ja"])).toEqual(["theme"]);
    expect(setToAdd(["font-display", "font-dialogue"])).toEqual(["font-display", "font-dialogue"]);
  });

  it("prints the Installation page's first install with both flags", () => {
    expect(setCommand(SETUP_ITEMS, "pnpm")).toBe(
      "pnpm dlx shadcn@latest add @mangacn/theme @mangacn/ink-frame @mangacn/speech-bubble --yes --overwrite",
    );
    expect(commandFor({ setup: true }, "npm")).toBe(setCommand(SETUP_ITEMS, "npm"));
    expect(commandFor({ item: "badge" }, "npm")).toBe(installCommand("badge", "npm"));
  });

  it("gives the base-nova init that the 4.23 CLI accepts", () => {
    expect(initCommand("pnpm")).toBe("pnpm dlx shadcn@latest init -b base -p nova");
  });
});

describe("itemClientNote", () => {
  it("reads the item's directive and says nothing for the setup block or the theme", () => {
    expect(itemClientNote({ item: "speech-bubble" })).toMatch(/^(Client|Server) component: /);
    expect(itemClientNote({ item: "theme" })).toBeNull();
    expect(itemClientNote({ setup: true })).toBeNull();
  });
});

describe("blocks", () => {
  it("point at their page under /docs/blocks", () => {
    expect(docsUrl("chapter-list")).toBe("https://www.mangacn.com/docs/blocks/chapter-list");
    expect(promptFor("chapter-list")).toContain(
      "Markdown for agents (props and examples): https://www.mangacn.com/docs/blocks/chapter-list.md",
    );
  });

  it("install every file under components/blocks/<name>/, and their items' files", () => {
    const { files, dependencyFiles } = itemFiles("chapter-list");
    expect(files).toEqual([
      "components/blocks/chapter-list/chapter-list.tsx",
      "components/blocks/chapter-list/chapter-numeral.ts",
    ]);
    expect(dependencyFiles).toContain("components/ui/separator.tsx");
    expect(dependencyFiles).toContain("components/ink-frame.tsx");
  });

  it("say they are server components", () => {
    expect(itemClientNote({ item: "chapter-list" })).toMatch(/^Server component/);
  });
});

describe("promptFor", () => {
  it("names the item, its description, the npm line and the page with its Markdown twin", () => {
    const prompt = promptFor("speech-bubble");
    const item = loadRegistry().items.find((entry) => entry.name === "speech-bubble");
    expect(prompt).toContain('Add the mangacn item "speech-bubble" (Speech Bubble)');
    expect(prompt).toContain(item?.description);
    expect(prompt).toContain(
      "Install it with: npx shadcn@latest add @mangacn/ink-frame @mangacn/speech-bubble --overwrite",
    );
    expect(prompt).toContain("Docs: https://www.mangacn.com/docs/components/speech-bubble\n");
    expect(prompt).toContain("https://www.mangacn.com/docs/components/speech-bubble.md");
    expect(prompt).toContain("https://www.mangacn.com/docs/installation");
  });

  it("tells an agent why the flags are there", () => {
    expect(promptFor("speech-bubble")).toContain(
      "Keep the flag: --overwrite answers the CLI's question when a file is already there",
    );
    expect(promptFor("speech-bubble")).not.toContain("--yes");
    expect(promptFor("theme")).toContain("--yes answers the theme's");
  });

  it("names the docs MCP and the skill install command", () => {
    expect(promptFor("speech-bubble")).toContain(
      "Or read it through the mangacn docs MCP at https://www.mangacn.com/api/mcp, and install the rules with: npx skills add fldx-dev/mangacn",
    );
  });

  it("points a hook, which has no page, at its registry JSON", () => {
    expect(docsUrl("use-mobile")).toBe("https://www.mangacn.com/r/use-mobile.json");
  });

  it("points the theme at the theming guide", () => {
    expect(docsUrl("theme")).toBe("https://www.mangacn.com/docs/theming");
    expect(promptFor("theme")).toContain(
      "Install it with: npx shadcn@latest add @mangacn/theme --yes --overwrite\n",
    );
  });
});
