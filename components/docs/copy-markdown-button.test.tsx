import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { expectNoA11yViolations } from "@/lib/test/axe";
import { stubResizeObserver } from "@/lib/test/resize-observer";
import { CopyMarkdownButton } from "./copy-markdown-button";

const CONFIRM = 2000;

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

/** A clipboard whose `write` resolves each item's `text/plain` promise, as a browser does. */
function stubClipboard() {
  const written: string[] = [];
  class ClipboardItem {
    constructor(readonly items: Record<string, Promise<string>>) {}
  }
  const write = vi.fn(async (items: ClipboardItem[]) => {
    for (const item of items) written.push(await item.items["text/plain"]);
  });
  vi.stubGlobal("ClipboardItem", ClipboardItem);
  vi.stubGlobal("navigator", { ...navigator, clipboard: { write } });
  return written;
}

describe("CopyMarkdownButton", () => {
  it("is an outline registry button", () => {
    stubResizeObserver();
    render(<CopyMarkdownButton markdownUrl="/docs/components/button.md" />);
    const button = screen.getByRole("button", { name: "Copy Markdown" });
    expect(button.getAttribute("data-slot")).toBe("copy-markdown");
    expect(button.querySelector('[data-slot="ink-frame"]')?.getAttribute("data-fill")).toBe(
      "paper",
    );
  });

  it("copies what the page's .md URL returns and confirms for two seconds", async () => {
    stubResizeObserver();
    vi.useFakeTimers();
    const written = stubClipboard();
    const fetch = vi.fn(async () => new Response("# Button\n"));
    vi.stubGlobal("fetch", fetch);
    render(<CopyMarkdownButton markdownUrl="/docs/components/badge.md" />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });
    expect(fetch).toHaveBeenCalledWith("/docs/components/badge.md");
    expect(written).toEqual(["# Button\n"]);
    expect(screen.getByRole("button").textContent).toBe("Copied Markdown");

    act(() => vi.advanceTimersByTime(CONFIRM));
    expect(screen.getByRole("button").textContent).toBe("Copy Markdown");

    // A second copy of the same page reads the cache.
    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(written).toEqual(["# Button\n", "# Button\n"]);
  });

  it("does not confirm when the fetch fails", async () => {
    stubResizeObserver();
    stubClipboard();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("Not found", { status: 404 })),
    );
    render(<CopyMarkdownButton markdownUrl="/docs/nope.md" />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });
    expect(screen.getByRole("button").textContent).toBe("Copy Markdown");
    expect(screen.getByRole("button").hasAttribute("disabled")).toBe(false);
  });

  it("has no axe violations", async () => {
    stubResizeObserver();
    await expectNoA11yViolations(<CopyMarkdownButton markdownUrl="/docs.md" />);
  });
});
