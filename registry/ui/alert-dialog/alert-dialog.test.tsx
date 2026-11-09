import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { expectDemosAccessible } from "@/lib/test/axe";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./alert-dialog";
import AlertDialogLongDemo from "./demos/long";

afterEach(cleanup);

function Delete({ open, destructive }: { open?: boolean; destructive?: boolean }) {
  return (
    <AlertDialog defaultOpen={open}>
      <AlertDialogTrigger>Delete</AlertDialogTrigger>
      <AlertDialogContent className="custom-class">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete chapter 12?</AlertDialogTitle>
          <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant={destructive ? "destructive" : undefined}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

const frameOf = (element: Element | null) =>
  element?.querySelector<HTMLElement>(':scope > [data-slot="ink-frame"]');

describe("AlertDialog", () => {
  it("opens from its trigger as an alertdialog with stock slots and aria wiring", async () => {
    render(<Delete />);
    const trigger = screen.getByRole("button", { name: "Delete" });
    expect(trigger.getAttribute("data-slot")).toBe("alert-dialog-trigger");
    fireEvent.click(trigger);
    await act(async () => {});
    const dialog = screen.getByRole("alertdialog");
    expect(dialog.getAttribute("data-slot")).toBe("alert-dialog-content");
    expect(dialog.getAttribute("data-size")).toBe("default");
    expect(dialog.classList.contains("custom-class")).toBe(true);
    const title = screen.getByText("Delete chapter 12?");
    expect(title.getAttribute("data-slot")).toBe("alert-dialog-title");
    expect(dialog.getAttribute("aria-labelledby")).toBe(title.id);
    expect(dialog.getAttribute("aria-describedby")).toBe(
      screen.getByText("This cannot be undone.").id,
    );
  });

  it("inks the overlay and draws the popup at the heavy outline width, with no ring", () => {
    render(<Delete open />);
    const dialog = screen.getByRole("alertdialog");
    for (const name of dialog.classList) {
      expect(name, name).not.toMatch(/^ring-|^shadow-/);
    }
    const frame = frameOf(dialog);
    expect(frame?.getAttribute("data-fill")).toBe("paper");
    expect(frame?.className).toContain("[--outline-width:var(--outline-width-heavy)]");
    const overlay = document.querySelector('[data-slot="alert-dialog-overlay"]');
    expect(overlay?.classList.contains("bg-ink/70")).toBe(true);
    expect(overlay?.classList.contains("dark:bg-paper/70")).toBe(true);
    const footer = dialog.querySelector('[data-slot="alert-dialog-footer"]');
    expect(footer?.classList.contains("border-t")).toBe(false);
    expect(frameOf(footer ?? null)?.getAttribute("data-shape")).toBe("line");
  });

  it("draws the action in ink, in spot only when destructive, and cancel outlined", () => {
    const { rerender } = render(<Delete open />);
    const action = () => screen.getByRole("button", { name: "Delete" });
    expect(action().getAttribute("data-slot")).toBe("alert-dialog-action");
    expect(frameOf(action())?.getAttribute("data-fill")).toBe("ink");
    expect(action().className).not.toContain("text-destructive");
    rerender(<Delete open destructive />);
    expect(action().className).toContain("[--ink:var(--destructive)]");
    expect(action().className).toContain("text-destructive");
    const cancel = screen.getByRole("button", { name: "Cancel" });
    expect(cancel.getAttribute("data-slot")).toBe("alert-dialog-cancel");
    expect(frameOf(cancel)?.getAttribute("data-fill")).toBe("paper");
  });

  it("does not close on an outside press, and closes from cancel, like stock", async () => {
    render(<Delete open />);
    await act(async () => {});
    const overlay = document.querySelector('[data-slot="alert-dialog-overlay"]');
    if (overlay) fireEvent.pointerDown(overlay);
    if (overlay) fireEvent.click(overlay);
    await act(async () => {});
    expect(screen.getByRole("alertdialog")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await act(async () => {});
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("gives the long demo a named, focusable scroll region", () => {
    render(<AlertDialogLongDemo />);
    const region = screen.getByRole("region", { name: "What publishing does" });
    expect(region.tabIndex).toBe(0);
    expect(region.className).toContain("overflow-y-auto");
  });

  expectDemosAccessible(import.meta.glob("./demos/*.tsx"));
});
