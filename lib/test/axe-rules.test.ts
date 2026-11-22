import { describe, expect, it } from "vitest";
import { variantEntries } from "@/lib/registry/variants.generated";
import { CONTRAST_EXEMPTIONS } from "./axe-rules";

describe("CONTRAST_EXEMPTIONS", () => {
  it("names only variants that exist, each with a selector and a note", () => {
    const variants = new Set(variantEntries.map(({ item, variant }) => `${item}/${variant}`));
    const bad = CONTRAST_EXEMPTIONS.filter(
      ({ item, variant, selector, note }) =>
        !variants.has(`${item}/${variant}`) || selector.trim() === "" || note.trim() === "",
    );
    expect(bad).toEqual([]);
  });

  it("lists each node once", () => {
    const keys = CONTRAST_EXEMPTIONS.map(
      ({ item, variant, selector }) => `${item}/${variant} ${selector}`,
    );
    expect(new Set(keys).size).toBe(keys.length);
  });
});
