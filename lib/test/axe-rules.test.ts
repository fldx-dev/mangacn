import { describe, expect, it } from "vitest";
import { demoEntries } from "@/lib/registry/demos.generated";
import { CONTRAST_EXEMPTIONS } from "./axe-rules";

describe("CONTRAST_EXEMPTIONS", () => {
  it("names only demos that exist, each with a selector and a note", () => {
    const demos = new Set(demoEntries.map(({ item, demo }) => `${item}/${demo}`));
    const bad = CONTRAST_EXEMPTIONS.filter(
      ({ item, demo, selector, note }) =>
        !demos.has(`${item}/${demo}`) || selector.trim() === "" || note.trim() === "",
    );
    expect(bad).toEqual([]);
  });

  it("lists each node once", () => {
    const keys = CONTRAST_EXEMPTIONS.map(
      ({ item, demo, selector }) => `${item}/${demo} ${selector}`,
    );
    expect(new Set(keys).size).toBe(keys.length);
  });
});
