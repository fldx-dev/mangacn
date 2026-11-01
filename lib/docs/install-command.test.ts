import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadRegistry } from "@/lib/registry";
import { docsUrl, installCommand, PACKAGE_MANAGERS, promptFor } from "./install-command";

describe("installCommand", () => {
  it("writes one add line per package manager", () => {
    expect(PACKAGE_MANAGERS.map((manager) => installCommand("speech-bubble", manager))).toEqual([
      "pnpm dlx shadcn@latest add @mangacn/ink-frame @mangacn/speech-bubble",
      "npx shadcn@latest add @mangacn/ink-frame @mangacn/speech-bubble",
      "yarn dlx shadcn@latest add @mangacn/ink-frame @mangacn/speech-bubble",
      "bunx --bun shadcn@latest add @mangacn/ink-frame @mangacn/speech-bubble",
    ]);
  });

  it("adds ink-frame first for an item that imports it and not for one that does not", () => {
    expect(installCommand("button", "npm")).toBe(
      "npx shadcn@latest add @mangacn/ink-frame @mangacn/button",
    );
    expect(installCommand("sfx-text", "npm")).toBe("npx shadcn@latest add @mangacn/sfx-text");
    expect(installCommand("ink-frame", "npm")).toBe("npx shadcn@latest add @mangacn/ink-frame");
  });

  it("names the three fonts on the theme line and no ink-frame", () => {
    expect(installCommand("theme", "pnpm")).toBe(
      "pnpm dlx shadcn@latest add @mangacn/theme @mangacn/font-display @mangacn/font-dialogue @mangacn/font-dialogue-ja",
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
        ? `npx shadcn@latest add @mangacn/ink-frame @mangacn/${item.name}`
        : `npx shadcn@latest add @mangacn/${item.name}`;
      expect(installCommand(item.name, "npm")).toBe(expected);
    }
  });

  it("throws on an unknown item", () => {
    expect(() => installCommand("nope", "npm")).toThrow('Unknown registry item "nope"');
  });
});

describe("promptFor", () => {
  it("names the item, its description, the npm line and the page with its Markdown twin", () => {
    const prompt = promptFor("speech-bubble");
    const item = loadRegistry().items.find((entry) => entry.name === "speech-bubble");
    expect(prompt).toContain('Add the mangacn item "speech-bubble" (Speech Bubble)');
    expect(prompt).toContain(item?.description);
    expect(prompt).toContain(
      "Install it with: npx shadcn@latest add @mangacn/ink-frame @mangacn/speech-bubble",
    );
    expect(prompt).toContain("Docs: https://www.mangacn.com/docs/components/speech-bubble\n");
    expect(prompt).toContain("https://www.mangacn.com/docs/components/speech-bubble.md");
    expect(prompt).toContain("https://www.mangacn.com/docs/installation");
  });

  it("points the theme at the theming guide", () => {
    expect(docsUrl("theme")).toBe("https://www.mangacn.com/docs/theming");
    expect(promptFor("theme")).toContain("@mangacn/font-dialogue-ja");
  });
});
