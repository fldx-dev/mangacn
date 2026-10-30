import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { expectNoA11yViolations } from "@/lib/test/axe";
import PopoverDefaultDemo from "./demos/default";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "./popover";

afterEach(cleanup);

function Jump({ open }: { open?: boolean }) {
  return (
    <Popover defaultOpen={open}>
      <PopoverTrigger>Jump</PopoverTrigger>
      <PopoverContent className="custom-class">
        <PopoverHeader>
          <PopoverTitle>Jump to page</PopoverTitle>
          <PopoverDescription>18 pages.</PopoverDescription>
        </PopoverHeader>
        <input aria-label="Page" />
      </PopoverContent>
    </Popover>
  );
}

describe("Popover", () => {
  it("opens from its trigger with stock roles, slots and aria wiring", async () => {
    render(<Jump />);
    const trigger = screen.getByRole("button", { name: "Jump" });
    expect(trigger.getAttribute("data-slot")).toBe("popover-trigger");
    fireEvent.click(trigger);
    await act(async () => {});
    const popup = screen.getByRole("dialog");
    expect(popup.getAttribute("data-slot")).toBe("popover-content");
    expect(popup.classList.contains("custom-class")).toBe(true);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(popup.getAttribute("aria-labelledby")).toBe(screen.getByText("Jump to page").id);
    expect(popup.getAttribute("aria-describedby")).toBe(screen.getByText("18 pages.").id);
    expect(popup.querySelector('[data-slot="popover-header"]')).not.toBeNull();
  });

  it("draws the popup at the heavy outline width, with no shadow or ring", () => {
    render(<Jump open />);
    const popup = screen.getByRole("dialog");
    for (const name of popup.classList) {
      expect(name, name).not.toMatch(/^ring-|^shadow-/);
    }
    const frame = popup.querySelector(':scope > [data-slot="ink-frame"]');
    expect(frame?.getAttribute("data-fill")).toBe("paper");
    expect(frame?.className).toContain("[--outline-width:var(--outline-width-heavy)]");
  });

  it("closes on Escape and returns focus to the trigger, like stock", async () => {
    render(<Jump />);
    const trigger = screen.getByRole("button", { name: "Jump" });
    act(() => trigger.focus());
    fireEvent.click(trigger);
    await act(async () => {});
    fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });
    await act(async () => {});
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(trigger);
  });

  it("has no axe violations in its default demo (open)", async () => {
    await expectNoA11yViolations(<PopoverDefaultDemo />);
  });
});
