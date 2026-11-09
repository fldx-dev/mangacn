import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { expectDemosAccessible } from "@/lib/test/axe";
import MenubarSubmenuDemo from "./demos/submenu";
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarGroup,
  MenubarItem,
  MenubarLabel,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from "./menubar";

afterEach(cleanup);

function Reader({ open }: { open?: boolean }) {
  return (
    <Menubar className="custom-bar">
      <MenubarMenu defaultOpen={open}>
        <MenubarTrigger>Series</MenubarTrigger>
        <MenubarContent className="custom-class">
          <MenubarGroup>
            <MenubarLabel>Series</MenubarLabel>
            <MenubarItem>
              Follow
              <MenubarShortcut>F</MenubarShortcut>
            </MenubarItem>
          </MenubarGroup>
          <MenubarSeparator />
          <MenubarCheckboxItem defaultChecked>Furigana</MenubarCheckboxItem>
          <MenubarRadioGroup defaultValue="rtl">
            <MenubarRadioItem value="rtl">Right to left</MenubarRadioItem>
            <MenubarRadioItem value="ltr">Left to right</MenubarRadioItem>
          </MenubarRadioGroup>
          <MenubarItem variant="destructive">Report</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>Chapter</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>Next</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>View</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>Fit width</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}

const frameOf = (element: Element | null | undefined) =>
  element?.querySelector<HTMLElement>(':scope > [data-slot="ink-frame"]');

const ruleOf = (trigger: Element) =>
  trigger.querySelector<HTMLElement>(':scope > [data-slot="ink-frame"][data-shape="line"]');

describe("Menubar", () => {
  it("renders a stock menubar of triggers with stock slots", () => {
    render(<Reader />);
    const bar = screen.getByRole("menubar");
    expect(bar.getAttribute("data-slot")).toBe("menubar");
    expect(bar.classList.contains("custom-bar")).toBe(true);
    const triggers = screen.getAllByRole("menuitem");
    expect(triggers.map((trigger) => trigger.textContent)).toEqual(["Series", "Chapter", "View"]);
    for (const trigger of triggers) {
      expect(trigger.getAttribute("data-slot")).toBe("menubar-trigger");
      expect(trigger.getAttribute("aria-haspopup")).toBe("menu");
      expect(trigger.className).toContain("font-display");
    }
  });

  it("draws one outlined strip with a hand-drawn rule between triggers", () => {
    render(<Reader />);
    const bar = screen.getByRole("menubar");
    for (const name of bar.classList) {
      expect(name, name).not.toMatch(/^border$|^ring-|^shadow-/);
    }
    // One frame on the bar; triggers draw none of their own, only the rule after them.
    expect(frameOf(bar)?.getAttribute("data-fill")).toBe("paper");
    expect(bar.querySelectorAll('[data-slot="ink-frame"]:not([data-shape="line"])')).toHaveLength(
      1,
    );
    const triggers = screen.getAllByRole("menuitem");
    for (const trigger of triggers) {
      const rule = ruleOf(trigger);
      expect(rule?.getAttribute("data-fill")).toBe("none");
      expect(rule?.className).toContain("group-last-of-type/menubar-trigger:hidden");
    }
  });

  it("opens mangacn's dropdown-menu popup, framed heavy from the positioner", async () => {
    render(<Reader open />);
    await act(async () => {});
    const menu = screen.getByRole("menu");
    expect(menu.getAttribute("data-slot")).toBe("menubar-content");
    expect(menu.classList.contains("custom-class")).toBe(true);
    for (const name of menu.classList) {
      expect(name, name).not.toMatch(/^ring-|^shadow-|^bg-popover$/);
    }
    expect(menu.classList.contains("bg-transparent")).toBe(true);
    const frame = frameOf(menu.parentElement);
    expect(frame?.getAttribute("data-fill")).toBe("paper");
    expect(frame?.className).toContain("[--outline-width:var(--outline-width-heavy)]");
    const separator = screen.getByRole("separator");
    expect(separator.getAttribute("data-slot")).toBe("menubar-separator");
    expect(frameOf(separator)?.getAttribute("data-shape")).toBe("line");
    expect(separator.classList.contains("h-px")).toBe(false);
    const follow = screen.getByRole("menuitem", { name: "FollowF" });
    expect(follow.getAttribute("data-slot")).toBe("menubar-item");
    expect(follow.className).toContain("focus:bg-primary");
    expect(follow.className).not.toContain("focus:bg-accent");
    const report = screen.getByRole("menuitem", { name: "Report" });
    expect(report.className).toContain("data-[variant=destructive]:focus:bg-destructive");
    expect(report.className).not.toContain("bg-destructive/10");
    expect(
      screen.getByRole("menuitemcheckbox", { name: "Furigana" }).getAttribute("data-slot"),
    ).toBe("menubar-checkbox-item");
    expect(
      screen.getByRole("menuitemradio", { name: "Right to left" }).getAttribute("aria-checked"),
    ).toBe("true");
    expect(screen.getByText("F").getAttribute("data-slot")).toBe("menubar-shortcut");
    const series = screen.getByRole("menuitem", { name: "Series" });
    expect(series.getAttribute("aria-expanded")).toBe("true");
    expect(series.className).toContain("aria-expanded:bg-primary");
  });

  it("moves between triggers with the arrow keys and opens a menu with ArrowDown, like stock", async () => {
    render(<Reader />);
    const [series, chapter] = screen.getAllByRole("menuitem");
    act(() => series.focus());
    fireEvent.keyDown(series, { key: "ArrowRight" });
    await act(async () => {});
    expect(document.activeElement).toBe(chapter);
    fireEvent.keyDown(chapter, { key: "ArrowDown" });
    await act(async () => {});
    expect(screen.getByRole("menu")).toBeTruthy();
    expect(chapter.getAttribute("aria-expanded")).toBe("true");
    expect(document.activeElement).toBe(screen.getByRole("menuitem", { name: "Next" }));
    fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });
    await act(async () => {});
    expect(screen.queryByRole("menu")).toBeNull();
    expect(document.activeElement).toBe(chapter);
  });

  it("opens the submenu in its submenu demo", async () => {
    render(<MenubarSubmenuDemo />);
    await act(async () => {});
    expect(screen.getAllByRole("menu")).toHaveLength(2);
    const subTrigger = screen.getByRole("menuitem", { name: "Add to list" });
    expect(subTrigger.getAttribute("data-slot")).toBe("menubar-sub-trigger");
    expect(subTrigger.getAttribute("aria-expanded")).toBe("true");
    const sub = screen.getByRole("menuitem", { name: "Plan to read" }).closest('[role="menu"]');
    expect(sub?.getAttribute("data-slot")).toBe("menubar-sub-content");
    expect(frameOf(sub?.parentElement)?.getAttribute("data-fill")).toBe("paper");
  });

  expectDemosAccessible(import.meta.glob("./demos/*.tsx"));
});
