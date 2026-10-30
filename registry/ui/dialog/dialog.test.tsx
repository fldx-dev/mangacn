import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { expectNoA11yViolations } from "@/lib/test/axe";
import DialogDefaultDemo from "./demos/default";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function Rename({ open }: { open?: boolean }) {
  return (
    <Dialog defaultOpen={open}>
      <DialogTrigger>Rename</DialogTrigger>
      <DialogContent className="custom-class">
        <DialogHeader>
          <DialogTitle>Rename chapter</DialogTitle>
          <DialogDescription>Readers see the new title.</DialogDescription>
        </DialogHeader>
        <input aria-label="Title" />
        <DialogFooter>Footer</DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const frameOf = (element: Element | null) =>
  element?.querySelector<HTMLElement>(':scope > [data-slot="ink-frame"]');

describe("Dialog", () => {
  it("opens from its trigger with stock roles, slots and aria wiring", async () => {
    render(<Rename />);
    const trigger = screen.getByRole("button", { name: "Rename" });
    expect(trigger.getAttribute("data-slot")).toBe("dialog-trigger");
    fireEvent.click(trigger);
    await act(async () => {});
    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("data-slot")).toBe("dialog-content");
    expect(dialog.classList.contains("custom-class")).toBe(true);
    const title = screen.getByText("Rename chapter");
    const description = screen.getByText("Readers see the new title.");
    expect(title.getAttribute("data-slot")).toBe("dialog-title");
    expect(dialog.getAttribute("aria-labelledby")).toBe(title.id);
    expect(dialog.getAttribute("aria-describedby")).toBe(description.id);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
  });

  it("inks the overlay and draws the popup at the heavy outline width, with no ring", () => {
    render(<Rename open />);
    const dialog = screen.getByRole("dialog");
    for (const name of dialog.classList) {
      expect(name, name).not.toMatch(/^ring-|^shadow-/);
    }
    const frame = frameOf(dialog);
    expect(frame?.getAttribute("data-fill")).toBe("paper");
    expect(frame?.className).toContain("[--outline-width:var(--outline-width-heavy)]");
    const overlay = document.querySelector('[data-slot="dialog-overlay"]');
    expect(overlay?.classList.contains("bg-ink/70")).toBe(true);
    expect(overlay?.classList.contains("dark:bg-paper/70")).toBe(true);
    const footer = screen.getByText("Footer");
    expect(footer.classList.contains("border-t")).toBe(false);
    expect(frameOf(footer)?.getAttribute("data-shape")).toBe("line");
  });

  it("moves focus inside and marks the page behind as inert, like stock", async () => {
    render(<Rename open />);
    await act(async () => {});
    const dialog = screen.getByRole("dialog");
    expect(dialog.contains(document.activeElement)).toBe(true);
    expect(screen.queryByRole("button", { name: "Rename" })).toBeNull();
  });

  it("closes on Escape, like stock", async () => {
    render(<Rename open />);
    await act(async () => {});
    fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });
    await act(async () => {});
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("has a close button with an accessible name", () => {
    render(<Rename open />);
    const close = screen.getByRole("button", { name: "Close" });
    expect(close.getAttribute("data-slot")).toBe("dialog-close");
  });

  it("has no axe violations in its default demo (open)", async () => {
    await expectNoA11yViolations(<DialogDefaultDemo />);
  });
});
