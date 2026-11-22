import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { expectVariantsAccessible } from "@/lib/test/axe";
import { MultiSelect, type MultiSelectOption, type MultiSelectProps } from "./multi-select";

afterEach(cleanup);

const genres: MultiSelectOption[] = [
  { value: "action", label: "Action" },
  { value: "comedy", label: "Comedy" },
  { value: "mystery", label: "Mystery" },
  { value: "romance", label: "Romance", disabled: true },
];

function Picker(props: Partial<MultiSelectProps>) {
  return <MultiSelect options={genres} aria-label="Genres" {...props} />;
}

/** Types as a person does: Base UI opens the list only for an input event with an `inputType`. */
const type = (input: HTMLElement, value: string) =>
  fireEvent.input(input, { target: { value }, inputType: "insertText" });

const input = () => screen.getByRole("combobox", { name: "Genres" });
const chips = () =>
  [...document.querySelectorAll<HTMLElement>('[data-slot="combobox-chip"]')].map(
    (chip) => chip.textContent,
  );
const key = async (target: HTMLElement, name: string) => {
  fireEvent.keyDown(target, { key: name });
  await act(async () => {});
};

/** Filters to `text`, highlights the first match and toggles it with Enter. */
async function pick(text: string) {
  act(() => input().focus());
  type(input(), text);
  await act(async () => {});
  await key(input(), "ArrowDown");
  await key(input(), "Enter");
}

/** Opens the list from the keyboard and highlights the option at `index` (0-based). */
async function highlight(index: number) {
  act(() => input().focus());
  for (let step = 0; step <= index; step++) await key(input(), "ArrowDown");
}

describe("MultiSelect", () => {
  it("renders combobox's parts under a multi-select root", () => {
    render(<Picker defaultValue={["action"]} className="custom" />);
    const root = document.querySelector<HTMLElement>('[data-slot="multi-select"]');
    expect(root?.classList.contains("custom")).toBe(true);
    expect(root?.querySelector('[data-slot="combobox-chips"]')).toBeTruthy();
    expect(root?.querySelector('[data-slot="combobox-chip"]')).toBeTruthy();
    expect(root?.querySelector('[data-slot="combobox-chip-remove"]')).toBeTruthy();
    expect(input().getAttribute("data-slot")).toBe("combobox-chip-input");
  });

  it("is uncontrolled from defaultValue and reports string values", async () => {
    const onValueChange = vi.fn();
    render(<Picker defaultValue={["mystery"]} onValueChange={onValueChange} />);
    expect(chips()).toEqual(["Mystery"]);
    await pick("act");
    expect(onValueChange).toHaveBeenLastCalledWith(["mystery", "action"]);
    expect(chips()).toEqual(["Mystery", "Action"]);
  });

  it("is controlled by value: a change is only a request", async () => {
    const onValueChange = vi.fn();
    const { rerender } = render(<Picker value={["comedy"]} onValueChange={onValueChange} />);
    await pick("act");
    expect(onValueChange).toHaveBeenLastCalledWith(["comedy", "action"]);
    expect(chips()).toEqual(["Comedy"]);
    rerender(<Picker value={["comedy", "action"]} onValueChange={onValueChange} />);
    expect(chips()).toEqual(["Comedy", "Action"]);
  });

  it("lists in a multiselectable listbox, filters as the reader types and closes with Escape", async () => {
    render(<Picker />);
    act(() => input().focus());
    type(input(), "my");
    await act(async () => {});
    expect(screen.getByRole("listbox").getAttribute("aria-multiselectable")).toBe("true");
    expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual(["Mystery"]);
    await key(input(), "Escape");
    expect(input().getAttribute("aria-expanded")).toBe("false");
  });

  it("toggles the highlighted option with Enter", async () => {
    const onValueChange = vi.fn();
    render(<Picker defaultValue={["action"]} onValueChange={onValueChange} />);
    await highlight(0);
    await key(input(), "Enter");
    expect(onValueChange).toHaveBeenLastCalledWith([]);
  });

  it("moves the highlight with Down and Up", async () => {
    render(<Picker />);
    await highlight(1);
    const lit = () =>
      screen.getAllByRole("option").find((option) => option.hasAttribute("data-highlighted"))
        ?.textContent;
    expect(lit()).toBe("Comedy");
    await key(input(), "ArrowUp");
    expect(lit()).toBe("Action");
  });

  it("removes the last chip with Backspace on the empty input", async () => {
    const onValueChange = vi.fn();
    render(<Picker defaultValue={["action", "comedy"]} onValueChange={onValueChange} />);
    act(() => input().focus());
    await key(input(), "Backspace");
    expect(onValueChange).toHaveBeenLastCalledWith(["action"]);
    expect(chips()).toEqual(["Action"]);
  });

  it("names each chip's remove button and removes that chip", async () => {
    const onValueChange = vi.fn();
    render(<Picker defaultValue={["action", "comedy"]} onValueChange={onValueChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Remove Action" }));
    await act(async () => {});
    expect(onValueChange).toHaveBeenLastCalledWith(["comedy"]);
  });

  it("renders options with a group under the group's label", async () => {
    const options: MultiSelectOption[] = [
      { value: "action", label: "Action", group: "Genre" },
      { value: "seinen", label: "Seinen", group: "Demographic" },
    ];
    render(<Picker options={options} />);
    await highlight(0);
    const groups = screen.getAllByRole("group");
    expect(groups.map((group) => group.textContent)).toEqual(["GenreAction", "DemographicSeinen"]);
    expect(screen.getByText("Genre").getAttribute("data-slot")).toBe("combobox-label");
  });

  it("disables the other options at maxSelected and says why", async () => {
    render(<Picker defaultValue={["action", "comedy"]} maxSelected={2} />);
    await highlight(0);
    const mystery = screen.getByRole("option", { name: "Mystery" });
    expect(mystery.getAttribute("aria-disabled")).toBe("true");
    const reason = document.getElementById(mystery.getAttribute("aria-describedby") ?? "");
    expect(reason?.textContent).toBe("Up to 2 can be picked.");
    // The picked ones stay enabled, so they can be unpicked.
    expect(screen.getByRole("option", { name: "Action" }).hasAttribute("aria-disabled")).toBe(
      false,
    );
  });

  it("posts one hidden input per value under name with a plain form", () => {
    render(
      <form data-testid="form">
        <Picker name="genres" defaultValue={["action", "mystery"]} />
      </form>,
    );
    const form = screen.getByTestId("form") as HTMLFormElement;
    expect(new FormData(form).getAll("genres")).toEqual(["action", "mystery"]);
  });

  it("reaches the DOM with labels overrides", async () => {
    render(
      <Picker
        defaultValue={["action", "comedy"]}
        maxSelected={2}
        labels={{ empty: "Nothing.", remove: "Drop {label}", limit: "Max {max}." }}
      />,
    );
    expect(screen.getByRole("button", { name: "Drop Action" })).toBeTruthy();
    expect(screen.getByText("Max 2.")).toBeTruthy();
    await highlight(0);
    type(input(), "zzz");
    await act(async () => {});
    expect(screen.getByText("Nothing.").getAttribute("data-slot")).toBe("combobox-empty");
  });

  it("puts id, aria-invalid and aria-describedby on the input, for field", () => {
    render(<Picker id="genres" aria-invalid aria-describedby="hint" />);
    expect(input().id).toBe("genres");
    expect(input().getAttribute("aria-invalid")).toBe("true");
    expect(input().getAttribute("aria-describedby")).toBe("hint");
  });

  it("disables the field and drops the remove buttons", () => {
    render(<Picker disabled defaultValue={["action"]} />);
    expect((input() as HTMLInputElement).disabled).toBe(true);
    expect(screen.queryByRole("button", { name: "Remove Action" })).toBeNull();
    expect(
      document.querySelector('[data-slot="multi-select"]')?.hasAttribute("data-disabled"),
    ).toBe(true);
  });

  it("keeps the popup as wide as the field", async () => {
    render(<Picker />);
    await highlight(0);
    const popup = screen.getByRole("listbox").closest('[data-slot="combobox-content"]');
    expect(popup?.classList.contains("w-(--anchor-width)")).toBe(true);
    expect(popup?.getAttribute("data-chips")).toBe("true");
  });

  expectVariantsAccessible(import.meta.glob("./variants/*.tsx"));
});
