import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { expectDemosAccessible } from "@/lib/test/axe";
import { ColorPicker, ColorPickerPanel } from "./color-picker";

afterEach(cleanup);

const area = () => screen.getByRole("slider", { name: "Saturation and brightness" });
const hexInput = () => screen.getByRole("textbox", { name: "Hex" }) as HTMLInputElement;
const slot = (name: string) => document.querySelector<HTMLElement>(`[data-slot="${name}"]`);
/**
 * A hue or alpha slider's range input and the text of its label. jsdom has no layout, so Base UI
 * keeps the thumbs `visibility: hidden` and role queries skip them.
 */
const rangeOf = (name: string) => {
  const input = slot(name)?.querySelector<HTMLInputElement>('input[type="range"]');
  const label = document.getElementById(input?.getAttribute("aria-labelledby") ?? "");
  return { input, label: label?.textContent };
};

describe("ColorPickerPanel", () => {
  it("sets data-slot on every part", () => {
    render(<ColorPickerPanel defaultValue="#e60012" swatches={["#e60012", "#0068b7"]} />);
    for (const name of [
      "color-picker-panel",
      "color-picker-area",
      "color-picker-area-thumb",
      "color-picker-hue",
      "color-picker-alpha",
      "color-picker-input",
      "color-picker-swatches",
      "color-picker-swatch",
    ]) {
      expect(slot(name), name).toBeTruthy();
    }
  });

  it("is a 2D slider with saturation and brightness as its value text", () => {
    render(<ColorPickerPanel defaultValue="#e60012" />);
    expect(area().getAttribute("aria-roledescription")).toBe("2D slider");
    expect(area().getAttribute("aria-valuetext")).toBe("saturation 100 %, brightness 90 %");
    expect(area().tabIndex).toBe(0);
  });

  it("round-trips hex through its HSV state unchanged (the hex field commits hex → HSV → hex)", () => {
    const samples = [
      "#e60012",
      "#0068b7",
      "#7f7f7f",
      "#123456",
      "#fedcba",
      "#ffffff",
      "#010203",
      "#ffe10080",
      "#0000ff01",
    ];
    for (const hex of samples) {
      const onValueChange = vi.fn();
      const { unmount } = render(
        <ColorPickerPanel defaultValue="#000000" onValueChange={onValueChange} />,
      );
      fireEvent.change(hexInput(), { target: { value: hex.toUpperCase() } });
      fireEvent.keyDown(hexInput(), { key: "Enter" });
      expect(onValueChange, hex).toHaveBeenLastCalledWith(hex);
      unmount();
    }
  });

  it("moves saturation with Left and Right, brightness with Up and Down, by 10 with Shift", () => {
    const onValueChange = vi.fn();
    render(<ColorPickerPanel defaultValue="#808080" onValueChange={onValueChange} />);
    const text = () => area().getAttribute("aria-valuetext");
    expect(text()).toBe("saturation 0 %, brightness 50 %");
    fireEvent.keyDown(area(), { key: "ArrowRight" });
    expect(text()).toBe("saturation 1 %, brightness 50 %");
    fireEvent.keyDown(area(), { key: "ArrowRight", shiftKey: true });
    expect(text()).toBe("saturation 11 %, brightness 50 %");
    fireEvent.keyDown(area(), { key: "ArrowLeft" });
    expect(text()).toBe("saturation 10 %, brightness 50 %");
    fireEvent.keyDown(area(), { key: "ArrowUp" });
    expect(text()).toBe("saturation 10 %, brightness 51 %");
    fireEvent.keyDown(area(), { key: "ArrowDown", shiftKey: true });
    expect(text()).toBe("saturation 10 %, brightness 41 %");
    expect(onValueChange).toHaveBeenCalledTimes(5);
    expect(onValueChange.mock.lastCall?.[0]).toMatch(/^#[0-9a-f]{6}$/);
  });

  it("picks by pointer on the area and marks the drag", () => {
    const onValueChange = vi.fn();
    render(<ColorPickerPanel defaultValue="#ff0000" onValueChange={onValueChange} />);
    vi.spyOn(area(), "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      width: 100,
      height: 100,
      right: 100,
      bottom: 100,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    fireEvent.pointerDown(area(), { button: 0, clientX: 50, clientY: 0, pointerId: 1 });
    expect(area().hasAttribute("data-dragging")).toBe(true);
    expect(area().getAttribute("aria-valuetext")).toBe("saturation 50 %, brightness 100 %");
    fireEvent.pointerMove(area(), { clientX: 100, clientY: 100, pointerId: 1 });
    expect(area().getAttribute("aria-valuetext")).toBe("saturation 100 %, brightness 0 %");
    fireEvent.pointerUp(area(), { pointerId: 1 });
    expect(area().hasAttribute("data-dragging")).toBe(false);
    expect(onValueChange).toHaveBeenLastCalledWith("#000000");
  });

  it("puts hue and alpha on mangacn's slider", () => {
    render(<ColorPickerPanel defaultValue="#00ff0080" />);
    const hue = rangeOf("color-picker-hue");
    const alpha = rangeOf("color-picker-alpha");
    expect(hue.label).toBe("Hue");
    expect(hue.input?.getAttribute("aria-valuenow")).toBe("120");
    expect(alpha.label).toBe("Alpha");
    expect(alpha.input?.getAttribute("aria-valuenow")).toBe("50");
    expect(slot("color-picker-hue")?.querySelector('[data-slot="slider-thumb"]')).toBeTruthy();
  });

  it("changes hue and alpha from their sliders' keys", () => {
    const onValueChange = vi.fn();
    render(<ColorPickerPanel defaultValue="#ff0000" onValueChange={onValueChange} />);
    const hue = rangeOf("color-picker-hue").input as HTMLInputElement;
    fireEvent.keyDown(hue, { key: "End" });
    expect(onValueChange).toHaveBeenLastCalledWith("#ff0004");
    const alpha = rangeOf("color-picker-alpha").input as HTMLInputElement;
    fireEvent.keyDown(alpha, { key: "Home" });
    expect(onValueChange).toHaveBeenLastCalledWith("#ff000400");
  });

  it("drops the alpha slider and 8-digit values with alpha off", () => {
    const onValueChange = vi.fn();
    render(
      <ColorPickerPanel defaultValue="#00ff0080" alpha={false} onValueChange={onValueChange} />,
    );
    expect(slot("color-picker-alpha")).toBeNull();
    expect(hexInput().value).toBe("#00ff00");
    fireEvent.change(hexInput(), { target: { value: "#11223344" } });
    fireEvent.keyDown(hexInput(), { key: "Enter" });
    expect(hexInput().getAttribute("aria-invalid")).toBe("true");
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("commits the hex field on Enter and on blur, and marks a bad value invalid", () => {
    const onValueChange = vi.fn();
    render(<ColorPickerPanel defaultValue="#000000" onValueChange={onValueChange} />);
    fireEvent.change(hexInput(), { target: { value: "0068B7" } });
    fireEvent.keyDown(hexInput(), { key: "Enter" });
    expect(onValueChange).toHaveBeenLastCalledWith("#0068b7");
    expect(hexInput().value).toBe("#0068b7");

    fireEvent.change(hexInput(), { target: { value: "#nope" } });
    fireEvent.blur(hexInput());
    expect(hexInput().getAttribute("aria-invalid")).toBe("true");
    const error = document.getElementById(hexInput().getAttribute("aria-describedby") ?? "");
    expect(error?.textContent).toBe("Use a hex colour such as #e60012.");
    expect(error?.className).toContain("text-destructive");
    expect(onValueChange).toHaveBeenCalledTimes(1);

    fireEvent.change(hexInput(), { target: { value: "#f39" } });
    fireEvent.blur(hexInput());
    expect(hexInput().hasAttribute("aria-invalid")).toBe(false);
    expect(onValueChange).toHaveBeenLastCalledWith("#ff3399");
  });

  it("shows swatches as a radio group named by hex, picked by click and arrow keys", () => {
    const onValueChange = vi.fn();
    render(
      <ColorPickerPanel
        defaultValue="#0068b7"
        swatches={["#e60012", "#0068b7", "#009944"]}
        onValueChange={onValueChange}
      />,
    );
    const group = screen.getByRole("radiogroup", { name: "Swatches" });
    const radios = screen.getAllByRole("radio");
    expect(group.contains(radios[0])).toBe(true);
    expect(radios.map((radio) => radio.getAttribute("aria-label"))).toEqual([
      "#e60012",
      "#0068b7",
      "#009944",
    ]);
    expect(radios.map((radio) => radio.getAttribute("aria-checked"))).toEqual([
      "false",
      "true",
      "false",
    ]);
    expect(radios.map((radio) => radio.tabIndex)).toEqual([-1, 0, -1]);
    fireEvent.keyDown(radios[1], { key: "ArrowRight" });
    expect(onValueChange).toHaveBeenLastCalledWith("#009944");
    expect(document.activeElement).toBe(radios[2]);
    fireEvent.keyDown(radios[2], { key: "ArrowRight" });
    expect(onValueChange).toHaveBeenLastCalledWith("#e60012");
    fireEvent.click(radios[1]);
    expect(onValueChange).toHaveBeenLastCalledWith("#0068b7");
  });

  it("posts the hex under name with a plain form", () => {
    render(
      <form data-testid="form">
        <ColorPickerPanel name="ink" defaultValue="#1D2088" />
      </form>,
    );
    const form = screen.getByTestId("form") as HTMLFormElement;
    expect(new FormData(form).get("ink")).toBe("#1d2088");
  });

  it("reaches the DOM with labels overrides", () => {
    render(
      <ColorPickerPanel
        swatches={["#e60012"]}
        labels={{
          area: "Tone",
          saturation: "sat",
          brightness: "val",
          hue: "Shade",
          alpha: "Opacity",
          hex: "Code",
          invalid: "Bad.",
          swatches: "Inks",
        }}
      />,
    );
    expect(screen.getByRole("slider", { name: "Tone" }).getAttribute("aria-valuetext")).toBe(
      "sat 0 %, val 0 %",
    );
    expect(rangeOf("color-picker-hue").label).toBe("Shade");
    expect(rangeOf("color-picker-alpha").label).toBe("Opacity");
    expect(screen.getByRole("radiogroup", { name: "Inks" })).toBeTruthy();
    const code = screen.getByRole("textbox", { name: "Code" });
    fireEvent.change(code, { target: { value: "x" } });
    fireEvent.blur(code);
    expect(screen.getByText("Bad.")).toBeTruthy();
  });

  it("disables every control", () => {
    render(<ColorPickerPanel disabled swatches={["#e60012"]} />);
    expect(area().getAttribute("aria-disabled")).toBe("true");
    expect(area().tabIndex).toBe(-1);
    expect(hexInput().disabled).toBe(true);
    expect((screen.getByRole("radio") as HTMLButtonElement).disabled).toBe(true);
  });
});

describe("ColorPicker", () => {
  it("is a trigger named by its label and value, opening a dialog", async () => {
    render(<ColorPicker defaultValue="#E60012" />);
    const trigger = screen.getByRole("button", { name: "Colour, #e60012" });
    expect(trigger.getAttribute("aria-haspopup")).toBe("dialog");
    expect(trigger.getAttribute("data-slot")).toBe("color-picker-trigger");
    expect(slot("color-picker")?.contains(trigger)).toBe(true);
    fireEvent.click(trigger);
    await act(async () => {});
    expect(screen.getByRole("dialog").getAttribute("data-slot")).toBe("color-picker-content");
    expect(slot("color-picker-panel")).toBeTruthy();
  });

  it("is uncontrolled from defaultValue and renames the trigger on a change", async () => {
    const onValueChange = vi.fn();
    render(<ColorPicker defaultValue="#000000" defaultOpen onValueChange={onValueChange} />);
    await act(async () => {});
    fireEvent.change(hexInput(), { target: { value: "#0068b7" } });
    fireEvent.keyDown(hexInput(), { key: "Enter" });
    expect(onValueChange).toHaveBeenLastCalledWith("#0068b7");
    expect(screen.getByRole("button", { name: "Colour, #0068b7" })).toBeTruthy();
  });

  it("is controlled by value and by open", async () => {
    const onValueChange = vi.fn();
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <ColorPicker value="#e60012" onValueChange={onValueChange} onOpenChange={onOpenChange} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Colour, #e60012" }));
    await act(async () => {});
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    rerender(
      <ColorPicker
        value="#e60012"
        open
        onValueChange={onValueChange}
        onOpenChange={onOpenChange}
      />,
    );
    await act(async () => {});
    fireEvent.keyDown(area(), { key: "ArrowDown" });
    expect(onValueChange).toHaveBeenCalledTimes(1);
    // Not updated by the parent: the trigger keeps the controlled value.
    expect(screen.getByRole("button", { name: "Colour, #e60012" })).toBeTruthy();
  });

  it("closes with Escape and returns focus to the trigger", async () => {
    render(<ColorPicker defaultValue="#e60012" />);
    const trigger = screen.getByRole("button", { name: "Colour, #e60012" });
    act(() => trigger.focus());
    fireEvent.click(trigger);
    await act(async () => {});
    expect(screen.getByRole("dialog")).toBeTruthy();
    fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });
    await act(async () => {});
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("posts the hex under name while closed", () => {
    render(
      <form data-testid="form">
        <ColorPicker name="accent" defaultValue="#e60012" />
      </form>,
    );
    expect(new FormData(screen.getByTestId("form") as HTMLFormElement).get("accent")).toBe(
      "#e60012",
    );
  });

  it("puts id, aria-invalid and aria-describedby on the trigger, for field", () => {
    render(
      <ColorPicker
        id="accent"
        aria-invalid
        aria-describedby="hint"
        labels={{ trigger: "Accent" }}
      />,
    );
    const trigger = screen.getByRole("button", { name: "Accent, #000000" });
    expect(trigger.id).toBe("accent");
    expect(trigger.getAttribute("aria-invalid")).toBe("true");
    expect(trigger.getAttribute("aria-describedby")).toBe("hint");
  });

  it("disables the trigger", () => {
    render(<ColorPicker disabled />);
    expect(
      (screen.getByRole("button", { name: "Colour, #000000" }) as HTMLButtonElement).disabled,
    ).toBe(true);
  });

  expectDemosAccessible(import.meta.glob("./demos/*.tsx"));
});
