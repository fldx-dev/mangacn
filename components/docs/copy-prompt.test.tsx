import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { promptFor } from "@/lib/docs/install-command";
import { expectNoA11yViolations } from "@/lib/test/axe";
import { stubResizeObserver } from "@/lib/test/resize-observer";
import { CopyPrompt } from "./copy-prompt";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("CopyPrompt", () => {
  it("is an outline registry button", () => {
    stubResizeObserver();
    render(<CopyPrompt item="speech-bubble" />);
    const button = screen.getByRole("button", { name: "Copy prompt for AI" });
    expect(button.getAttribute("data-slot")).toBe("copy-prompt");
    expect(button.querySelector('[data-slot="ink-frame"]')?.getAttribute("data-fill")).toBe(
      "paper",
    );
  });

  it("copies the item's prompt and confirms for two seconds", async () => {
    stubResizeObserver();
    vi.useFakeTimers();
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText } });
    render(<CopyPrompt item="speech-bubble" />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });
    expect(writeText).toHaveBeenCalledWith(promptFor("speech-bubble"));
    expect(screen.getByRole("button").textContent).toBe("Copied prompt");

    act(() => vi.advanceTimersByTime(1999));
    expect(screen.getByRole("button").textContent).toBe("Copied prompt");
    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByRole("button").textContent).toBe("Copy prompt for AI");
  });

  it("has no axe violations", async () => {
    stubResizeObserver();
    await expectNoA11yViolations(<CopyPrompt item="speech-bubble" />);
  });
});
