import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { expectDemosAccessible, expectNoA11yViolations } from "@/lib/test/axe";
import { stubResizeObserver } from "@/lib/test/resize-observer";
import PhoneInputDefaultDemo from "./demos/default";
import { isValidPhoneNumber, PhoneInput, type PhoneInputProps } from "./phone-input";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const phone = () => screen.getByRole("textbox", { name: "Phone" }) as HTMLInputElement;
const trigger = () => document.querySelector<HTMLElement>('[data-slot="phone-input-country"]');

/** Types the whole text into the field, as a change event with the caret at the end. */
const typeInto = (text: string) =>
  act(() => {
    fireEvent.change(phone(), { target: { value: text, selectionStart: text.length } });
  });

/** Types one character at a time, reading the field's formatted text back between keys. */
const typeKeys = async (text: string) => {
  for (const character of text) await typeInto(phone().value + character);
};

function Phone(props: Partial<PhoneInputProps>) {
  return <PhoneInput aria-label="Phone" {...props} />;
}

/** A parent that owns the E.164 value and can set it from outside. */
function Controlled() {
  const [value, setValue] = React.useState("");
  return (
    <>
      <Phone defaultCountry="JP" value={value} onValueChange={(next) => setValue(next)} />
      <output data-testid="out">{value}</output>
      <button type="button" onClick={() => setValue("+14155552671")}>
        Set
      </button>
    </>
  );
}

const openPicker = async () => {
  await act(async () => {
    fireEvent.click(trigger() as HTMLElement);
  });
  await act(async () => {});
};

/** Types as a person does: Base UI filters only on an input event with an `inputType`. */
const search = (value: string) =>
  act(() => {
    fireEvent.input(screen.getByRole("combobox", { name: "Search countries" }), {
      target: { value },
      inputType: "insertText",
    });
  });

describe("PhoneInput", () => {
  expectDemosAccessible(import.meta.glob("./demos/*.tsx"));

  it("is a tel input in one input group, with the country picker in its leading addon", () => {
    render(<Phone defaultCountry="JP" className="custom" />);
    const input = phone();
    expect(input.type).toBe("tel");
    expect(input.getAttribute("autocomplete")).toBe("tel");
    expect(input.getAttribute("inputmode")).toBe("tel");
    const root = document.querySelector<HTMLElement>('[data-slot="phone-input"]');
    expect(root?.classList.contains("custom")).toBe(true);
    const group = input.closest('[data-slot="input-group"]');
    expect(group?.querySelector('[data-slot="input-group-addon"]')?.contains(trigger())).toBe(true);
    // The ISO code and dialling code as text: no flag image or emoji.
    expect(trigger()?.textContent).toBe("JP +81");
    expect(trigger()?.getAttribute("aria-label")).toBe("Country: Japan, JP +81");
    expect(root?.querySelector("img")).toBeNull();
  });

  it("is described by the picked country, after the caller's own description", () => {
    render(
      <>
        <p id="hint">Hint</p>
        <Phone defaultCountry="JP" aria-describedby="hint" />
      </>,
    );
    const ids = phone().getAttribute("aria-describedby")?.split(" ") ?? [];
    expect(ids[0]).toBe("hint");
    expect(document.getElementById(ids[1])?.textContent).toBe("Japan, +81");
  });

  it("formats as you type, the national way for the picked country", async () => {
    const onValueChange = vi.fn();
    render(<Phone defaultCountry="JP" onValueChange={onValueChange} />);
    await typeKeys("0312");
    expect(phone().value).toBe("03-12");
    await typeKeys("345678");
    expect(phone().value).toBe("03-1234-5678");
    expect(onValueChange).toHaveBeenLastCalledWith("+81312345678", { country: "JP", valid: true });
  });

  it("formats a US number with its brackets, and Backspace steps over them", async () => {
    render(<Phone defaultCountry="US" />);
    await typeKeys("4155552671");
    expect(phone().value).toBe("(415) 555-2671");
    // Backspace right after ") " removes the 5 before them, not the space.
    await typeInto("4155");
    expect(phone().value).toBe("(415) 5");
    const input = phone();
    for (let i = 0; i < 4; i++) {
      input.setSelectionRange(input.value.length, input.value.length);
      const before = input.value;
      const event = fireEvent.keyDown(input, { key: "Backspace" });
      // Where the character before the caret is a digit the browser deletes it itself.
      if (event) await typeInto(before.slice(0, -1));
    }
    expect(phone().value).toBe("");
  });

  it("picks the country from a pasted international number and shows it the national way", async () => {
    const onValueChange = vi.fn();
    render(<Phone defaultCountry="US" onValueChange={onValueChange} />);
    await typeInto("+81 3-1234-5678");
    expect(trigger()?.textContent).toContain("JP");
    expect(phone().value).toBe("03-1234-5678");
    expect(onValueChange).toHaveBeenLastCalledWith("+81312345678", { country: "JP", valid: true });
  });

  it("keeps the country while an international number cannot name one yet", async () => {
    render(<Phone defaultCountry="JP" />);
    await typeInto("+1415");
    expect(trigger()?.textContent).toContain("JP");
    expect(phone().value).toBe("+1 415");
    await typeInto("+14155552671");
    expect(trigger()?.textContent).toContain("US");
    expect(phone().value).toBe("(415) 555-2671");
  });

  it("keeps an international number from a country outside the list, as invalid", async () => {
    const onValueChange = vi.fn();
    render(<Phone countries={["JP", "KR"]} onValueChange={onValueChange} />);
    await typeInto("+14155552671");
    expect(trigger()?.textContent).toContain("JP");
    expect(phone().value).toBe("+1 415 555 2671");
    expect(onValueChange).toHaveBeenLastCalledWith("+14155552671", {
      country: "JP",
      valid: false,
    });
  });

  it("lists every country by name with its ISO and dialling codes, and searches all three", async () => {
    render(<Phone defaultCountry="JP" />);
    await openPicker();
    expect(screen.getAllByRole("option")[0].textContent).toBe("AF Afghanistan +93");
    await search("japan");
    expect(screen.getAllByRole("option").map((item) => item.textContent)).toEqual(["JP Japan +81"]);
    await search("kr");
    expect(screen.getAllByRole("option").map((item) => item.textContent)).toEqual([
      "KR South Korea +82",
      "UA Ukraine +380",
    ]);
    await search("+886");
    expect(screen.getAllByRole("option").map((item) => item.textContent)).toEqual([
      "TW Taiwan +886",
    ]);
    await search("zz-none");
    expect(screen.queryAllByRole("option")).toHaveLength(0);
    expect(screen.getByText("No country found.")).toBeTruthy();
  });

  it("keeps the national digits when the country changes", async () => {
    const onValueChange = vi.fn();
    render(<Phone defaultCountry="JP" onValueChange={onValueChange} />);
    await typeInto("0212345678");
    await openPicker();
    await search("south korea");
    await act(async () => {
      fireEvent.click(screen.getByRole("option", { name: "KR South Korea +82" }));
    });
    expect(trigger()?.textContent).toContain("KR");
    expect(phone().value).toBe("02-1234-5678");
    expect(onValueChange).toHaveBeenLastCalledWith("+82212345678", { country: "KR", valid: true });
  });

  it("limits the list to countries, in their order", async () => {
    render(<Phone countries={["TW", "JP", "FR"]} />);
    expect(trigger()?.textContent).toContain("TW");
    await openPicker();
    expect(screen.getAllByRole("option").map((item) => item.textContent)).toEqual([
      "TW Taiwan +886",
      "JP Japan +81",
      "FR France +33",
    ]);
  });

  it("marks an invalid number only after blur, and not again until the next blur", async () => {
    render(<Phone defaultCountry="JP" />);
    await typeKeys("0312");
    expect(phone().hasAttribute("aria-invalid")).toBe(false);
    act(() => {
      fireEvent.blur(phone());
    });
    expect(phone().getAttribute("aria-invalid")).toBe("true");
    await typeKeys("3");
    expect(phone().hasAttribute("aria-invalid")).toBe(false);
    await typeKeys("45678");
    act(() => {
      fireEvent.blur(phone());
    });
    expect(phone().hasAttribute("aria-invalid")).toBe(false);
  });

  it("marks an invalid number on submit", async () => {
    render(
      <form data-testid="form" onSubmit={(event) => event.preventDefault()}>
        <Phone defaultCountry="JP" />
      </form>,
    );
    await typeKeys("0312");
    expect(phone().hasAttribute("aria-invalid")).toBe(false);
    act(() => {
      fireEvent.submit(screen.getByTestId("form"));
    });
    expect(phone().getAttribute("aria-invalid")).toBe("true");
  });

  it("posts E.164 from one hidden input under name, and nothing else", async () => {
    render(
      <form data-testid="form">
        <Phone name="phone" defaultCountry="JP" />
      </form>,
    );
    await typeInto("03-1234-5678");
    const data = new FormData(screen.getByTestId("form") as HTMLFormElement);
    expect([...data.entries()]).toEqual([["phone", "+81312345678"]]);
  });

  it("starts from an E.164 defaultValue, shown the national way", () => {
    render(<Phone name="phone" defaultValue="+33142685300" />);
    expect(trigger()?.textContent).toContain("FR");
    expect(phone().value).toBe("01 42 68 53 00");
  });

  it("is controlled with value, keeping what is typed", async () => {
    render(<Controlled />);
    await typeKeys("0312345678");
    expect(phone().value).toBe("03-1234-5678");
    expect(screen.getByTestId("out").textContent).toBe("+81312345678");
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Set" }));
    });
    expect(trigger()?.textContent).toContain("US");
    expect(phone().value).toBe("(415) 555-2671");
  });

  it("re-exports isValidPhoneNumber", () => {
    expect(isValidPhoneNumber("+81312345678")).toBe(true);
    expect(isValidPhoneNumber("+813123")).toBe(false);
  });

  it("disables the picker, the field and the posted value", () => {
    render(
      <form data-testid="form">
        <Phone name="phone" defaultValue="+81312345678" disabled />
      </form>,
    );
    expect(phone().disabled).toBe(true);
    expect((trigger() as HTMLButtonElement).disabled).toBe(true);
    expect([...new FormData(screen.getByTestId("form") as HTMLFormElement).entries()]).toEqual([]);
  });

  it("reads no clock in render: the same markup on two different days", () => {
    stubResizeObserver();
    const markup = (html: string) => html.replace(/_r_[0-9a-z]+_/g, "_r_");
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 0, 1, 9, 0));
    const first = markup(render(<PhoneInputDefaultDemo />).container.innerHTML);
    cleanup();
    vi.setSystemTime(new Date(2031, 6, 15, 23, 30));
    const second = markup(render(<PhoneInputDefaultDemo />).container.innerHTML);
    expect(second).toBe(first);
  });

  it("has no axe violations with the picker open", async () => {
    stubResizeObserver();
    await expectNoA11yViolations(<Phone defaultCountry="JP" />, openPicker);
  });
});
