import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ItemFiles, itemFilesMarkdown } from "./item-files";

afterEach(cleanup);

describe("ItemFiles", () => {
  it("lists a block's own files, then what its items add, each as code", () => {
    const { container } = render(<ItemFiles item="chapter-list" />);
    const line = container.querySelector("[data-slot=item-files]");
    const codes = [...(line?.querySelectorAll("code") ?? [])].map((code) => code.textContent);
    expect(codes.slice(0, 2)).toEqual([
      "components/blocks/chapter-list/chapter-list.tsx",
      "components/blocks/chapter-list/chapter-numeral.ts",
    ]);
    expect(codes).toContain("components/ink-frame.tsx");
    expect(line?.textContent).toMatch(
      /^Files: .*; also adds .* through its registry dependencies\.$/,
    );
  });

  it("says only its own files when it has no mangacn dependencies", () => {
    const { container } = render(<ItemFiles item="ink-frame" />);
    expect(container.textContent).toBe("Files: components/ink-frame.tsx.");
  });
});

describe("itemFilesMarkdown", () => {
  it("writes the same line in Markdown", () => {
    expect(itemFilesMarkdown("chapter-list")).toMatch(
      /^\n\*\*Files:\*\* `components\/blocks\/chapter-list\/chapter-list\.tsx`, `components\/blocks\/chapter-list\/chapter-numeral\.ts`; also adds `components\/caption-box\.tsx`, .* through its registry dependencies\.\n\n$/,
    );
    expect(itemFilesMarkdown("ink-frame")).toBe("\n**Files:** `components/ink-frame.tsx`.\n\n");
  });
});
