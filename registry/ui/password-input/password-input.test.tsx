import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { expectDemosAccessible } from "@/lib/test/axe";
import { getPasswordStrength, PasswordInput } from "./password-input";

afterEach(cleanup);

const field = () => document.querySelector<HTMLInputElement>("input") as HTMLInputElement;
const toggle = () => screen.getByRole("button", { name: "Show password" });

describe("getPasswordStrength", () => {
  it("scores length and character classes from 0 to 4", () => {
    expect(getPasswordStrength("")).toBe(0);
    expect(getPasswordStrength("abc")).toBe(0);
    expect(getPasswordStrength("Ab1!")).toBe(1);
    expect(getPasswordStrength("abcdefgh")).toBe(1);
    expect(getPasswordStrength("abcdefg1")).toBe(2);
    expect(getPasswordStrength("Abcdefg1")).toBe(3);
    expect(getPasswordStrength("abcdefghijkl")).toBe(2);
    expect(getPasswordStrength("Abcdefgh1!xy")).toBe(4);
  });
});

describe("PasswordInput", () => {
  expectDemosAccessible(import.meta.glob("./demos/*.tsx"));

  it("is one input group: the input and its toggle in one frame, with slots", () => {
    render(<PasswordInput aria-label="Password" className="custom" />);
    const root = document.querySelector<HTMLElement>('[data-slot="password-input"]');
    expect(root?.classList.contains("custom")).toBe(true);
    const group = root?.querySelector('[data-slot="input-group"]');
    expect(group?.hasAttribute("data-grouped")).toBe(true);
    expect(group?.contains(field())).toBe(true);
    expect(toggle().dataset.slot).toBe("password-input-toggle");
    expect(field().type).toBe("password");
  });

  it("toggles with aria-pressed and aria-controls, keeping its name and focus", () => {
    render(<PasswordInput aria-label="Password" id="pw" />);
    const button = toggle();
    expect(button.getAttribute("aria-controls")).toBe("pw");
    expect(button.getAttribute("aria-pressed")).toBe("false");
    button.focus();
    fireEvent.click(button);
    expect(field().type).toBe("text");
    expect(button.getAttribute("aria-pressed")).toBe("true");
    expect(button.getAttribute("aria-label")).toBe("Show password");
    expect(button.getAttribute("title")).toBe("Hide password");
    expect(document.activeElement).toBe(button);
  });

  it("controls visibility with visible / onVisibleChange", () => {
    const onVisibleChange = vi.fn();
    const { rerender } = render(
      <PasswordInput aria-label="Password" visible={false} onVisibleChange={onVisibleChange} />,
    );
    fireEvent.click(toggle());
    expect(onVisibleChange).toHaveBeenCalledWith(true);
    expect(field().type).toBe("password");
    rerender(<PasswordInput aria-label="Password" visible onVisibleChange={onVisibleChange} />);
    expect(field().type).toBe("text");
  });

  it("starts shown with defaultVisible", () => {
    render(<PasswordInput aria-label="Password" defaultVisible />);
    expect(field().type).toBe("text");
  });

  it("shows a meter with valuemin, valuemax, valuenow and the word as valuetext and text", () => {
    render(<PasswordInput aria-label="Password" showStrength defaultValue="abcdefg1" />);
    const meter = screen.getByRole("meter");
    expect(meter.dataset.slot).toBe("password-input-strength");
    expect(meter.getAttribute("aria-valuemin")).toBe("0");
    expect(meter.getAttribute("aria-valuemax")).toBe("4");
    expect(meter.getAttribute("aria-valuenow")).toBe("2");
    expect(meter.getAttribute("aria-valuetext")).toBe("Fair");
    expect(meter.textContent).toContain("Fair");
    const segments = meter.querySelectorAll<HTMLElement>(
      '[data-slot="password-input-strength-segment"]',
    );
    expect([...segments].map((segment) => segment.dataset.state)).toEqual([
      "filled",
      "filled",
      "empty",
      "empty",
    ]);
  });

  it("rescores as the user types, and takes a custom strength function", () => {
    const strength = vi.fn(() => 4 as const);
    const { rerender } = render(<PasswordInput aria-label="Password" showStrength />);
    expect(screen.getByRole("meter").getAttribute("aria-valuenow")).toBe("0");
    act(() => {
      fireEvent.change(field(), { target: { value: "Abcdefgh1!xy" } });
    });
    expect(screen.getByRole("meter").getAttribute("aria-valuetext")).toBe("Strong");
    rerender(<PasswordInput aria-label="Password" showStrength strength={strength} />);
    expect(strength).toHaveBeenCalledWith("Abcdefgh1!xy");
  });

  it("has no meter unless showStrength", () => {
    render(<PasswordInput aria-label="Password" defaultValue="abc" />);
    expect(screen.queryByRole("meter")).toBeNull();
  });

  it("posts under name and keeps autoComplete", () => {
    render(
      <form data-testid="form">
        <PasswordInput
          aria-label="Password"
          name="password"
          defaultValue="secret"
          autoComplete="new-password"
        />
      </form>,
    );
    expect(field().autocomplete).toBe("new-password");
    const data = new FormData(screen.getByTestId("form") as HTMLFormElement);
    expect(data.get("password")).toBe("secret");
  });

  it("takes its words from labels", () => {
    render(
      <PasswordInput
        aria-label="Password"
        showStrength
        labels={{ show: "表示", strength: ["弱すぎ", "弱い", "普通", "良い", "強い"] }}
      />,
    );
    expect(screen.getByRole("button", { name: "表示" })).toBeTruthy();
    expect(screen.getByRole("meter").getAttribute("aria-valuetext")).toBe("弱すぎ");
  });

  it("puts id, aria-invalid and aria-describedby on the input for field", () => {
    render(
      <>
        <label htmlFor="pw">Password</label>
        <PasswordInput id="pw" aria-invalid="true" aria-describedby="pw-error" />
      </>,
    );
    const input = screen.getByLabelText("Password", { selector: "input" });
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-describedby")).toBe("pw-error");
  });
});
