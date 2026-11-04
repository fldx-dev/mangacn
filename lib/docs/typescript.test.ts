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
  it("covers the 19 manga-native pieces", () => {
    expect(mangaNative).toHaveLength(19);
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

  it("prints every type in full, spelling out the item's own aliases", async () => {
    const types = async (item: string, file: string) =>
      Object.fromEntries(
        ((await generateOwnProps(item, file, generator))?.[0]?.entries ?? []).map((entry) => [
          entry.name,
          entry.simplifiedType,
        ]),
      );
    const bubble = await types("speech-bubble", "registry/ui/speech-bubble/speech-bubble.tsx");
    expect(bubble.tail).toBe(
      '"bottom-left" | "bottom-right" | "left" | "none" | "right" | "top-left" | "top-right"',
    );
    const emanata = await types("emanata", "registry/ui/emanata/emanata.tsx");
    expect(emanata.kind).toBe('"anger" | "puff" | "sparkle" | "surprise" | "sweat"');
    expect(emanata.decorative).toBe("boolean");
    const panel = await types("panel", "registry/ui/panel/panel.tsx");
    expect(panel.caption).toBe("React.ReactNode");
    expect(panel.as).toBe("keyof React.JSX.IntrinsicElements");
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

  it("resolves every manga-native props interface to a short, described table", async () => {
    const tables = [
      ...mangaNative.map((item) => ({
        item: item.name,
        file: item.files[0].path,
        name: undefined,
      })),
      {
        item: "panel-grid",
        file: "registry/ui/panel-grid/panel-grid.tsx",
        name: "PanelGridItemProps",
      },
    ];
    for (const { item, file, name } of tables) {
      const label = name ?? propsInterfaceName(item);
      const docs = await generateOwnProps(item, file, generator, name);
      const entries = docs?.[0]?.entries ?? [];
      expect(entries.length, `${label} props`).toBeGreaterThan(0);
      expect(entries.length, `${label} props`).toBeLessThan(10);
      for (const entry of entries) {
        expect(entry.description, `${label}.${entry.name} JSDoc`).not.toBe("");
        expect(entry.simplifiedType, `${label}.${entry.name} type`).not.toBe("union");
      }
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
