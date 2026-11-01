import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import type { GeneratedDoc } from "fumadocs-typescript";
import { AutoTypeTable, type AutoTypeTableProps } from "fumadocs-typescript/ui";
import { isValidElement, type ReactElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { generateOwnProps } from "@/lib/docs/typescript";
import { expectNoA11yViolations } from "@/lib/test/axe";
import { PropsTable } from "./props-table";

// `cacheLife` only runs inside a Next.js "use cache" scope; Vitest ignores the directive.
vi.mock("next/cache", () => ({ cacheLife: () => {} }));

// The compiler-backed generation has its own test (lib/docs/typescript.test.ts); here it is
// stubbed so the render stays fast and jsdom never starts the TypeScript process.
vi.mock(import("@/lib/docs/typescript"), async (original) => ({
  ...(await original()),
  generateOwnProps: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.mocked(generateOwnProps).mockReset();
});

const speechBubbleDocs: GeneratedDoc[] = [
  {
    id: "speech-bubble.tsx-SpeechBubbleProps",
    name: "SpeechBubbleProps",
    entries: ["shape", "tail", "tone", "font"].map((name) => ({
      name,
      description: "",
      type: `"a" | "b" | null | undefined`,
      simplifiedType: `"a" | "b"`,
      tags: [],
      required: false,
      deprecated: false,
    })),
  },
];

/** Renders what AutoTypeTable resolves to, since jsdom cannot render async components. */
async function renderAutoTypeTable(element: ReactElement) {
  const child = (element.props as { children: unknown }).children;
  if (!isValidElement(child) || child.type !== AutoTypeTable) throw new Error("no AutoTypeTable");
  const tables = await Promise.all(await AutoTypeTable(child.props as AutoTypeTableProps));
  return render(<div>{tables}</div>);
}

describe("PropsTable for a restyled primitive", () => {
  it("links to shadcn's page and lists the mangacn additions", async () => {
    render(await PropsTable({ item: "card" }));
    expect(screen.getByRole("link", { name: "shadcn’s card page" })).toHaveProperty(
      "href",
      "https://ui.shadcn.com/docs/components/base/card",
    );
    const row = screen.getByRole("button", { name: /shadow\?/ });
    expect(row.textContent).toContain('"none" | "ink" | "hatch"');
    fireEvent.click(row);
    expect(screen.getByText("Default").nextElementSibling?.textContent).toBe('"none"');
    expect(generateOwnProps).not.toHaveBeenCalled();
  });

  it("shows only the link for a primitive without additions", async () => {
    const { container } = render(await PropsTable({ item: "radio-group" }));
    expect(screen.getByRole("link", { name: "shadcn’s radio-group page" })).toHaveProperty(
      "href",
      "https://ui.shadcn.com/docs/components/base/radio-group",
    );
    expect(container.textContent).not.toContain("mangacn adds");
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("has no axe violations", async () => {
    await expectNoA11yViolations(await PropsTable({ item: "button" }));
  });
});

describe("PropsTable for a manga-native piece", () => {
  it("generates the table from the item's <Pascal>Props interface", async () => {
    vi.mocked(generateOwnProps).mockResolvedValue(speechBubbleDocs);
    const element = await PropsTable({ item: "speech-bubble" });
    expect(generateOwnProps).toHaveBeenCalledWith(
      "speech-bubble",
      "registry/ui/speech-bubble/speech-bubble.tsx",
      undefined,
      "SpeechBubbleProps",
    );
    const { container } = await renderAutoTypeTable(element);
    const rows = within(container).getAllByRole("button");
    expect(rows.map((row) => row.querySelector("code")?.textContent)).toEqual([
      "shape?",
      "tail?",
      "tone?",
      "font?",
    ]);
  });

  it("generates the table of another interface the item exports when named", async () => {
    vi.mocked(generateOwnProps).mockResolvedValue(undefined);
    const { container } = render(
      await PropsTable({ item: "panel-grid", name: "PanelGridItemProps" }),
    );
    expect(generateOwnProps).toHaveBeenCalledWith(
      "panel-grid",
      "registry/ui/panel-grid/panel-grid.tsx",
      undefined,
      "PanelGridItemProps",
    );
    expect(container.textContent).toContain("PanelGridItemProps could not be generated");
  });

  it("falls back to a link to the source when the interface does not resolve", async () => {
    vi.mocked(generateOwnProps).mockResolvedValue(undefined);
    const { container } = render(await PropsTable({ item: "page-turn" }));
    expect(container.textContent).toContain("PageTurnProps could not be generated");
    expect(screen.getByRole("link", { name: "the page-turn source" })).toHaveProperty(
      "href",
      "https://github.com/fldx-dev/mangacn/blob/main/registry/ui/page-turn/page-turn.tsx",
    );
  });

  it("has no axe violations, generated and as the fallback", async () => {
    vi.mocked(generateOwnProps).mockResolvedValue(speechBubbleDocs);
    const { baseElement } = await renderAutoTypeTable(await PropsTable({ item: "speech-bubble" }));
    const { axe } = await import("@/lib/test/axe");
    expect(await axe(baseElement)).toHaveNoViolations();
    cleanup();

    vi.mocked(generateOwnProps).mockResolvedValue(undefined);
    await expectNoA11yViolations(await PropsTable({ item: "emanata" }));
  });
});

it("throws on an item that is not in the catalog", async () => {
  await expect(PropsTable({ item: "nope" })).rejects.toThrow(/unknown item "nope"/);
});
