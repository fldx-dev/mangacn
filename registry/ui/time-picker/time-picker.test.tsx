import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { expectDemosAccessible } from "@/lib/test/axe";
import { TimePicker } from "./time-picker";

afterEach(cleanup);

const segment = (name: string) => screen.getByRole("spinbutton", { name });
const press = (name: string, ...keys: string[]) => {
  for (const key of keys) fireEvent.keyDown(segment(name), { key });
};

function Controlled() {
  const [value, setValue] = React.useState<string | null>("23:59");
  return (
    <>
      <TimePicker aria-label="T" value={value} onValueChange={setValue} />
      <button type="button" onClick={() => setValue("07:30")}>
        Reset
      </button>
      <output>{value ?? "none"}</output>
    </>
  );
}

describe("TimePicker", () => {
  expectDemosAccessible(import.meta.glob("./demos/*.tsx"));

  it("renders a labelled group of spinbuttons with slots and one outline", () => {
    render(<TimePicker aria-label="Deadline" defaultValue="09:05" />);
    const group = screen.getByRole("group", { name: "Deadline" });
    expect(group.dataset.slot).toBe("time-picker");
    expect(group.hasAttribute("data-grouped")).toBe(true);
    const frames = group.querySelectorAll('[data-slot="ink-frame"]');
    expect(frames).toHaveLength(1);
    expect(frames[0]).toBe(group.firstElementChild);
    const hours = segment("Hours");
    expect(hours.dataset.slot).toBe("time-picker-segment");
    expect(hours.dataset.segment).toBe("hour");
    expect(hours.getAttribute("aria-valuenow")).toBe("9");
    expect(hours.getAttribute("aria-valuemin")).toBe("0");
    expect(hours.getAttribute("aria-valuemax")).toBe("23");
    expect(hours.getAttribute("aria-valuetext")).toBe("09");
    expect(segment("Minutes").textContent).toBe("05");
    expect(group.querySelector('[data-slot="time-picker-separator"]')?.textContent).toBe(":");
    expect(screen.queryByRole("spinbutton", { name: "AM/PM" })).toBeNull();
  });

  it("is uncontrolled from defaultValue and reports each change", () => {
    const onValueChange = vi.fn();
    render(<TimePicker aria-label="T" defaultValue="09:05" onValueChange={onValueChange} />);
    press("Hours", "ArrowUp");
    expect(onValueChange).toHaveBeenLastCalledWith("10:05");
    expect(segment("Hours").textContent).toBe("10");
  });

  it("is controlled by value and follows it", () => {
    render(<Controlled />);
    press("Minutes", "ArrowUp");
    expect(screen.getByRole("status").textContent).toBe("23:00");
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(segment("Hours").textContent).toBe("07");
    expect(segment("Minutes").textContent).toBe("30");
  });

  it("stays put under a controlled value without onValueChange", () => {
    render(<TimePicker aria-label="T" value="12:00" />);
    expect(segment("Hours").textContent).toBe("12");
  });

  it("calls back null until hours and minutes are both set", () => {
    const onValueChange = vi.fn();
    render(<TimePicker aria-label="T" onValueChange={onValueChange} />);
    expect(segment("Hours").textContent).toBe("--");
    expect(segment("Hours").hasAttribute("aria-valuenow")).toBe(false);
    press("Hours", "ArrowUp");
    expect(onValueChange).not.toHaveBeenCalled();
    press("Minutes", "ArrowDown");
    expect(onValueChange).toHaveBeenLastCalledWith("00:59");
    press("Minutes", "Backspace");
    expect(onValueChange).toHaveBeenLastCalledWith(null);
    expect(segment("Minutes").textContent).toBe("--");
  });

  it("steps with Up and Down, wrapping, and minutes by minuteStep", () => {
    render(<TimePicker aria-label="T" defaultValue="23:50" minuteStep={15} />);
    press("Hours", "ArrowUp");
    expect(segment("Hours").textContent).toBe("00");
    press("Hours", "ArrowDown");
    expect(segment("Hours").textContent).toBe("23");
    press("Minutes", "ArrowUp");
    expect(segment("Minutes").textContent).toBe("00");
    press("Minutes", "ArrowDown");
    expect(segment("Minutes").textContent).toBe("45");
    press("Minutes", "ArrowDown");
    expect(segment("Minutes").textContent).toBe("30");
  });

  it("jumps 3 hours or 10 minutes with PageUp and PageDown", () => {
    render(<TimePicker aria-label="T" defaultValue="22:55" />);
    press("Hours", "PageUp");
    expect(segment("Hours").textContent).toBe("01");
    press("Hours", "PageDown");
    expect(segment("Hours").textContent).toBe("22");
    press("Minutes", "PageUp");
    expect(segment("Minutes").textContent).toBe("05");
    press("Minutes", "PageDown");
    expect(segment("Minutes").textContent).toBe("55");
  });

  it("goes to the first and last value with Home and End", () => {
    render(<TimePicker aria-label="T" defaultValue="12:30" minuteStep={5} />);
    press("Hours", "End");
    expect(segment("Hours").textContent).toBe("23");
    press("Hours", "Home");
    expect(segment("Hours").textContent).toBe("00");
    press("Minutes", "End");
    expect(segment("Minutes").textContent).toBe("55");
    press("Minutes", "Home");
    expect(segment("Minutes").textContent).toBe("00");
  });

  it("fills a segment from typed digits and moves on once it is full", () => {
    const onValueChange = vi.fn();
    render(<TimePicker aria-label="T" onValueChange={onValueChange} />);
    segment("Hours").focus();
    press("Hours", "1", "5");
    expect(segment("Hours").textContent).toBe("15");
    expect(document.activeElement).toBe(segment("Minutes"));
    press("Minutes", "7");
    expect(onValueChange).toHaveBeenLastCalledWith("15:07");
    segment("Hours").focus();
    press("Hours", "4");
    expect(segment("Hours").textContent).toBe("04");
    expect(document.activeElement).toBe(segment("Minutes"));
  });

  it("takes a digit from beforeinput, as a phone's number pad sends it", () => {
    render(<TimePicker aria-label="T" />);
    const hours = segment("Hours");
    const event = new InputEvent("beforeinput", {
      data: "8",
      inputType: "insertText",
      bubbles: true,
      cancelable: true,
    });
    fireEvent(hours, event);
    expect(hours.textContent).toBe("08");
    expect(event.defaultPrevented).toBe(true);
  });

  it("moves between segments with Left and Right", () => {
    render(<TimePicker aria-label="T" hourCycle={12} defaultValue="09:00" />);
    segment("Hours").focus();
    press("Hours", "ArrowRight");
    expect(document.activeElement).toBe(segment("Minutes"));
    press("Minutes", "ArrowRight");
    expect(document.activeElement).toBe(segment("AM/PM"));
    press("AM/PM", "ArrowRight");
    expect(document.activeElement).toBe(segment("AM/PM"));
    press("AM/PM", "ArrowLeft");
    expect(document.activeElement).toBe(segment("Minutes"));
  });

  it("shows 1 to 12 and AM/PM in 12-hour mode, set by A and P, posting 24 hours", () => {
    const onValueChange = vi.fn();
    render(
      <form data-testid="form">
        <TimePicker
          aria-label="T"
          hourCycle={12}
          defaultValue="00:15"
          name="start"
          onValueChange={onValueChange}
        />
      </form>,
    );
    expect(segment("Hours").textContent).toBe("12");
    expect(segment("Hours").getAttribute("aria-valuemin")).toBe("1");
    expect(segment("Hours").getAttribute("aria-valuemax")).toBe("12");
    const period = segment("AM/PM");
    expect(period.dataset.segment).toBe("period");
    expect(period.getAttribute("aria-valuetext")).toBe("AM");
    press("AM/PM", "p");
    expect(period.getAttribute("aria-valuetext")).toBe("PM");
    expect(onValueChange).toHaveBeenLastCalledWith("12:15");
    press("AM/PM", "A");
    expect(onValueChange).toHaveBeenLastCalledWith("00:15");
    press("AM/PM", "ArrowUp");
    expect(onValueChange).toHaveBeenLastCalledWith("12:15");
    segment("Hours").focus();
    press("Hours", "0", "9");
    const data = new FormData(screen.getByTestId("form") as HTMLFormElement);
    expect(data.get("start")).toBe("21:15");
  });

  it("posts the value as HH:mm under name, empty when unset", () => {
    render(
      <form data-testid="form">
        <TimePicker aria-label="A" name="alarm" defaultValue="06:45" />
        <TimePicker aria-label="B" name="empty" />
      </form>,
    );
    const data = new FormData(screen.getByTestId("form") as HTMLFormElement);
    expect(data.get("alarm")).toBe("06:45");
    expect(data.get("empty")).toBe("");
  });

  it("marks every segment invalid outside min and max", () => {
    render(<TimePicker aria-label="T" defaultValue="08:45" min="09:00" max="21:00" />);
    const group = screen.getByRole("group", { name: "T" });
    expect(segment("Hours").getAttribute("aria-invalid")).toBe("true");
    expect(segment("Minutes").getAttribute("aria-invalid")).toBe("true");
    expect(group.hasAttribute("data-invalid")).toBe(true);
    press("Hours", "ArrowUp");
    expect(segment("Hours").hasAttribute("aria-invalid")).toBe(false);
    expect(group.hasAttribute("data-invalid")).toBe(false);
    press("Hours", "End");
    expect(segment("Hours").getAttribute("aria-invalid")).toBe("true");
  });

  it("takes a field's id, aria-invalid and aria-describedby on its segments", () => {
    render(
      <TimePicker
        aria-label="T"
        id="release"
        aria-invalid
        aria-describedby="hint"
        required
        defaultValue="10:00"
      />,
    );
    expect(segment("Hours").id).toBe("release");
    for (const name of ["Hours", "Minutes"]) {
      expect(segment(name).getAttribute("aria-invalid")).toBe("true");
      expect(segment(name).getAttribute("aria-describedby")).toBe("hint");
      expect(segment(name).getAttribute("aria-required")).toBe("true");
    }
  });

  it("overrides every segment name through labels", () => {
    render(
      <TimePicker
        aria-label="T"
        hourCycle={12}
        labels={{ hours: "時", minutes: "分", period: "午前/午後" }}
      />,
    );
    expect(segment("時")).toBeTruthy();
    expect(segment("分")).toBeTruthy();
    expect(segment("午前/午後")).toBeTruthy();
  });

  it("ignores keys and leaves the tab order when disabled", () => {
    const onValueChange = vi.fn();
    render(
      <TimePicker aria-label="T" disabled defaultValue="10:00" onValueChange={onValueChange} />,
    );
    const hours = segment("Hours");
    press("Hours", "ArrowUp", "5", "Backspace");
    expect(onValueChange).not.toHaveBeenCalled();
    expect(hours.textContent).toBe("10");
    expect(hours.hasAttribute("tabindex")).toBe(false);
    expect(hours.getAttribute("aria-disabled")).toBe("true");
    expect(screen.getByRole("group", { name: "T" }).hasAttribute("data-disabled")).toBe(true);
  });
});
