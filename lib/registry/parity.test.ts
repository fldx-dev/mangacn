import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  compareParity,
  extractCvaVariants,
  extractDataSlots,
  extractExports,
  extractParityShape,
  type ParityShape,
  sha1,
  stripComments,
} from "./parity";

const sample = readFileSync(path.resolve("lib/registry/__fixtures__/parity/sample.tsx"), "utf8");

// Stock base-nova formatting: no semicolons, multi-line export list.
const stockStyle = [
  'import { cva } from "class-variance-authority"',
  "",
  "const tabsListVariants = cva(",
  '  "group/tabs-list inline-flex",',
  "  {",
  "    variants: {",
  "      variant: {",
  '        default: "bg-muted",',
  '        line: "gap-1 bg-transparent",',
  "      },",
  "    },",
  '    defaultVariants: { variant: "default" },',
  "  }",
  ")",
  "const plain = cva('only-base')",
  "",
  "export {",
  "  Tabs,",
  "  TabsList,",
  "  tabsListVariants,",
  "}",
].join("\n");

describe("extractExports", () => {
  it("collects export lists (with renames) and exported declarations, skipping types", () => {
    expect(extractExports(sample)).toEqual([
      "Sample",
      "SampleAction",
      "SampleHeading",
      "sampleVariants",
    ]);
  });

  it("reads multi-line export lists", () => {
    expect(extractExports(stockStyle)).toEqual(["Tabs", "TabsList", "tabsListVariants"]);
  });
});

describe("extractDataSlots", () => {
  it("finds quoted and braced literal slots", () => {
    expect(extractDataSlots(sample)).toEqual(["sample", "sample-action", "sample-title"]);
  });

  it("finds slots set through useRender state", () => {
    const source = 'useRender({ render, state: { variant, slot: "badge" } })';
    expect(extractDataSlots(source)).toEqual(["badge"]);
  });
});

describe("extractCvaVariants", () => {
  it("lists both variant groups and their keys, including quoted keys", () => {
    expect(extractCvaVariants(sample)).toEqual({
      sampleVariants: {
        variant: ["default", "outline", "destructive"],
        size: ["default", "sm", "icon-xs", "lg"],
      },
    });
  });

  it("handles stock formatting and cva objects without variants", () => {
    expect(extractCvaVariants(stockStyle)).toEqual({
      tabsListVariants: { variant: ["default", "line"] },
      plain: {},
    });
  });

  it("ignores values that are not object literals", () => {
    const source = 'const x = cva("a", { variants: { size: sizes, tone: { a: "1" } } })';
    expect(extractCvaVariants(source)).toEqual({ x: { tone: ["a"] } });
  });
});

describe("stripComments", () => {
  it("blanks line and block comments but keeps strings with slashes", () => {
    expect(stripComments('a // b\n/* c */"//d"')).toBe('a     \n       "//d"');
    expect(stripComments("x /* open")).toBe("x        ");
  });
});

describe("extractParityShape", () => {
  it("combines the extractors with sorted dependency lists", () => {
    const shape = extractParityShape(stockStyle, {
      dependencies: ["cn", "@base-ui/react"],
      registryDependencies: ["button"],
    });
    expect(shape.exports).toEqual(["Tabs", "TabsList", "tabsListVariants"]);
    expect(shape.dataSlots).toEqual([]);
    expect(shape.dependencies).toEqual(["@base-ui/react", "cn"]);
    expect(shape.registryDependencies).toEqual(["button"]);
    expect(extractParityShape("").dependencies).toEqual([]);
  });
});

describe("compareParity", () => {
  const stock: ParityShape = extractParityShape(sample, { dependencies: ["cn"] });

  it("accepts an identical shape, added variant keys, groups and cva objects, and added dependencies", () => {
    const restyled = structuredClone(stock);
    restyled.dependencies.push("@base-ui/react", "class-variance-authority");
    restyled.variants.sampleVariants.variant.push("sfx");
    restyled.variants.sampleVariants.shadow = ["none", "ink"];
    restyled.variants.extraVariants = { tone: ["a"] };
    expect(compareParity(stock, stock)).toEqual([]);
    expect(compareParity(stock, restyled)).toEqual([]);
  });

  it("lets registryDependencies add mangacn items by URL, and nothing else", () => {
    const withButton = { ...stock, registryDependencies: ["button"] };
    const restyled = {
      ...withButton,
      registryDependencies: ["button", "https://www.mangacn.com/r/ink-frame.json"],
    };
    expect(compareParity(withButton, restyled)).toEqual([]);
    expect(
      compareParity(withButton, {
        ...withButton,
        registryDependencies: [
          "https://www.mangacn.com/r/ink-frame.json",
          "https://example.com/r/ink-frame.json",
          "ink-frame",
        ],
      }),
    ).toEqual([
      "registryDependencies: missing button",
      "registryDependencies: unexpected https://example.com/r/ink-frame.json, ink-frame",
    ]);
  });

  it("reports missing and unexpected exports and slots, missing dependencies and variants", () => {
    const restyled: ParityShape = {
      exports: ["Sample", "SampleAction", "SampleHeading", "sampleVariants", "Extra"],
      dataSlots: ["sample"],
      variants: {
        sampleVariants: { variant: ["default"], size: stock.variants.sampleVariants.size },
      },
      dependencies: ["lodash"],
      registryDependencies: ["@mangacn/button"],
    };
    expect(compareParity(stock, restyled)).toEqual([
      "exports: unexpected Extra",
      "data-slot: missing sample-action, sample-title",
      "dependencies: missing cn",
      "registryDependencies: unexpected @mangacn/button",
      "cva sampleVariants.variant: missing outline, destructive",
    ]);
    expect(compareParity(stock, { ...restyled, variants: {} })).toContain(
      "cva sampleVariants: missing",
    );
  });
});

describe("sha1", () => {
  it("hashes content as hex", () => {
    expect(sha1("abc")).toBe("a9993e364706816aba3e25717850c26c9cd0d89d");
  });
});
