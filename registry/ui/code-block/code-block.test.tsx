import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { highlightCode } from "@/lib/highlighter";
import { expectVariantsAccessible } from "@/lib/test/axe";
import { stubResizeObserver } from "@/lib/test/resize-observer";
import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockContent,
  CodeBlockCopyButton,
  CodeBlockFooter,
  CodeBlockHeader,
  CodeBlockLine,
  CodeBlockTitle,
} from "./code-block";

beforeAll(() => {
  stubResizeObserver();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const slot = (name: string) => document.querySelector<HTMLElement>(`[data-slot="${name}"]`);
const frameOf = (element: Element | null) =>
  element?.querySelector<HTMLElement>(':scope > [data-slot="ink-frame"]');

function Block({ variant }: { variant?: "default" | "destructive" }) {
  return (
    <CodeBlock variant={variant} className="custom-class">
      <CodeBlockHeader>
        <CodeBlockTitle>page.tsx</CodeBlockTitle>
        <CodeBlockActions>
          <CodeBlockCopyButton value="const a = 1;" />
        </CodeBlockActions>
      </CodeBlockHeader>
      <CodeBlockContent lineNumbers>{"const a = 1;\nconst b = 2;\n"}</CodeBlockContent>
      <CodeBlockFooter>Footer</CodeBlockFooter>
    </CodeBlock>
  );
}

describe("CodeBlock", () => {
  it("draws a heavy paper outline instead of stock's border, and no longer clips", () => {
    render(<Block />);
    const root = slot("code-block");
    expect(root?.classList.contains("custom-class")).toBe(true);
    expect(root?.dataset.variant).toBe("default");
    expect(root?.className).not.toMatch(/(^| )(border|overflow-hidden)( |$)/);
    const frame = frameOf(root ?? null);
    expect(frame?.dataset.fill).toBe("paper");
    expect(frame?.className).toContain("[--outline-width:var(--outline-width-heavy)]");
  });

  it("turns the pen spot for the destructive variant", () => {
    render(<Block variant="destructive" />);
    expect(slot("code-block")?.className).toContain("[--ink:var(--destructive)]");
  });

  it("rules the header with a hand-drawn line and sets the title in the mono face", () => {
    render(<Block />);
    const rule = slot("code-block-header")?.querySelector<HTMLElement>(
      ':scope > [data-slot="ink-frame"]',
    );
    expect(rule?.dataset.shape).toBe("line");
    expect(slot("code-block-title")?.className).toContain("font-mono");
    expect(slot("code-block-title")?.className).not.toContain("font-sans");
  });

  it("splits string content into numbered lines, dropping the trailing newline", () => {
    render(<Block />);
    const content = slot("code-block-content");
    expect(content?.tagName).toBe("PRE");
    expect(content?.tabIndex).toBe(0);
    expect(content?.dataset.numbered).toBe("true");
    expect(content?.className).toContain("[scrollbar-color:var(--ink)_transparent]");
    const lines = document.querySelectorAll('[data-slot="code-block-line"]');
    expect([...lines].map((line) => line.textContent)).toEqual(["const a = 1;", "const b = 2;"]);
  });

  it("marks changed lines: tone for added and highlighted, a spot minus for removed", () => {
    render(
      <CodeBlock>
        <CodeBlockContent>
          <CodeBlockLine variant="added">a</CodeBlockLine>
          <CodeBlockLine variant="removed">b</CodeBlockLine>
          <CodeBlockLine variant="highlighted">c</CodeBlockLine>
          <CodeBlockLine />
        </CodeBlockContent>
      </CodeBlock>,
    );
    const [added, removed, highlighted, empty] = document.querySelectorAll<HTMLElement>(
      '[data-slot="code-block-line"]',
    );
    expect(added?.className).toContain("bg-muted");
    expect(added?.className).toContain("after:content-['+']");
    expect(removed?.className).toContain("after:text-destructive");
    expect(removed?.className).not.toMatch(/bg-destructive/);
    expect(highlighted?.dataset.variant).toBe("highlighted");
    // An empty line keeps a newline, so a copied selection keeps it.
    expect(empty?.textContent).toBe("\n");
  });

  const stubClipboard = (writeText: ReturnType<typeof vi.fn>) =>
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });

  it("copies its value with mangacn's copy-button, outlined, and says so once", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard(writeText);
    render(<Block />);
    const button = screen.getByRole("button", { name: "Copy" });
    expect(button.dataset.slot).toBe("code-block-copy-button");
    expect(button.dataset.state).toBe("idle");
    // Stock's outline, icon-xs button, where copy-button alone defaults to ghost and icon.
    expect(frameOf(button)?.dataset.fill).toBe("paper");
    expect(button.className).toContain("size-6");
    // One live region in the whole block, empty until a copy.
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(document.querySelectorAll("[aria-live]")).toHaveLength(0);
    expect(screen.getByRole("status").textContent).toBe("");
    await act(async () => {
      fireEvent.click(button);
    });
    expect(writeText).toHaveBeenCalledWith("const a = 1;");
    expect(screen.getByRole("button", { name: "Copied" }).dataset.state).toBe("copied");
    expect(screen.getAllByRole("status").map((region) => region.textContent)).toEqual(["Copied"]);
  });

  it("says the copy failed when the clipboard refuses, then returns to idle", async () => {
    vi.useFakeTimers();
    stubClipboard(vi.fn().mockRejectedValue(new Error("denied")));
    render(<Block />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    });
    expect(screen.getByRole("button", { name: "Copy failed" }).dataset.state).toBe("failed");
    expect(screen.getAllByRole("status").map((region) => region.textContent)).toEqual([
      "Copy failed",
    ]);
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByRole("button", { name: "Copy" }).dataset.state).toBe("idle");
    expect(screen.getByRole("status").textContent).toBe("");
  });

  it("keeps stock's props: Button's props pass through, value is what it copies", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard(writeText);
    const onClick = vi.fn();
    render(
      <CodeBlockCopyButton
        value="npx shadcn add"
        variant="ghost"
        size="icon-sm"
        className="custom-copy"
        aria-label="Copy the command"
        onClick={onClick}
      />,
    );
    const button = screen.getByRole("button", { name: "Copy the command" });
    expect(button.className).toContain("hover:bg-muted");
    expect(frameOf(button)).toBeNull();
    expect(button.className).toContain("size-7");
    expect(button.classList.contains("custom-copy")).toBe(true);
    await act(async () => {
      fireEvent.click(button);
    });
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(writeText).toHaveBeenCalledWith("npx shadcn add");
  });

  it("shows the stock highlighter's lines in ink by default, from the theme's tokens", async () => {
    const [line] = (await highlightCode("const a = 1; // one", "tsx")) ?? [];
    render(
      <CodeBlock>
        <CodeBlockContent>
          <CodeBlockLine>{line}</CodeBlockLine>
        </CodeBlockContent>
      </CodeBlock>,
    );
    const tokens = document.querySelectorAll<HTMLElement>(
      '[data-slot="code-block-line"] span span',
    );
    expect([...tokens].map((token) => token.textContent).join("")).toBe("const a = 1; // one");
    const style = (text: string, property: string) =>
      [...tokens]
        .find((token) => token.textContent?.trim() === text)
        ?.style.getPropertyValue(property);
    // No GitHub hues: code in the foreground, the rest in the muted foreground, in both modes.
    for (const mode of ["light", "dark"]) {
      expect(style("const", `--shiki-${mode}`)).toBe("var(--foreground)");
      expect(style("const", `--shiki-${mode}-font-weight`)).toBe("bold");
      expect(style("1", `--shiki-${mode}`)).toBe("var(--foreground)");
      expect(style("// one", `--shiki-${mode}`)).toBe("var(--muted-foreground)");
      expect(style("// one", `--shiki-${mode}-font-style`)).toBe("italic");
    }
    const colours = [...tokens].map((token) => token.style.getPropertyValue("--shiki-light"));
    expect(colours.every((colour) => /^var\(--(muted-)?foreground\)$/.test(colour))).toBe(true);
  });

  expectVariantsAccessible(import.meta.glob("./variants/*.tsx"));
});
