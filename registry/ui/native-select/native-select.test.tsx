import { cleanup, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { expectDemosAccessible } from "@/lib/test/axe";
import { stubResizeObserver } from "@/lib/test/resize-observer";
import InAFieldDemo from "./demos/in-a-field";
import { NativeSelect, NativeSelectOptGroup, NativeSelectOption } from "./native-select";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function Genres(props: ComponentProps<typeof NativeSelect>) {
  return (
    <NativeSelect aria-label="Genre" defaultValue="seinen" {...props}>
      <NativeSelectOptGroup label="By readership" className="group-class">
        <NativeSelectOption value="shonen">Shōnen</NativeSelectOption>
        <NativeSelectOption value="seinen" className="option-class">
          Seinen
        </NativeSelectOption>
      </NativeSelectOptGroup>
    </NativeSelect>
  );
}

const slot = (name: string) => document.querySelector<HTMLElement>(`[data-slot="${name}"]`);

describe("NativeSelect", () => {
  it("renders stock's parts with their data-slots; className goes to the wrapper", () => {
    render(<Genres className="custom-class" />);
    const select = screen.getByRole("combobox", { name: "Genre" });
    expect(select.tagName.toLowerCase()).toBe("select");
    expect(select.dataset.slot).toBe("native-select");
    expect((select as HTMLSelectElement).value).toBe("seinen");
    const wrapper = slot("native-select-wrapper");
    expect(wrapper?.classList.contains("custom-class")).toBe(true);
    expect(select.parentElement).toBe(wrapper);
    expect(slot("native-select-icon")?.getAttribute("aria-hidden")).toBe("true");
    expect(slot("native-select-optgroup")?.classList.contains("group-class")).toBe(true);
    expect(document.querySelectorAll('[data-slot="native-select-option"]')).toHaveLength(2);
    expect(screen.getByRole("option", { name: "Seinen" }).classList.contains("option-class")).toBe(
      true,
    );
  });

  it("draws select's paper box with an InkFrame behind the control, no CSS border", () => {
    render(<Genres />);
    const select = screen.getByRole("combobox");
    const frame = slot("native-select-wrapper")?.firstElementChild as HTMLElement;
    expect(frame.dataset.slot).toBe("ink-frame");
    expect(frame.dataset.fill).toBe("paper");
    expect(frame.className).toContain("-z-1");
    for (const name of select.classList) {
      expect(name, name).not.toMatch(/^border$|border-input|(visible|invalid):border-|bg-input/);
    }
    expect(select.classList.contains("border-0")).toBe(true);
    expect(select.classList.contains("appearance-none")).toBe(true);
  });

  it("maps size to data-size on the wrapper and the control", () => {
    render(<Genres size="sm" />);
    expect(slot("native-select-wrapper")?.dataset.size).toBe("sm");
    expect(screen.getByRole("combobox").dataset.size).toBe("sm");
  });

  it("screens a disabled control with halftone under an unfilled outline", () => {
    render(<Genres disabled />);
    const select = screen.getByRole("combobox");
    expect(select.hasAttribute("disabled")).toBe(true);
    expect(select.classList.contains("disabled:halftone-light")).toBe(true);
    expect(slot("native-select-wrapper")?.className).toContain("has-[select:disabled]:opacity-100");
    expect(slot("ink-frame")?.dataset.fill).toBe("none");
  });

  it("inks the outline in spot when invalid", () => {
    render(<Genres aria-invalid />);
    expect(slot("native-select-wrapper")?.className).toContain(
      "has-[select[aria-invalid=true]]:[--ink:var(--destructive)]",
    );
    expect(screen.getByRole("combobox").getAttribute("aria-invalid")).toBe("true");
  });

  it("draws once measured", () => {
    const observers = stubResizeObserver();
    render(<Genres />);
    observers.drawAll(192, 32);
    expect(slot("ink-frame")?.dataset.inked).toBe("true");
  });

  it("takes its name from a field's FieldLabel and its description from the hint", () => {
    render(<InAFieldDemo />);
    const select = screen.getByRole("combobox", { name: "Release schedule" });
    expect(select.getAttribute("aria-describedby")).toBe("native-select-demo-schedule-hint");
    expect(select.closest('[data-slot="field"]')).toBeTruthy();
  });

  expectDemosAccessible(import.meta.glob("./demos/*.tsx"));
});
