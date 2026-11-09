import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { expectDemosAccessible } from "@/lib/test/axe";
import DropdownMenuSubmenuDemo from "./demos/submenu";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "./dropdown-menu";

afterEach(cleanup);

function Reader({ open }: { open?: boolean }) {
  return (
    <DropdownMenu defaultOpen={open}>
      <DropdownMenuTrigger>Chapter</DropdownMenuTrigger>
      <DropdownMenuContent className="custom-class">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Chapter 12</DropdownMenuLabel>
          <DropdownMenuItem>
            Bookmark
            <DropdownMenuShortcut>B</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>Share</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem defaultChecked>Furigana</DropdownMenuCheckboxItem>
        <DropdownMenuRadioGroup defaultValue="rtl">
          <DropdownMenuRadioItem value="rtl">Right to left</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="ltr">Left to right</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuItem variant="destructive">Report</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const frameOf = (element: Element | null | undefined) =>
  element?.querySelector<HTMLElement>(':scope > [data-slot="ink-frame"]');

describe("DropdownMenu", () => {
  it("opens from its trigger with stock roles and slots", async () => {
    render(<Reader />);
    const trigger = screen.getByRole("button", { name: "Chapter" });
    expect(trigger.getAttribute("data-slot")).toBe("dropdown-menu-trigger");
    expect(trigger.getAttribute("aria-haspopup")).toBe("menu");
    fireEvent.click(trigger);
    await act(async () => {});
    const menu = screen.getByRole("menu");
    expect(menu.getAttribute("data-slot")).toBe("dropdown-menu-content");
    expect(menu.classList.contains("custom-class")).toBe(true);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getAllByRole("menuitem").map((item) => item.textContent)).toEqual([
      "BookmarkB",
      "Share",
      "Report",
    ]);
    const checkbox = screen.getByRole("menuitemcheckbox", { name: "Furigana" });
    expect(checkbox.getAttribute("data-slot")).toBe("dropdown-menu-checkbox-item");
    expect(checkbox.getAttribute("aria-checked")).toBe("true");
    const radio = screen.getByRole("menuitemradio", { name: "Right to left" });
    expect(radio.getAttribute("data-slot")).toBe("dropdown-menu-radio-item");
    expect(radio.getAttribute("aria-checked")).toBe("true");
    expect(screen.getByText("B").getAttribute("data-slot")).toBe("dropdown-menu-shortcut");
  });

  it("draws the popup at the heavy outline width from the positioner, with no shadow or ring", () => {
    render(<Reader open />);
    const menu = screen.getByRole("menu");
    for (const name of menu.classList) {
      expect(name, name).not.toMatch(/^ring-|^shadow-/);
    }
    // The popup scrolls, so the frame hangs on its non-scrolling positioner, behind it.
    expect(frameOf(menu)).toBeNull();
    const frame = frameOf(menu.parentElement);
    expect(frame?.getAttribute("data-fill")).toBe("paper");
    expect(frame?.className).toContain("[--outline-width:var(--outline-width-heavy)]");
    expect(menu.classList.contains("bg-transparent")).toBe(true);
  });

  it("draws separators as hand-drawn rules", () => {
    render(<Reader open />);
    const separator = screen.getByRole("separator");
    expect(separator.getAttribute("data-slot")).toBe("dropdown-menu-separator");
    expect(separator.classList.contains("h-px")).toBe(false);
    expect(frameOf(separator)?.getAttribute("data-shape")).toBe("line");
  });

  it("inks the highlighted item with paper text, and turns a destructive one spot", () => {
    render(<Reader open />);
    const [bookmark, , report] = screen.getAllByRole("menuitem");
    expect(bookmark.className).toContain("focus:bg-primary");
    expect(bookmark.className).toContain("focus:text-primary-foreground");
    expect(bookmark.className).not.toContain("focus:bg-accent");
    expect(report.getAttribute("data-variant")).toBe("destructive");
    expect(report.className).toContain("data-[variant=destructive]:text-destructive");
    expect(report.className).toContain("data-[variant=destructive]:focus:bg-destructive");
    expect(report.className).toContain("data-[variant=destructive]:focus:text-spot-foreground");
  });

  it("moves the highlight with the arrow keys and selects with Enter, like stock", async () => {
    render(<Reader />);
    const trigger = screen.getByRole("button", { name: "Chapter" });
    act(() => trigger.focus());
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    await act(async () => {});
    const items = () => screen.getAllByRole("menuitem");
    const first = items()[0];
    expect(document.activeElement).toBe(first);
    expect(first.hasAttribute("data-highlighted")).toBe(true);
    fireEvent.keyDown(first, { key: "ArrowDown" });
    await act(async () => {});
    expect(document.activeElement).toBe(items()[1]);
    expect(items()[1].hasAttribute("data-highlighted")).toBe(true);
    fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });
    await act(async () => {});
    expect(screen.queryByRole("menu")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("toggles a checkbox item, like stock", async () => {
    render(<Reader open />);
    const checkbox = screen.getByRole("menuitemcheckbox", { name: "Furigana" });
    fireEvent.click(checkbox);
    await act(async () => {});
    expect(checkbox.getAttribute("aria-checked")).toBe("false");
  });

  it("opens the submenu in its submenu demo", async () => {
    render(<DropdownMenuSubmenuDemo />);
    await act(async () => {});
    expect(screen.getAllByRole("menu")).toHaveLength(2);
    const subTrigger = screen.getByRole("menuitem", { name: "Add to list" });
    expect(subTrigger.getAttribute("data-slot")).toBe("dropdown-menu-sub-trigger");
    expect(subTrigger.getAttribute("aria-expanded")).toBe("true");
    const sub = screen.getByRole("menuitem", { name: "Plan to read" }).closest('[role="menu"]');
    expect(sub?.getAttribute("data-slot")).toBe("dropdown-menu-sub-content");
    expect(frameOf(sub?.parentElement)?.getAttribute("data-fill")).toBe("paper");
  });

  expectDemosAccessible(import.meta.glob("./demos/*.tsx"));
});
