import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { expectNoA11yViolations } from "@/lib/test/axe";
import TooltipDefaultDemo from "./demos/default";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";

afterEach(cleanup);

function Bookmark({ open }: { open?: boolean }) {
  return (
    <TooltipProvider>
      <Tooltip defaultOpen={open}>
        <TooltipTrigger>Bookmark</TooltipTrigger>
        <TooltipContent className="custom-class">Bookmark this page</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

describe("Tooltip", () => {
  it("renders the open popup with its data-slot and a forwarded className", () => {
    render(<Bookmark open />);
    const content = screen.getByText("Bookmark this page");
    expect(content.getAttribute("data-slot")).toBe("tooltip-content");
    expect(content.classList.contains("custom-class")).toBe(true);
    const trigger = screen.getByText("Bookmark");
    expect(trigger.getAttribute("data-slot")).toBe("tooltip-trigger");
  });

  it("draws an ink-filled popup at the heavy outline width", () => {
    render(<Bookmark open />);
    const content = screen.getByText("Bookmark this page");
    for (const name of content.classList) {
      expect(name, name).not.toMatch(/^ring-|^shadow-/);
    }
    const frame = content.querySelector(':scope > [data-slot="ink-frame"]');
    expect(frame?.getAttribute("data-fill")).toBe("ink");
    expect(frame?.className).toContain("[--outline-width:var(--outline-width-heavy)]");
  });

  it("opens on keyboard focus and closes on Escape, like stock", async () => {
    render(<Bookmark />);
    const trigger = screen.getByText("Bookmark");
    expect(screen.queryByText("Bookmark this page")).toBeNull();
    act(() => trigger.focus());
    fireEvent.focus(trigger);
    await act(async () => {});
    expect(screen.getByText("Bookmark this page")).toBeTruthy();
    fireEvent.keyDown(trigger, { key: "Escape" });
    await act(async () => {});
    expect(screen.queryByText("Bookmark this page")).toBeNull();
  });

  it("has no axe violations in its default demo (open)", async () => {
    await expectNoA11yViolations(<TooltipDefaultDemo />);
  });
});
