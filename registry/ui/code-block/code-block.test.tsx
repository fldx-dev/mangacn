import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { highlightInk } from "@/lib/docs/ink-highlight";
import { expectDemosAccessible } from "@/lib/test/axe";
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

  it("copies its value with mangacn's outlined icon button and says so", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    render(<Block />);
    const button = screen.getByRole("button", { name: "Copy" });
    expect(button.dataset.slot).toBe("code-block-copy-button");
    expect(frameOf(button)?.dataset.fill).toBe("paper");
    await act(async () => {
      fireEvent.click(button);
    });
    expect(writeText).toHaveBeenCalledWith("const a = 1;");
    expect(screen.getByRole("button", { name: "Copied" }).dataset.copied).toBe("true");
    expect(document.querySelector('[aria-live="polite"]')?.textContent).toBe("Copied");
  });

  it("takes ink-highlighted lines from the docs' sync highlighter", () => {
    const [line] = highlightInk("const a = 1;", "tsx");
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
    expect([...tokens].map((token) => token.textContent).join("")).toBe("const a = 1;");
    expect(tokens[0]?.style.getPropertyValue("--shiki-light").toLowerCase()).toBe("#0f0d0b");
    expect(tokens[0]?.style.getPropertyValue("--shiki-light-font-weight")).toBe("bold");
  });

  expectDemosAccessible(import.meta.glob("./demos/*.tsx"));
});
