import { registryItemSchema } from "shadcn/schema";
import { describe, expect, it } from "vitest";
import { loadRegistry } from "./index";
import {
  buildVariantItems,
  listComponentVariants,
  type VariantMeta,
  variantItemName,
  variantProblems,
} from "./variant-items";

const registry = loadRegistry();
const variants = listComponentVariants(registry);
const { items, skipped } = buildVariantItems(variants, registry);

const entry = (n: number, file: string, label = "Label", title = "A title."): VariantMeta => ({
  n,
  file,
  label,
  title,
});

describe("variantProblems", () => {
  it("accepts a numbered list of every file", () => {
    expect(
      variantProblems([entry(1, "default", "One"), entry(2, "b", "Two")], ["b", "default"]),
    ).toEqual([]);
  });

  it("names a missing file, an unlisted file, a reused number and a default that is not 1", () => {
    const problems = variantProblems(
      [entry(2, "default", "One"), entry(2, "gone", "Two")],
      ["default", "extra"],
    );
    expect(problems).toEqual([
      '"default": default must be n 1',
      '"gone": n 2 is used twice',
      '"gone": no variants/gone.tsx',
      "variants/extra.tsx is not listed",
    ]);
  });

  it("rejects long, lowercase, repeated or demo labels and titles without a full stop", () => {
    const problems = variantProblems(
      [
        entry(1, "default", "Four Words Are Many"),
        entry(2, "b", "lower"),
        entry(3, "c", "Same"),
        entry(4, "d", "Same", "no stop"),
        entry(5, "e", "Demo Card"),
      ],
      ["default", "b", "c", "d", "e"],
    );
    expect(problems).toEqual([
      '"default": label "Four Words Are Many" has more than 3 words',
      '"b": label must start uppercase',
      '"d": label "Same" is used twice',
      '"d": title must start uppercase and end with a full stop',
      '"e": label says demo',
    ]);
  });
});

describe("component variants", () => {
  it("number every variant file of every component", () => {
    // listComponentVariants throws on any metadata problem; this pins the count.
    expect(variants).toHaveLength(328);
    expect(new Set(variants.map((variant) => variant.component)).size).toBe(105);
  });

  it("keep each number on its file for good", () => {
    // The number is the install name: changing a line here breaks `add @mangacn/c-<x>-<n>`.
    // Append new variants; never renumber or reuse a number (SPEC-components-10 §3).
    expect(variants.map((variant) => `${variant.name} ${variant.file}`)).toMatchSnapshot();
  });
});

describe("variant items", () => {
  it("are all installable", () => {
    expect(items).toHaveLength(328);
    expect(skipped).toEqual([]);
  });

  it("leave out a variant that imports a file no item ships", () => {
    const stamp = variants.filter((variant) => variant.name === "c-stamp-3");
    const registry = loadRegistry();
    const result = buildVariantItems(
      stamp.map((variant) => ({ ...variant, path: "lib/registry/variant-items.ts" })),
      registry,
    );
    expect(result.items).toEqual([]);
    expect(result.skipped).toEqual([
      { name: "c-stamp-3", reason: 'imports the relative file "../docs/catalog"' },
    ]);
  });

  it("parse as shadcn registry items", () => {
    for (const item of items) {
      const parsed = registryItemSchema.safeParse(item);
      expect(parsed.success, item.name).toBe(true);
    }
  });

  it("depend on the items they import and import them from their install paths", () => {
    const item = items.find((candidate) => candidate.name === variantItemName("stamp", 3));
    expect(item).toMatchObject({
      type: "registry:example",
      meta: { component: "stamp", n: 3 },
      registryDependencies: [
        "https://www.mangacn.com/r/card.json",
        "https://www.mangacn.com/r/stamp.json",
      ],
      files: [
        { path: "registry/ui/stamp/variants/over-a-card.tsx", target: "@components/c-stamp-3.tsx" },
      ],
    });
    const content = item?.files[0].content ?? "";
    expect(content).toContain('from "@/components/ui/card"');
    expect(content).toContain('from "@/components/stamp"');
    expect(content).not.toContain("@/registry/");
  });

  it("import nothing from the repo layout", () => {
    for (const item of items) {
      expect(item.files[0].content, item.name).not.toMatch(/["']@\/(registry|lib\/docs)\//);
    }
  });
});
