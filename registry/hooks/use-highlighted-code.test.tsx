import { renderHook, waitFor } from "@testing-library/react";
import { isValidElement, type ReactElement } from "react";
import { describe, expect, it } from "vitest";
import { useHighlightedCode } from "@/hooks/use-highlighted-code";
import { highlightCode } from "@/lib/highlighter";

// Stock's hook and its highlighter, imported by their install paths (as code-block's users do):
// plain lines first, shiki's tokens once the language has loaded.

type Token = ReactElement<{ className: string; style: Record<string, string>; children: string }>;

const tokensOf = (line: unknown) => (Array.isArray(line) ? (line as Token[]) : []);

describe("useHighlightedCode", () => {
  it("returns plain lines until the highlighter loads, then one token list per line", async () => {
    const { result } = renderHook(() => useHighlightedCode("const a = 1;\nlet b = 2;\n", "ts"));
    // The trailing newline renders no extra empty line.
    expect(result.current).toEqual(["const a = 1;", "let b = 2;"]);
    await waitFor(() => expect(Array.isArray(result.current[0])).toBe(true), { timeout: 10_000 });
    expect(result.current).toHaveLength(2);
    const first = tokensOf(result.current[0]);
    expect(first.every(isValidElement)).toBe(true);
    expect(first.map((token) => token.props.children).join("")).toBe("const a = 1;");
    expect(first[0]?.props.className).toBe("text-(--shiki-light) dark:text-(--shiki-dark)");
    expect(first[0]?.props.style["--shiki-light"]).toMatch(/^#/);
  });

  it("leaves a language it does not list as plain lines", async () => {
    const { result } = renderHook(() => useHighlightedCode("one\ntwo", "brainfuck"));
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(result.current).toEqual(["one", "two"]);
  });
});

describe("highlightCode", () => {
  it("highlights on the server in one call, and returns null for an unknown language", async () => {
    const lines = await highlightCode('echo "hi"', "sh");
    expect(lines).toHaveLength(1);
    expect(await highlightCode("x", "cobol")).toBeNull();
  });
});
