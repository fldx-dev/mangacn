import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { expectNoA11yViolations } from "@/lib/test/axe";
import { stubResizeObserver } from "@/lib/test/resize-observer";
import SelectDefaultDemo from "./demos/default";
import SelectOpenDemo from "./demos/open";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "./select";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const genres = [
  { label: "Shōnen", value: "shonen" },
  { label: "Seinen", value: "seinen" },
];

function Genre(props: { open?: boolean; disabled?: boolean }) {
  return (
    <Select items={genres} defaultValue="shonen" defaultOpen={props.open}>
      <SelectTrigger aria-label="Genre" className="custom-class" disabled={props.disabled}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {genres.map((genre) => (
          <SelectItem key={genre.value} value={genre.value}>
            {genre.label}
          </SelectItem>
        ))}
        <SelectSeparator />
      </SelectContent>
    </Select>
  );
}

const frameOf = (element: Element | null | undefined) =>
  element?.querySelector<HTMLElement>(':scope > [data-slot="ink-frame"]');

describe("Select", () => {
  it("renders a trigger with data-slot, a forwarded className and a paper InkFrame", () => {
    render(<Genre />);
    const trigger = screen.getByRole("combobox", { name: "Genre" });
    expect(trigger.getAttribute("data-slot")).toBe("select-trigger");
    expect(trigger.classList.contains("custom-class")).toBe(true);
    for (const name of trigger.classList) {
      expect(name, name).not.toMatch(/^border$|border-input|:border-|shadow-/);
    }
    expect(frameOf(trigger)?.getAttribute("data-fill")).toBe("paper");
    expect(trigger.textContent).toContain("Shōnen");
  });

  it("outlines the popup at the heavy width from its positioner, with no shadow or ring", () => {
    render(<Genre open />);
    const popup = document.querySelector<HTMLElement>('[data-slot="select-content"]');
    expect(popup).not.toBeNull();
    for (const name of popup?.classList ?? []) {
      expect(name, name).not.toMatch(/^shadow-|^ring-/);
    }
    const frame = frameOf(popup?.parentElement);
    expect(frame?.className).toContain("[--outline-width:var(--outline-width-heavy)]");
    const separator = document.querySelector('[data-slot="select-separator"]');
    expect(frameOf(separator)?.getAttribute("data-shape")).toBe("line");
  });

  it("opens with the keyboard and picks an item with Enter, like stock", async () => {
    render(<Genre />);
    const trigger = screen.getByRole("combobox");
    act(() => trigger.focus());
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    const option = screen.getByRole("option", { name: "Seinen" });
    act(() => option.focus());
    fireEvent.keyDown(option, { key: "Enter" });
    await act(async () => {});
    expect(trigger.textContent).toContain("Seinen");
  });

  it("screens disabled triggers with halftone through an unfilled outline", () => {
    render(<Genre disabled />);
    const trigger = screen.getByRole("combobox");
    expect(trigger.classList.contains("disabled:halftone-light")).toBe(true);
    expect(frameOf(trigger)?.getAttribute("data-fill")).toBe("none");
  });

  it("draws once measured", () => {
    const observers = stubResizeObserver();
    render(<Genre />);
    observers.drawAll(160, 32);
    expect(frameOf(screen.getByRole("combobox"))?.dataset.inked).toBe("true");
  });

  it("has no axe violations in its default demo", async () => {
    await expectNoA11yViolations(<SelectDefaultDemo />);
  });

  it("has no axe violations when open", async () => {
    await expectNoA11yViolations(<SelectOpenDemo />);
  });
});
