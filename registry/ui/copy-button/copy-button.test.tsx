import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { expectDemosAccessible } from "@/lib/test/axe";
import { CopyButton } from "./copy-button";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  Reflect.deleteProperty(navigator, "clipboard");
});

function stubClipboard(writeText = vi.fn().mockResolvedValue(undefined)) {
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
  return writeText;
}

const status = () => screen.getByRole("status");

describe("CopyButton", () => {
  expectDemosAccessible(import.meta.glob("./demos/*.tsx"));

  it("is mangacn's ghost icon button, idle and named Copy", () => {
    render(<CopyButton value="a" className="custom" />);
    const button = screen.getByRole("button", { name: "Copy" });
    expect(button.dataset.slot).toBe("copy-button");
    expect(button.dataset.state).toBe("idle");
    expect(button.classList.contains("custom")).toBe(true);
    expect(button.className).toContain("size-8");
    expect(button.getAttribute("type")).toBe("button");
    expect(status().textContent).toBe("");
  });

  it("copies the value, turns copied, announces once and goes back to idle", async () => {
    vi.useFakeTimers();
    const writeText = stubClipboard();
    const onCopy = vi.fn();
    render(<CopyButton value="npx shadcn add" onCopy={onCopy} timeout={500} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    });
    expect(writeText).toHaveBeenCalledWith("npx shadcn add");
    expect(onCopy).toHaveBeenCalledWith("npx shadcn add");
    const button = screen.getByRole("button", { name: "Copied" });
    expect(button.dataset.state).toBe("copied");
    expect(status().textContent).toBe("Copied");
    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    expect(button.dataset.state).toBe("idle");
    expect(button.getAttribute("aria-label")).toBe("Copy");
    expect(status().textContent).toBe("");
  });

  it("copies what a (possibly async) function returns at click time", async () => {
    const writeText = stubClipboard();
    render(<CopyButton value={async () => "from a promise"} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });
    expect(writeText).toHaveBeenCalledWith("from a promise");
  });

  it("fails and calls onCopyError without the Clipboard API", async () => {
    Reflect.deleteProperty(navigator, "clipboard");
    const onCopyError = vi.fn();
    const onCopy = vi.fn();
    render(<CopyButton value="a" onCopy={onCopy} onCopyError={onCopyError} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });
    expect(onCopyError).toHaveBeenCalledWith(expect.any(Error));
    expect(onCopy).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Copy failed" }).dataset.state).toBe("failed");
    expect(status().textContent).toBe("Copy failed");
  });

  it("fails when the clipboard refuses the write", async () => {
    const refusal = new Error("denied");
    stubClipboard(vi.fn().mockRejectedValue(refusal));
    const onCopyError = vi.fn();
    render(<CopyButton value="a" onCopyError={onCopyError} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });
    expect(onCopyError).toHaveBeenCalledWith(refusal);
  });

  it("is a native, focusable button (Enter and Space click it; the browser e2e presses them)", () => {
    render(<CopyButton value="a" />);
    const button = screen.getByRole("button");
    expect(button.tagName).toBe("BUTTON");
    button.focus();
    expect(document.activeElement).toBe(button);
  });

  it("takes its words from labels", async () => {
    stubClipboard();
    render(<CopyButton value="a" labels={{ copy: "コピー", copied: "コピーしました" }} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "コピー" }));
    });
    expect(screen.getByRole("button", { name: "コピーしました" })).toBeTruthy();
    expect(status().textContent).toBe("コピーしました");
  });

  it("is named by its children when it has a visible label", () => {
    render(
      <CopyButton value="a" size="sm" variant="outline">
        Copy command
      </CopyButton>,
    );
    const button = screen.getByRole("button", { name: "Copy command" });
    expect(button.hasAttribute("aria-label")).toBe(false);
    expect(button.querySelector('[data-slot="ink-frame"]')).not.toBeNull();
  });

  it("calls the caller's onClick too", async () => {
    stubClipboard();
    const onClick = vi.fn();
    render(<CopyButton value="a" onClick={onClick} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
