import { readFileSync } from "node:fs";
import path from "node:path";
import { type GeneratedDoc, typeTableToMarkdown as upstreamMarkdown } from "fumadocs-typescript";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { loadRegistry } from "@/lib/registry";
import {
  type GeneratedProps,
  generatedProps,
  PROPS_GENERATED_PATH,
  typeTableToMarkdown,
} from "./props";
import {
  createPropsGenerator,
  generateOwnProps,
  propsInterfaceName,
  propsTargets,
  renderPropsFile,
} from "./typescript";

// Runs the real compiler (fumadocs-typescript starts a native TypeScript process) once over every
// table, checks lib/docs/props.generated.json against that render (so a props interface or JSDoc
// edited without `pnpm gen:props` fails here, as `gen:props --check` does in CI), and checks the
// tables the docs print from the committed file.

const generator = createPropsGenerator();
const registry = loadRegistry();
const mangaNative = registry.items.filter(
  (item) => item.type === "registry:component" && item.source === "registry/ui/registry.json",
);
const committedText = readFileSync(path.resolve(PROPS_GENERATED_PATH), "utf8").replace(
  /\r\n/g,
  "\n",
);
const committed = JSON.parse(committedText) as GeneratedProps;
let fresh: string;

beforeAll(async () => {
  fresh = await renderPropsFile(propsTargets(registry), generator);
}, 120_000);

/** prop → simplified type of an item's table in the committed file. */
function types(item: string, name?: string): Record<string, string> {
  return Object.fromEntries(
    (generatedProps(item, name, committed)?.[0]?.entries ?? []).map((entry) => [
      entry.name,
      entry.simplifiedType,
    ]),
  );
}

describe("propsInterfaceName", () => {
  it("derives the exported interface name from the item name", () => {
    expect(propsInterfaceName("speech-bubble")).toBe("SpeechBubbleProps");
    expect(propsInterfaceName("ink-splash-loader")).toBe("InkSplashLoaderProps");
    expect(propsInterfaceName("panel")).toBe("PanelProps");
  });
});

describe("propsTargets", () => {
  it("covers the 21 manga-native pieces, ink-frame and the interfaces pages name", () => {
    expect(mangaNative).toHaveLength(21);
    const targets = propsTargets(registry).map((target) => `${target.item}/${target.name}`);
    for (const item of mangaNative) {
      expect(targets).toContain(`${item.name}/${propsInterfaceName(item.name)}`);
    }
    expect(targets).toContain("ink-frame/InkFrameProps");
    expect(targets).toContain("panel-grid/PanelGridItemProps");
    expect(targets.some((target) => target.startsWith("card/"))).toBe(false);
  });
});

describe(PROPS_GENERATED_PATH, () => {
  it("matches a fresh render from the sources (run `pnpm gen:props` when this fails)", () => {
    expect(committedText).toBe(fresh);
  });

  it("lists speech-bubble's own props, without the inherited HTML attributes", () => {
    expect(Object.keys(types("speech-bubble"))).toEqual(["shape", "tail", "tone", "font"]);
    expect(types("speech-bubble").shape).toBe('"round" | "shout" | "square" | "whisper"');
  });

  it("prints every type in full, spelling out the item's own aliases", () => {
    expect(types("speech-bubble").tail).toBe(
      '"bottom-left" | "bottom-right" | "left" | "none" | "right" | "top-left" | "top-right"',
    );
    const emanata = types("emanata");
    expect(emanata.kind).toBe('"anger" | "puff" | "sparkle" | "surprise" | "sweat"');
    expect(emanata.decorative).toBe("boolean");
    const panel = types("panel");
    expect(panel.caption).toBe("React.ReactNode");
    expect(panel.as).toBe("keyof React.JSX.IntrinsicElements");
  });

  it("keeps DOM props an item redeclares (manga-frame's src and alt)", () => {
    const names = Object.keys(types("manga-frame"));
    expect(names).toEqual(expect.arrayContaining(["src", "alt", "className", "matte", "aspect"]));
    expect(names).not.toContain("onClick");
  });

  it("holds a short, described table for every manga-native props interface", () => {
    const tables = [
      ...mangaNative.map((item) => ({ item: item.name, name: propsInterfaceName(item.name) })),
      { item: "panel-grid", name: "PanelGridItemProps" },
    ];
    for (const { item, name } of tables) {
      const entries = generatedProps(item, name, committed)?.[0]?.entries ?? [];
      expect(entries.length, `${name} props`).toBeGreaterThan(0);
      expect(entries.length, `${name} props`).toBeLessThan(10);
      for (const entry of entries) {
        expect(entry.description, `${name}.${entry.name} JSDoc`).not.toBe("");
        expect(entry.simplifiedType, `${name}.${entry.name} type`).not.toBe("union");
      }
    }
  });
});

describe("typeTableToMarkdown", () => {
  it("writes every table as fumadocs-typescript's own does", () => {
    const docs: GeneratedDoc[] = [
      ...Object.values(committed).flatMap((tables) => Object.values(tables).flat()),
      {
        id: "edge",
        name: "EdgeProps",
        description: "  Edge cases.  ",
        entries: [
          {
            name: "old",
            description: "See {@link Other} for more.",
            type: "string",
            simplifiedType: "string",
            tags: [
              { name: "default", text: '"a"' },
              { name: "defaultValue", text: '"b"' },
            ],
            required: true,
            deprecated: true,
          },
          {
            name: "bare",
            description: "",
            type: "number",
            simplifiedType: "number",
            tags: [{ name: "default", text: "1" }],
            required: false,
            deprecated: false,
          },
        ],
      },
    ];
    expect(docs.length).toBeGreaterThan(20);
    for (const doc of docs) expect(typeTableToMarkdown(doc), doc.name).toBe(upstreamMarkdown(doc));
  });
});

describe("generateOwnProps", () => {
  it("returns undefined, with a warning, for an interface that does not exist", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const docs = await generateOwnProps("card", "registry/ui/card/card.tsx", generator);
    expect(docs).toBeUndefined();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("CardProps did not resolve"));
    warn.mockRestore();
  });

  it("makes renderPropsFile throw, naming the interface, so gen:props fails", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await expect(
      renderPropsFile(
        [{ item: "card", file: "registry/ui/card/card.tsx", name: "CardProps" }],
        generator,
      ),
    ).rejects.toThrow("No props table for CardProps in registry/ui/card/card.tsx");
    warn.mockRestore();
  });
}, 120_000);
