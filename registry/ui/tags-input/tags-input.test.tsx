import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { expectVariantsAccessible } from "@/lib/test/axe";
import { TagsInput } from "./tags-input";

afterEach(cleanup);

const input = () => screen.getByRole("textbox") as HTMLInputElement;
const chips = () =>
  [...document.querySelectorAll('[data-slot="tags-input-tag"]')].map((chip) => chip.textContent);
const status = () => screen.getByRole("status").textContent;

function type(text: string) {
  act(() => {
    fireEvent.change(input(), { target: { value: text } });
  });
}
function press(key: string, target: HTMLElement = input()) {
  act(() => {
    fireEvent.keyDown(target, { key });
  });
}
function paste(text: string) {
  act(() => {
    fireEvent.paste(input(), { clipboardData: { getData: () => text } });
  });
}

describe("TagsInput", () => {
  expectVariantsAccessible(import.meta.glob("./variants/*.tsx"));

  it("renders chips as a list of badges before a plain text input, with slots", () => {
    render(<TagsInput aria-label="Genres" defaultValue={["Action", "Drama"]} className="custom" />);
    const root = document.querySelector<HTMLElement>('[data-slot="tags-input"]');
    expect(root?.classList.contains("custom")).toBe(true);
    const list = screen.getByRole("list");
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(list.compareDocumentPosition(input()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(list.querySelector('[data-slot="badge"]')).not.toBeNull();
    expect(input().dataset.slot).toBe("tags-input-input");
    expect(document.querySelectorAll('[data-slot="tags-input-tag-remove"]')).toHaveLength(2);
    expect(chips()).toEqual(["Action", "Drama"]);
    // A general component inherits the user's font: no display face, no capitals on the chips.
    const badge = list.querySelector<HTMLElement>('[data-slot="badge"]');
    expect(badge?.className).not.toMatch(/(^|\s)(font-display|uppercase)(\s|$)/);
  });

  it("adds on Enter and comma, announcing each", () => {
    const onValueChange = vi.fn();
    render(<TagsInput aria-label="Genres" onValueChange={onValueChange} />);
    type("Action");
    press("Enter");
    expect(chips()).toEqual(["Action"]);
    expect(input().value).toBe("");
    expect(status()).toBe("Action added");
    type("Drama");
    press(",");
    expect(onValueChange).toHaveBeenLastCalledWith(["Action", "Drama"]);
    expect(status()).toBe("Drama added");
  });

  it("announces the same refusal twice in a row: clears the live region, then sets it", () => {
    vi.useFakeTimers();
    try {
      render(<TagsInput aria-label="Genres" defaultValue={["Action"]} />);
      type("Action");
      press("Enter");
      expect(status()).toBe("Action is already added");
      type("Action");
      press("Enter");
      expect(status()).toBe("");
      act(() => {
        vi.advanceTimersByTime(100);
      });
      expect(status()).toBe("Action is already added");
    } finally {
      vi.useRealTimers();
    }
  });

  it("removes the last chip on Backspace in an empty input, announcing it", () => {
    render(<TagsInput aria-label="Genres" defaultValue={["Action", "Drama"]} />);
    press("Backspace");
    expect(chips()).toEqual(["Action"]);
    expect(status()).toBe("Drama removed");
    type("x");
    press("Backspace");
    expect(chips()).toEqual(["Action"]);
  });

  it("moves Left from the start of the input to the last remove button, and Right back", () => {
    render(<TagsInput aria-label="Genres" defaultValue={["Action", "Drama"]} />);
    input().focus();
    press("ArrowLeft");
    const drama = screen.getByRole("button", { name: "Remove Drama" });
    expect(document.activeElement).toBe(drama);
    press("ArrowLeft", drama);
    const action = screen.getByRole("button", { name: "Remove Action" });
    expect(document.activeElement).toBe(action);
    press("ArrowRight", action);
    expect(document.activeElement).toBe(drama);
    press("ArrowRight", drama);
    expect(document.activeElement).toBe(input());
  });

  it("removes a chip with its button and returns focus to the input", () => {
    render(<TagsInput aria-label="Genres" defaultValue={["Action", "Drama"]} />);
    fireEvent.click(screen.getByRole("button", { name: "Remove Action" }));
    expect(chips()).toEqual(["Drama"]);
    expect(document.activeElement).toBe(input());
    expect(status()).toBe("Action removed");
  });

  it("splits a paste by the delimiters", () => {
    render(<TagsInput aria-label="Genres" />);
    paste("a, b, c");
    expect(chips()).toEqual(["a", "b", "c"]);
    expect(status()).toBe("a added. b added. c added");
  });

  it("leaves a paste alone without addOnPaste", () => {
    render(<TagsInput aria-label="Genres" addOnPaste={false} />);
    paste("a, b");
    expect(chips()).toEqual([]);
  });

  it("refuses a duplicate, a tag past max and an invalid one, showing and announcing why", () => {
    render(
      <TagsInput
        aria-label="Emails"
        defaultValue={["a@b.jp"]}
        max={2}
        validate={(tag) => tag.includes("@") || `${tag} is not an email address`}
      />,
    );
    type("a@b.jp");
    press("Enter");
    expect(status()).toBe("a@b.jp is already added");
    expect(input().value).toBe("a@b.jp");
    type("nope");
    press("Enter");
    expect(status()).toBe("nope is not an email address");
    expect(screen.getByText("nope is not an email address", { selector: "p" }).dataset.slot).toBe(
      "tags-input-error",
    );
    expect(input().getAttribute("aria-invalid")).toBe("true");
    type("c@d.jp");
    press("Enter");
    type("e@f.jp");
    press("Enter");
    expect(chips()).toEqual(["a@b.jp", "c@d.jp"]);
    expect(status()).toBe("Up to 2 tags");
  });

  it("refuses a false from validate with the built-in message", () => {
    render(<TagsInput aria-label="Genres" validate={() => false} />);
    type("x");
    press("Enter");
    expect(status()).toBe("x is not valid");
  });

  it("takes duplicates with allowDuplicates and adds on blur with addOnBlur", () => {
    render(<TagsInput aria-label="Genres" defaultValue={["a"]} allowDuplicates addOnBlur />);
    type("a");
    act(() => {
      fireEvent.blur(input());
    });
    expect(chips()).toEqual(["a", "a"]);
  });

  it("is controlled with value", () => {
    const onValueChange = vi.fn();
    render(<TagsInput aria-label="Genres" value={["a"]} onValueChange={onValueChange} />);
    type("b");
    press("Enter");
    expect(onValueChange).toHaveBeenCalledWith(["a", "b"]);
    expect(chips()).toEqual(["a"]);
  });

  it("posts one hidden input per tag under name", () => {
    render(
      <form data-testid="form">
        <TagsInput aria-label="Genres" name="genres" defaultValue={["Action", "Drama"]} />
      </form>,
    );
    const data = new FormData(screen.getByTestId("form") as HTMLFormElement);
    expect(data.getAll("genres")).toEqual(["Action", "Drama"]);
  });

  it("posts nothing when disabled, as a native disabled control", () => {
    render(
      <form data-testid="form">
        <TagsInput aria-label="Genres" name="genres" defaultValue={["Action"]} disabled />
      </form>,
    );
    const data = new FormData(screen.getByTestId("form") as HTMLFormElement);
    expect(data.getAll("genres")).toEqual([]);
  });

  it("adds the typed draft along with a pasted list", () => {
    render(<TagsInput aria-label="Genres" />);
    type("a");
    paste("b, c");
    expect(chips()).toEqual(["a", "b", "c"]);
    expect(input().value).toBe("");
  });

  it("takes its words from labels", () => {
    render(
      <TagsInput
        aria-label="Genres"
        defaultValue={["Action"]}
        labels={{ remove: (tag) => `${tag}を削除`, added: (tag) => `${tag}を追加` }}
      />,
    );
    expect(screen.getByRole("button", { name: "Actionを削除" })).toBeTruthy();
    type("Drama");
    press("Enter");
    expect(status()).toBe("Dramaを追加");
  });

  it("puts id, aria-invalid and aria-describedby on the input for field", () => {
    render(
      <>
        <label htmlFor="genres">Genres</label>
        <TagsInput id="genres" aria-invalid="true" aria-describedby="genres-error" />
      </>,
    );
    const field = screen.getByRole("textbox", { name: "Genres" });
    expect(field.getAttribute("aria-invalid")).toBe("true");
    expect(field.getAttribute("aria-describedby")).toBe("genres-error");
  });

  it("turns everything off when disabled", () => {
    render(<TagsInput aria-label="Genres" defaultValue={["a"]} disabled />);
    expect(input().disabled).toBe(true);
    expect((screen.getByRole("button", { name: "Remove a" }) as HTMLButtonElement).disabled).toBe(
      true,
    );
  });
});
