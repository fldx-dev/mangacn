import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { expectNoA11yViolations } from "@/lib/test/axe";
import SheetDefaultDemo from "./demos/default";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./sheet";

afterEach(cleanup);

function Settings({ open, side }: { open?: boolean; side?: "top" | "right" | "bottom" | "left" }) {
  return (
    <Sheet defaultOpen={open}>
      <SheetTrigger>Settings</SheetTrigger>
      <SheetContent side={side} className="custom-class">
        <SheetHeader>
          <SheetTitle>Reader settings</SheetTitle>
          <SheetDescription>How pages turn.</SheetDescription>
        </SheetHeader>
        <input aria-label="Zoom" />
      </SheetContent>
    </Sheet>
  );
}

const frameOf = (element: Element | null) =>
  element?.querySelector<HTMLElement>(':scope > [data-slot="ink-frame"]');

describe("Sheet", () => {
  it("opens from its trigger with stock roles, slots and aria wiring", async () => {
    render(<Settings />);
    const trigger = screen.getByRole("button", { name: "Settings" });
    expect(trigger.getAttribute("data-slot")).toBe("sheet-trigger");
    fireEvent.click(trigger);
    await act(async () => {});
    const sheet = screen.getByRole("dialog");
    expect(sheet.getAttribute("data-slot")).toBe("sheet-content");
    expect(sheet.getAttribute("data-side")).toBe("right");
    expect(sheet.classList.contains("custom-class")).toBe(true);
    expect(sheet.getAttribute("aria-labelledby")).toBe(screen.getByText("Reader settings").id);
    expect(sheet.getAttribute("aria-describedby")).toBe(screen.getByText("How pages turn.").id);
  });

  it.each(["top", "right", "bottom", "left"] as const)(
    "draws one heavy hand-drawn edge for side=%s instead of a border and shadow",
    (side) => {
      render(<Settings open side={side} />);
      const sheet = screen.getByRole("dialog");
      for (const name of sheet.classList) {
        expect(name, name).not.toMatch(/(^|:)border-[tblr]$|^shadow-/);
      }
      const frame = frameOf(sheet);
      expect(frame?.getAttribute("data-shape")).toBe("line");
      expect(frame?.className).toContain("[--outline-width:var(--outline-width-heavy)]");
      expect(frame?.className).toContain(`group-data-[side=${side}]/sheet-content:`);
    },
  );

  it("inks the overlay (paper in dark mode)", () => {
    render(<Settings open />);
    const overlay = document.querySelector('[data-slot="sheet-overlay"]');
    expect(overlay?.classList.contains("bg-ink/70")).toBe(true);
    expect(overlay?.classList.contains("dark:bg-paper/70")).toBe(true);
  });

  it("traps focus inside and closes on Escape, like stock", async () => {
    render(<Settings open />);
    await act(async () => {});
    const sheet = screen.getByRole("dialog");
    expect(sheet.contains(document.activeElement)).toBe(true);
    fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });
    await act(async () => {});
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("has no axe violations in its default demo (open)", async () => {
    await expectNoA11yViolations(<SheetDefaultDemo />);
  });
});
