import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { expectDemosAccessible } from "@/lib/test/axe";
import { stubResizeObserver } from "@/lib/test/resize-observer";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "./command";
import CommandDialogDemo from "./demos/dialog";

// cmdk measures its list with a ResizeObserver and scrolls the selected row into view; jsdom has
// neither.
beforeAll(() => {
  stubResizeObserver();
  Element.prototype.scrollIntoView ??= () => {};
});

afterEach(cleanup);

function Palette({ onSelect }: { onSelect?: (value: string) => void }) {
  return (
    <Command label="Reader commands" className="custom-class">
      <CommandInput placeholder="Search" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Reading">
          <CommandItem onSelect={onSelect}>Continue chapter</CommandItem>
          <CommandItem onSelect={onSelect}>
            Bookmark page
            <CommandShortcut>B</CommandShortcut>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Library">
          <CommandItem onSelect={onSelect}>Open shelf</CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  );
}

const frameOf = (element: Element | null | undefined) =>
  element?.querySelector<HTMLElement>(':scope > [data-slot="ink-frame"]');

const rowNames = () => screen.getAllByRole("option").map((row) => row.firstChild?.textContent);

describe("Command", () => {
  it("draws the palette as heavy-outlined paper with stock slots", () => {
    render(<Palette />);
    const root = document.querySelector<HTMLElement>('[data-slot="command"]');
    expect(root?.classList.contains("custom-class")).toBe(true);
    for (const name of root?.classList ?? []) {
      expect(name, name).not.toMatch(/(^|:)shadow(-|$)|(^|:)ring-|^border$/);
    }
    const frame = frameOf(root);
    expect(frame?.getAttribute("data-fill")).toBe("paper");
    expect(frame?.className).toContain("[--outline-width:var(--outline-width-heavy)]");
    expect(screen.getByRole("listbox").getAttribute("data-slot")).toBe("command-list");
    expect(screen.getByRole("combobox").getAttribute("data-slot")).toBe("command-input");
  });

  it("rules the search row by hand and hides the group's own outline", () => {
    render(<Palette />);
    const wrapper = document.querySelector('[data-slot="command-input-wrapper"]');
    expect(frameOf(wrapper)?.getAttribute("data-shape")).toBe("line");
    const group = wrapper?.querySelector('[data-slot="input-group"]');
    expect(group?.className).toContain("[&_[data-slot=ink-frame]]:hidden");
    expect(group?.className).not.toContain("bg-input/30");
  });

  it("sets group headings in the display face and draws separators by hand", () => {
    render(<Palette />);
    const group = document.querySelector('[data-slot="command-group"]');
    expect(group?.className).toContain("**:[[cmdk-group-heading]]:font-display");
    const separator = document.querySelector('[data-slot="command-separator"]');
    expect(separator?.getAttribute("role")).toBe("separator");
    // Decorative inside the listbox (axe: a listbox owns options and groups only).
    expect(separator?.getAttribute("aria-hidden")).toBe("true");
    expect(separator?.classList.contains("h-px")).toBe(false);
    expect(frameOf(separator)?.getAttribute("data-shape")).toBe("line");
  });

  it("draws shortcuts as kbd's paper key caps", () => {
    render(<Palette />);
    const shortcut = screen.getByText("B");
    expect(shortcut.getAttribute("data-slot")).toBe("command-shortcut");
    expect(shortcut.className).toContain("font-display");
    expect(frameOf(shortcut)?.getAttribute("data-fill")).toBe("paper");
  });

  it("inks the selected row through cmdk's data-selected attribute", async () => {
    render(<Palette />);
    await act(async () => {});
    const [first, second] = screen.getAllByRole("option");
    expect(first.getAttribute("data-selected")).toBe("true");
    expect(second.getAttribute("data-selected")).toBe("false");
    for (const row of [first, second]) {
      expect(row.getAttribute("data-slot")).toBe("command-item");
      expect(row.className).toContain("data-[selected=true]:bg-primary");
      expect(row.className).toContain("data-[selected=true]:text-primary-foreground");
      expect(row.className).not.toContain("data-selected:bg-muted");
    }
    fireEvent.keyDown(screen.getByRole("combobox"), { key: "ArrowDown" });
    await act(async () => {});
    expect(second.getAttribute("data-selected")).toBe("true");
    expect(first.getAttribute("data-selected")).toBe("false");
  });

  it("filters as the reader types and selects with Enter", async () => {
    const onSelect = vi.fn();
    render(<Palette onSelect={onSelect} />);
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "shelf" } });
    await act(async () => {});
    expect(rowNames()).toEqual(["Open shelf"]);
    expect(screen.getByRole("option").getAttribute("data-selected")).toBe("true");
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSelect).toHaveBeenCalledWith("Open shelf");
    fireEvent.change(input, { target: { value: "zzz" } });
    await act(async () => {});
    expect(screen.queryAllByRole("option")).toHaveLength(0);
    const empty = screen.getByText("No results found.");
    expect(empty.getAttribute("data-slot")).toBe("command-empty");
    expect(empty.className).toContain("text-muted-foreground");
  });

  it("opens in dialog's heavy paper, which draws the one outline", async () => {
    render(<CommandDialogDemo />);
    await act(async () => {});
    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("data-slot")).toBe("dialog-content");
    expect(dialog.className).not.toContain("overflow-hidden");
    expect(frameOf(dialog)?.className).toContain("[--outline-width:var(--outline-width-heavy)]");
    const root = dialog.querySelector('[data-slot="command"]');
    expect(frameOf(root)?.className).toContain("in-data-[slot=dialog-content]:hidden");
    expect(root?.className).toContain("in-data-[slot=dialog-content]:bg-transparent");
  });

  expectDemosAccessible(import.meta.glob("./demos/*.tsx"));
});
