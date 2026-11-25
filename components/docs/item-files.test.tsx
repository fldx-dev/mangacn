import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import catalog from "@/registry/blocks/registry.json";
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

  it("names a hook and its lib file among what an item's dependencies add", () => {
    const { container } = render(<ItemFiles item="code-block" />);
    const codes = [...container.querySelectorAll("code")].map((code) => code.textContent);
    expect(codes[0]).toBe("components/ui/code-block.tsx");
    expect(codes).toEqual(
      expect.arrayContaining([
        "components/ui/button.tsx",
        "hooks/use-highlighted-code.ts",
        "lib/highlighter.tsx",
      ]),
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

describe("a variant of a stock family", () => {
  // SPEC-components-6 §5.1: the login-0N variants write the same form, so each page names the
  // others in one sentence, read from the catalog. Each variant's route is its own.
  const logins = (catalog as { items: { name: string }[] }).items
    .map((item) => item.name)
    .filter((name) => /^login-\d+$/.test(name));
  const prose = (names: string[]) =>
    names.length < 2 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;

  it("names the shipped blocks whose files it replaces, in one sentence", () => {
    expect(logins.length).toBeGreaterThan(2);
    const { container } = render(<ItemFiles item="login-02" />);
    const others = prose(logins.filter((name) => name !== "login-02"));
    expect(container.querySelector("[data-slot=item-files-replaces]")?.textContent).toBe(
      ` Replaces components/login-form.tsx from ${others}.`,
    );
    expect(container.querySelectorAll("[data-slot=item-files-replaces]")).toHaveLength(1);
    cleanup();
    render(<ItemFiles item="login-01" />);
    expect(document.body.textContent).toContain(
      ` from ${prose(logins.filter((name) => name !== "login-01"))}.`,
    );
  });

  it("says the same in Markdown, and nothing for a block that shares no path", () => {
    const others = prose(logins.filter((name) => name !== "login-02").map((name) => `\`${name}\``));
    expect(itemFilesMarkdown("login-02")).toContain(
      ` Replaces \`components/login-form.tsx\` from ${others}. The page`,
    );
    expect(itemFilesMarkdown("chapter-list")).not.toContain("Replaces");
  });
});

describe("a page block", () => {
  it("says its example route's URL and that the route group's folder is safe to delete", () => {
    const { container } = render(<ItemFiles item="series-page" />);
    expect(container.textContent).toContain("app/(mangacn-examples)/examples/series-page/page.tsx");
    expect(container.querySelector("[data-slot=item-files-example]")?.textContent).toBe(
      " The page is an example route at /examples/series-page, under app/(mangacn-examples)/ with every block's example route: deleting that folder removes the example routes and leaves the components.",
    );
    expect(itemFilesMarkdown("series-page")).toContain(
      " The page is an example route at `/examples/series-page`, under `app/(mangacn-examples)/` with every block's example route",
    );
  });

  it("says nothing of example routes for a block that is not a page", () => {
    const { container } = render(<ItemFiles item="chapter-list" />);
    expect(container.querySelector("[data-slot=item-files-example]")).toBeNull();
    expect(itemFilesMarkdown("chapter-list")).not.toContain("example route");
  });
});
