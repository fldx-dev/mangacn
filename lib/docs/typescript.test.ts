import { describe, expect, it, vi } from "vitest";
import { loadRegistry } from "@/lib/registry";
import { createPropsGenerator, generateOwnProps, propsInterfaceName } from "./typescript";

// Runs the real compiler (fumadocs-typescript starts a native TypeScript process), so the
// props tables of every manga-native piece are checked here rather than in a jsdom render.

const generator = createPropsGenerator();
const mangaNative = loadRegistry().items.filter(
  (item) => item.type === "registry:component" && item.source === "registry/ui/registry.json",
);

describe("propsInterfaceName", () => {
  it("derives the exported interface name from the item name", () => {
    expect(propsInterfaceName("speech-bubble")).toBe("SpeechBubbleProps");
    expect(propsInterfaceName("ink-splash-loader")).toBe("InkSplashLoaderProps");
    expect(propsInterfaceName("panel")).toBe("PanelProps");
  });
});

describe("generateOwnProps", () => {
  it("covers the 13 manga-native pieces", () => {
    expect(mangaNative).toHaveLength(13);
  });

  it("lists speech-bubble's own props, without the inherited HTML attributes", async () => {
    const docs = await generateOwnProps(
      "speech-bubble",
      "registry/ui/speech-bubble/speech-bubble.tsx",
      generator,
    );
    expect(docs?.[0]?.entries.map((entry) => entry.name)).toEqual([
      "shape",
      "tail",
      "tone",
      "font",
    ]);
    expect(docs?.[0]?.entries[0]?.simplifiedType).toBe('"round" | "shout" | "square" | "whisper"');
  });

  it("keeps DOM props an item redeclares (manga-frame's src and alt)", async () => {
    const docs = await generateOwnProps(
      "manga-frame",
      "registry/ui/manga-frame/manga-frame.tsx",
      generator,
    );
    const names = docs?.[0]?.entries.map((entry) => entry.name);
    expect(names).toEqual(expect.arrayContaining(["src", "alt", "className", "matte", "aspect"]));
    expect(names).not.toContain("onClick");
  });

  it("resolves every manga-native props interface to a short table", async () => {
    for (const item of mangaNative) {
      const docs = await generateOwnProps(item.name, item.files[0].path, generator);
      const entries = docs?.[0]?.entries ?? [];
      expect(entries.length, `${propsInterfaceName(item.name)} props`).toBeGreaterThan(0);
      expect(entries.length, `${propsInterfaceName(item.name)} props`).toBeLessThan(10);
    }
  });

  it("returns undefined, with a warning, for an interface that does not exist", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const docs = await generateOwnProps("card", "registry/ui/card/card.tsx", generator);
    expect(docs).toBeUndefined();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("CardProps did not resolve"));
    warn.mockRestore();
  });
}, 120_000);
