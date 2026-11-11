import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { expectDemosAccessible } from "@/lib/test/axe";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "./combobox";
import ComboboxMultipleDemo from "./demos/multiple";
import ComboboxWithGroupsDemo from "./demos/with-groups";

afterEach(cleanup);

const series = ["Rooftop Ronin", "Paper Moon Café", "Salt Tide"];

function Picker({ open }: { open?: boolean }) {
  return (
    <Combobox items={series} defaultOpen={open}>
      <ComboboxInput placeholder="Pick a series" aria-label="Series" className="custom-input" />
      <ComboboxContent className="custom-class">
        <ComboboxEmpty>No series found.</ComboboxEmpty>
        <ComboboxList>
          {(item: string) => (
            <ComboboxItem key={item} value={item}>
              {item}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

/** Types as a person does: Base UI opens the list only for an input event with an `inputType`. */
const type = (input: HTMLElement, value: string) =>
  fireEvent.input(input, { target: { value }, inputType: "insertText" });

const frameOf = (element: Element | null | undefined) =>
  element?.querySelector<HTMLElement>(':scope > [data-slot="ink-frame"]');

describe("Combobox", () => {
  it("is mangacn's input group: one outline around the input and its trigger", () => {
    render(<Picker />);
    const input = screen.getByRole("combobox", { name: "Series" });
    const group = input.closest<HTMLElement>('[data-slot="input-group"]');
    expect(group?.classList.contains("custom-input")).toBe(true);
    expect(group?.hasAttribute("data-grouped")).toBe(true);
    expect(frameOf(group)?.getAttribute("data-fill")).toBe("paper");
    // Stock's trigger is an input-group button inside the group, drawing no frame of its own.
    expect(group?.querySelector('[data-slot="input-group-button"]')?.tagName).toBe("BUTTON");
  });

  it("opens dropdown-menu's heavy paper list from the positioner, with no shadow or ring", async () => {
    render(<Picker open />);
    await act(async () => {});
    const listbox = screen.getByRole("listbox");
    const popup = listbox.closest<HTMLElement>('[data-slot="combobox-content"]');
    expect(popup?.classList.contains("custom-class")).toBe(true);
    for (const name of popup?.classList ?? []) {
      expect(name, name).not.toMatch(/(^|:)shadow(-|$)|(^|:)ring-|^bg-popover$/);
    }
    expect(popup?.classList.contains("bg-transparent")).toBe(true);
    // The popup clips its list, so the frame hangs on the positioner, behind it.
    expect(frameOf(popup)).toBeNull();
    const frame = frameOf(popup?.parentElement);
    expect(frame?.getAttribute("data-fill")).toBe("paper");
    expect(frame?.className).toContain("[--outline-width:var(--outline-width-heavy)]");
    expect(listbox.getAttribute("data-slot")).toBe("combobox-list");
    const options = screen.getAllByRole("option");
    expect(options.map((option) => option.textContent)).toEqual(series);
    for (const option of options) {
      expect(option.getAttribute("data-slot")).toBe("combobox-item");
      expect(option.className).toContain("data-highlighted:bg-primary");
      expect(option.className).toContain("data-highlighted:text-primary-foreground");
      expect(option.className).not.toContain("data-highlighted:bg-accent");
    }
  });

  it("filters as the reader types, moves with the arrow keys, picks with Enter, like stock", async () => {
    render(<Picker />);
    const input = screen.getByRole("combobox", { name: "Series" });
    act(() => input.focus());
    type(input, "sa");
    await act(async () => {});
    expect(input.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual([
      "Salt Tide",
    ]);
    type(input, "");
    await act(async () => {});
    expect(screen.getAllByRole("option")).toHaveLength(3);
    fireEvent.keyDown(input, { key: "ArrowDown" });
    await act(async () => {});
    fireEvent.keyDown(input, { key: "ArrowDown" });
    await act(async () => {});
    const highlighted = screen
      .getAllByRole("option")
      .filter((option) => option.hasAttribute("data-highlighted"));
    expect(highlighted.map((option) => option.textContent)).toEqual(["Paper Moon Café"]);
    fireEvent.keyDown(input, { key: "Enter" });
    await act(async () => {});
    expect((input as HTMLInputElement).value).toBe("Paper Moon Café");
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("closes with Escape, like stock", async () => {
    render(<Picker open />);
    await act(async () => {});
    const input = screen.getByRole("combobox", { name: "Series" });
    act(() => input.focus());
    fireEvent.keyDown(input, { key: "Escape" });
    await act(async () => {});
    expect(input.getAttribute("aria-expanded")).toBe("false");
  });

  it("shows the empty state in muted text when nothing matches", async () => {
    render(<Picker open />);
    await act(async () => {});
    const input = screen.getByRole("combobox", { name: "Series" });
    act(() => input.focus());
    type(input, "zzz");
    await act(async () => {});
    const empty = screen.getByText("No series found.");
    expect(empty.getAttribute("data-slot")).toBe("combobox-empty");
    expect(empty.className).toContain("text-muted-foreground");
  });

  it("draws the chips field as one outline and each chip as an outlined paper chip", async () => {
    render(<ComboboxMultipleDemo />);
    await act(async () => {});
    const chips = document.querySelector<HTMLElement>('[data-slot="combobox-chips"]');
    for (const name of chips?.classList ?? []) {
      expect(name, name).not.toMatch(/^border$|^border-input$/);
    }
    expect(frameOf(chips)?.getAttribute("data-fill")).toBe("paper");
    const chipList = [...document.querySelectorAll<HTMLElement>('[data-slot="combobox-chip"]')];
    expect(chipList.map((chip) => chip.textContent)).toEqual(["Action", "Mystery"]);
    for (const chip of chipList) {
      expect(chip.classList.contains("bg-muted")).toBe(false);
      expect(frameOf(chip)?.getAttribute("data-fill")).toBe("paper");
      expect(chip.querySelector('[data-slot="combobox-chip-remove"]')).toBeTruthy();
    }
    // The picked rows carry the ink check.
    const picked = screen
      .getAllByRole("option")
      .filter((option) => option.getAttribute("aria-selected") === "true");
    expect(picked.map((option) => option.textContent)).toEqual(["Action", "Mystery"]);
    expect(picked[0].querySelector("svg")?.getAttribute("stroke-width")).toBe("3");
  });

  it("labels its groups and parts them with hand-drawn rules", async () => {
    render(<ComboboxWithGroupsDemo />);
    await act(async () => {});
    expect(screen.getAllByRole("group").length).toBeGreaterThanOrEqual(3);
    const label = screen.getByText("Weekly");
    expect(label.getAttribute("data-slot")).toBe("combobox-label");
    const separators = document.querySelectorAll('[data-slot="combobox-separator"]');
    expect(separators).toHaveLength(2);
    for (const separator of separators) {
      expect(separator.classList.contains("h-px")).toBe(false);
      expect(frameOf(separator)?.getAttribute("data-shape")).toBe("line");
    }
  });

  expectDemosAccessible(import.meta.glob("./demos/*.tsx"));
});
