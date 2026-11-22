import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { expectVariantsAccessible } from "@/lib/test/axe";
import { NumberInput } from "./number-input";

afterEach(cleanup);

const input = () => screen.getByRole("textbox") as HTMLInputElement;
const key = (k: string, init: KeyboardEventInit = {}) =>
  act(() => {
    fireEvent.keyDown(input(), { key: k, ...init });
  });

describe("NumberInput", () => {
  expectVariantsAccessible(import.meta.glob("./variants/*.tsx"));

  it("renders the three parts in one frame, with every slot", () => {
    render(<NumberInput aria-label="Copies" defaultValue={3} className="custom" />);
    const root = document.querySelector<HTMLElement>('[data-slot="number-input"]');
    expect(root?.classList.contains("custom")).toBe(true);
    for (const slot of ["decrement", "input", "increment"]) {
      expect(root?.querySelector(`[data-slot="number-input-${slot}"]`)).not.toBeNull();
    }
    // One paper outline for the group; the steppers draw only their rules.
    const group = input().parentElement;
    const frames = group?.querySelectorAll(':scope > [data-slot="ink-frame"]');
    expect(frames).toHaveLength(1);
    expect(input().value).toBe("3");
  });

  it("names the steppers, keeps them out of the tab order and disables them at the bounds", () => {
    render(<NumberInput aria-label="Copies" defaultValue={1} min={1} max={2} />);
    const decrease = screen.getByRole("button", { name: "Decrease" });
    const increase = screen.getByRole("button", { name: "Increase" });
    expect(decrease.tabIndex).toBe(-1);
    expect(increase.tabIndex).toBe(-1);
    expect((decrease as HTMLButtonElement).disabled).toBe(true);
    expect((increase as HTMLButtonElement).disabled).toBe(false);
  });

  it("is uncontrolled with defaultValue and reports each change", async () => {
    const onValueChange = vi.fn();
    render(<NumberInput aria-label="Copies" defaultValue={5} onValueChange={onValueChange} />);
    await key("ArrowUp");
    expect(onValueChange).toHaveBeenLastCalledWith(6);
    expect(input().value).toBe("6");
  });

  it("is controlled with value", async () => {
    const onValueChange = vi.fn();
    const { rerender } = render(
      <NumberInput aria-label="Copies" value={5} onValueChange={onValueChange} />,
    );
    await key("ArrowUp");
    expect(onValueChange).toHaveBeenLastCalledWith(6);
    expect(input().value).toBe("5");
    rerender(<NumberInput aria-label="Copies" value={9} onValueChange={onValueChange} />);
    expect(input().value).toBe("9");
  });

  it("steps by step on Up / Down, largeStep on Shift and PageUp / PageDown, to the bounds on Home / End", async () => {
    render(
      <NumberInput
        aria-label="Copies"
        defaultValue={50}
        min={0}
        max={100}
        step={2}
        largeStep={20}
      />,
    );
    await key("ArrowUp");
    expect(input().value).toBe("52");
    await key("ArrowDown");
    expect(input().value).toBe("50");
    await key("ArrowUp", { shiftKey: true });
    expect(input().value).toBe("70");
    await key("PageUp");
    expect(input().value).toBe("90");
    await key("PageUp");
    expect(input().value).toBe("100");
    await key("PageDown");
    expect(input().value).toBe("80");
    await key("Home");
    expect(input().value).toBe("0");
    await key("End");
    expect(input().value).toBe("100");
  });

  it("formats through Intl with a locale", () => {
    render(
      <NumberInput
        aria-label="Price"
        defaultValue={680}
        locale="en-US"
        format={{ style: "currency", currency: "JPY" }}
      />,
    );
    expect(input().value).toBe("¥680");
  });

  it("posts its number under name with a plain form", () => {
    render(
      <form data-testid="form">
        <NumberInput aria-label="Copies" name="copies" defaultValue={4} />
      </form>,
    );
    const data = new FormData(screen.getByTestId("form") as HTMLFormElement);
    expect(data.get("copies")).toBe("4");
  });

  it("takes the stepper names from labels", () => {
    render(
      <NumberInput aria-label="Copies" labels={{ decrement: "減らす", increment: "増やす" }} />,
    );
    expect(screen.getByRole("button", { name: "減らす" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "増やす" })).toBeTruthy();
  });

  it("puts id, aria-invalid and aria-describedby on the input for field", () => {
    render(
      <>
        <label htmlFor="copies">Copies</label>
        <NumberInput id="copies" aria-invalid="true" aria-describedby="copies-error" />
      </>,
    );
    const field = screen.getByRole("textbox", { name: "Copies" });
    expect(field.id).toBe("copies");
    expect(field.getAttribute("aria-invalid")).toBe("true");
    expect(field.getAttribute("aria-describedby")).toBe("copies-error");
  });

  it("ignores keys when disabled or read-only", async () => {
    const onValueChange = vi.fn();
    const { rerender } = render(
      <NumberInput aria-label="Copies" defaultValue={1} readOnly onValueChange={onValueChange} />,
    );
    await key("PageUp");
    rerender(
      <NumberInput aria-label="Copies" defaultValue={1} disabled onValueChange={onValueChange} />,
    );
    await key("PageUp");
    expect(onValueChange).not.toHaveBeenCalled();
  });
});
