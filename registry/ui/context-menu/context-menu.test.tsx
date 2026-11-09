import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { expectDemosAccessible } from "@/lib/test/axe";
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "./context-menu";
import ContextMenuSubmenuDemo from "./demos/submenu";

afterEach(cleanup);

function Page() {
  return (
    <ContextMenu>
      <ContextMenuTrigger className="custom-trigger">Panel 3</ContextMenuTrigger>
      <ContextMenuContent className="custom-class">
        <ContextMenuGroup>
          <ContextMenuLabel>Page 12</ContextMenuLabel>
          <ContextMenuItem>
            Bookmark
            <ContextMenuShortcut>B</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem>Share</ContextMenuItem>
        </ContextMenuGroup>
        <ContextMenuSeparator />
        <ContextMenuCheckboxItem defaultChecked>Furigana</ContextMenuCheckboxItem>
        <ContextMenuRadioGroup defaultValue="rtl">
          <ContextMenuRadioItem value="rtl">Right to left</ContextMenuRadioItem>
          <ContextMenuRadioItem value="ltr">Left to right</ContextMenuRadioItem>
        </ContextMenuRadioGroup>
        <ContextMenuItem variant="destructive">Report</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

const frameOf = (element: Element | null | undefined) =>
  element?.querySelector<HTMLElement>(':scope > [data-slot="ink-frame"]');

async function openAt(trigger: HTMLElement, clientX = 40, clientY = 30) {
  fireEvent.contextMenu(trigger, { clientX, clientY });
  await act(async () => {});
}

describe("ContextMenu", () => {
  it("opens on right-click with stock roles and slots", async () => {
    render(<Page />);
    const trigger = screen.getByText("Panel 3");
    expect(trigger.getAttribute("data-slot")).toBe("context-menu-trigger");
    expect(trigger.className).toContain("select-none");
    expect(trigger.classList.contains("custom-trigger")).toBe(true);
    expect(screen.queryByRole("menu")).toBeNull();
    await openAt(trigger);
    const menu = screen.getByRole("menu");
    expect(menu.getAttribute("data-slot")).toBe("context-menu-content");
    expect(menu.classList.contains("custom-class")).toBe(true);
    expect(screen.getAllByRole("menuitem").map((item) => item.textContent)).toEqual([
      "BookmarkB",
      "Share",
      "Report",
    ]);
    const checkbox = screen.getByRole("menuitemcheckbox", { name: "Furigana" });
    expect(checkbox.getAttribute("data-slot")).toBe("context-menu-checkbox-item");
    expect(checkbox.getAttribute("aria-checked")).toBe("true");
    const radio = screen.getByRole("menuitemradio", { name: "Right to left" });
    expect(radio.getAttribute("data-slot")).toBe("context-menu-radio-item");
    expect(radio.getAttribute("aria-checked")).toBe("true");
    expect(screen.getByText("Page 12").getAttribute("data-slot")).toBe("context-menu-label");
    expect(screen.getByText("B").getAttribute("data-slot")).toBe("context-menu-shortcut");
  });

  it("opens on a long press, like stock", async () => {
    render(<Page />);
    const trigger = screen.getByText("Panel 3");
    const touch = { clientX: 20, clientY: 20 };
    fireEvent.touchStart(trigger, { touches: [touch] });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 550));
    });
    expect(screen.getByRole("menu").getAttribute("data-slot")).toBe("context-menu-content");
    fireEvent.touchEnd(trigger, { touches: [] });
  });

  it("draws the popup at the heavy outline width from the positioner, with no shadow or ring", async () => {
    render(<Page />);
    await openAt(screen.getByText("Panel 3"));
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
    expect(menu.classList.contains("p-1.5")).toBe(true);
  });

  it("draws separators as hand-drawn rules", async () => {
    render(<Page />);
    await openAt(screen.getByText("Panel 3"));
    const separator = screen.getByRole("separator");
    expect(separator.getAttribute("data-slot")).toBe("context-menu-separator");
    expect(separator.classList.contains("h-px")).toBe(false);
    expect(frameOf(separator)?.getAttribute("data-shape")).toBe("line");
  });

  it("inks the highlighted item with paper text, and turns a destructive one spot", async () => {
    render(<Page />);
    await openAt(screen.getByText("Panel 3"));
    const [bookmark, , report] = screen.getAllByRole("menuitem");
    expect(bookmark.className).toContain("focus:bg-primary");
    expect(bookmark.className).toContain("focus:text-primary-foreground");
    expect(bookmark.className).not.toContain("focus:bg-accent");
    expect(report.getAttribute("data-variant")).toBe("destructive");
    expect(report.className).toContain("data-[variant=destructive]:focus:bg-destructive");
    expect(report.className).toContain("data-[variant=destructive]:focus:text-spot-foreground");
    expect(report.className).not.toContain("bg-destructive/10");
  });

  it("moves the highlight with the arrow keys and closes on Escape, like stock", async () => {
    render(<Page />);
    await openAt(screen.getByText("Panel 3"));
    const menu = screen.getByRole("menu");
    fireEvent.keyDown(menu, { key: "ArrowDown" });
    await act(async () => {});
    const items = () => screen.getAllByRole("menuitem");
    expect(document.activeElement).toBe(items()[0]);
    expect(items()[0].hasAttribute("data-highlighted")).toBe(true);
    fireEvent.keyDown(items()[0], { key: "ArrowDown" });
    await act(async () => {});
    expect(document.activeElement).toBe(items()[1]);
    fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });
    await act(async () => {});
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("toggles a checkbox item and picks a radio item, like stock", async () => {
    render(<Page />);
    await openAt(screen.getByText("Panel 3"));
    const checkbox = screen.getByRole("menuitemcheckbox", { name: "Furigana" });
    fireEvent.click(checkbox);
    await act(async () => {});
    expect(checkbox.getAttribute("aria-checked")).toBe("false");
    const ltr = screen.getByRole("menuitemradio", { name: "Left to right" });
    fireEvent.click(ltr);
    await act(async () => {});
    expect(ltr.getAttribute("aria-checked")).toBe("true");
  });

  it("opens its submenu demo on mount, with the submenu framed like the menu", async () => {
    render(<ContextMenuSubmenuDemo />);
    await act(async () => {});
    expect(screen.getAllByRole("menu")).toHaveLength(2);
    const subTrigger = screen.getByRole("menuitem", { name: "Share" });
    expect(subTrigger.getAttribute("data-slot")).toBe("context-menu-sub-trigger");
    expect(subTrigger.getAttribute("aria-expanded")).toBe("true");
    const sub = screen.getByRole("menuitem", { name: "Copy link" }).closest('[role="menu"]');
    expect(sub?.getAttribute("data-slot")).toBe("context-menu-sub-content");
    for (const name of sub?.classList ?? []) {
      expect(name, name).not.toMatch(/^shadow-/);
    }
    expect(frameOf(sub?.parentElement)?.getAttribute("data-fill")).toBe("paper");
    // The trigger area is a panel.
    const panel = screen.getByText(/Right-click/).closest('[data-slot="panel"]');
    expect(panel?.parentElement?.getAttribute("data-slot")).toBe("context-menu-trigger");
  });

  expectDemosAccessible(import.meta.glob("./demos/*.tsx"));
});
