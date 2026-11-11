import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { expectDemosAccessible } from "@/lib/test/axe";
import { stubResizeObserver } from "@/lib/test/resize-observer";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "./input-otp";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function Code({ onComplete, invalid }: { onComplete?: (code: string) => void; invalid?: boolean }) {
  return (
    <InputOTP
      maxLength={4}
      aria-label="Code"
      aria-invalid={invalid}
      onComplete={onComplete}
      className="input-class"
      containerClassName="container-class"
    >
      <InputOTPGroup className="group-class">
        <InputOTPSlot index={0} className="slot-class" />
        <InputOTPSlot index={1} />
      </InputOTPGroup>
      <InputOTPSeparator />
      <InputOTPGroup>
        <InputOTPSlot index={2} />
        <InputOTPSlot index={3} aria-invalid />
      </InputOTPGroup>
    </InputOTP>
  );
}

const slots = () => [...document.querySelectorAll<HTMLElement>('[data-slot="input-otp-slot"]')];
const frames = (slot: HTMLElement) => [
  ...slot.querySelectorAll<HTMLElement>(':scope > [data-slot="ink-frame"]'),
];

describe("InputOTP", () => {
  it("keeps stock's slots and forwards every className", () => {
    render(<Code />);
    const input = screen.getByRole("textbox", { name: "Code" });
    expect(input.dataset.slot).toBe("input-otp");
    expect(input.classList.contains("input-class")).toBe(true);
    expect(input.closest(".container-class")?.classList.contains("cn-input-otp")).toBe(true);
    expect(document.querySelectorAll('[data-slot="input-otp-group"]')).toHaveLength(2);
    expect(document.querySelector<HTMLElement>(".group-class")?.dataset.slot).toBe(
      "input-otp-group",
    );
    expect(slots()).toHaveLength(4);
    expect(slots()[0]?.classList.contains("slot-class")).toBe(true);
  });

  it("gives every slot its own paper outline and no CSS border", () => {
    render(<Code />);
    for (const slot of slots()) {
      const [frame, ...rest] = frames(slot);
      expect(frame?.dataset.fill).toBe("paper");
      expect(rest).toHaveLength(0);
      expect(slot.className).not.toMatch(/\bborder-(y|r|l|input)\b/);
      expect(slot.className).not.toContain("ring-3");
    }
  });

  it("takes a code typed through the library, one slot at a time", () => {
    const onComplete = vi.fn();
    render(<Code onComplete={onComplete} />);
    const input = screen.getByRole("textbox", { name: "Code" });
    act(() => input.focus());
    fireEvent.change(input, { target: { value: "48" } });
    expect(slots().map((slot) => slot.textContent)).toEqual(["4", "8", "", ""]);
    fireEvent.change(input, { target: { value: "4821" } });
    expect(slots().map((slot) => slot.textContent)).toEqual(["4", "8", "2", "1"]);
    expect(onComplete).toHaveBeenCalledWith("4821");
  });

  it("traces the active slot again at the heavy width, with the same wobble", () => {
    render(<Code />);
    const input = screen.getByRole("textbox", { name: "Code" });
    act(() => input.focus());
    fireEvent.change(input, { target: { value: "4" } });
    act(() => (input as HTMLInputElement).setSelectionRange(1, 1));
    fireEvent.select(input);
    const active = slots().filter((slot) => slot.dataset.active === "true");
    expect(active).toHaveLength(1);
    const [light, heavy] = frames(active[0] as HTMLElement);
    expect(heavy?.dataset.fill).toBe("none");
    expect(heavy?.className).toContain("[--outline-width:var(--outline-width-heavy)]");
    expect(heavy?.dataset.shape).toBe(light?.dataset.shape);
    for (const slot of slots().filter((slot) => slot.dataset.active !== "true")) {
      expect(frames(slot)).toHaveLength(1);
    }
  });

  it("draws an ink caret that blinks only when motion is allowed", () => {
    render(<Code />);
    const input = screen.getByRole("textbox", { name: "Code" });
    act(() => input.focus());
    fireEvent.select(input);
    const caret = document.querySelector<HTMLElement>(".bg-ink");
    expect(caret).not.toBeNull();
    expect(caret?.className).toContain("motion-safe:animate-caret-blink");
    expect(caret?.className).not.toMatch(/(^|\s)animate-caret-blink/);
  });

  it("parts groups with a hand-drawn dash", () => {
    render(<Code />);
    const separator = screen.getByRole("separator");
    expect(separator.dataset.slot).toBe("input-otp-separator");
    expect(separator.querySelector("svg.lucide")).toBeNull();
    const dash = separator.querySelector<HTMLElement>('[data-slot="ink-frame"]');
    expect(dash?.dataset.shape).toBe("line");
  });

  it("turns the ink spot when the field or a slot is invalid", () => {
    render(<Code invalid />);
    const input = screen.getByRole("textbox", { name: "Code" });
    expect(input.getAttribute("aria-invalid")).toBe("true");
    const container = input.closest(".container-class");
    expect(container?.className).toContain(
      "has-[input[aria-invalid=true]]:[--ink:var(--destructive)]",
    );
    expect(slots()[3]?.className).toContain("aria-invalid:[--ink:var(--destructive)]");
  });

  it("draws the outlines once measured", () => {
    const observers = stubResizeObserver();
    render(<Code />);
    observers.drawAll(32, 32);
    const frame = frames(slots()[0] as HTMLElement)[0];
    expect(frame?.dataset.inked).toBe("true");
    expect(frame?.querySelectorAll("path").length).toBeGreaterThan(0);
  });

  expectDemosAccessible(import.meta.glob("./demos/*.tsx"));
});
