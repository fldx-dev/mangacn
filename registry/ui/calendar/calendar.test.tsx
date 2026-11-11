import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import * as React from "react";
import type { DateRange } from "react-day-picker";
import { afterEach, describe, expect, it, vi } from "vitest";
import { expectDemosAccessible } from "@/lib/test/axe";
import { stubResizeObserver } from "@/lib/test/resize-observer";
import { Calendar } from "./calendar";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const today = new Date(2026, 5, 12);
const month = { today, defaultMonth: today };

/** The day button for `day` of June 2026, by its accessible name. */
const dayButton = (day: number) =>
  screen.getByRole("button", { name: new RegExp(`June ${day}(st|nd|rd|th), 2026`) });
const cell = (day: number) => dayButton(day).closest("td") as HTMLElement;
const inked = (button: HTMLElement) =>
  button.querySelector<HTMLElement>(':scope > [data-slot="ink-frame"]');

function Single() {
  const [date, setDate] = React.useState<Date | undefined>();
  return (
    <Calendar
      mode="single"
      selected={date}
      onSelect={setDate}
      className="custom-class"
      {...month}
    />
  );
}

function Range() {
  const [range, setRange] = React.useState<DateRange | undefined>();
  return <Calendar mode="range" selected={range} onSelect={setRange} {...month} />;
}

describe("Calendar", () => {
  it("is an outlined paper card with the caption in the display face", () => {
    render(<Single />);
    const root = document.querySelector<HTMLElement>('[data-slot="calendar"]');
    expect(root?.classList.contains("custom-class")).toBe(true);
    const frame = root?.querySelector<HTMLElement>(':scope > [data-slot="ink-frame"]');
    expect(frame?.dataset.fill).toBe("paper");
    expect(frame?.className).toContain("in-data-[slot=card-content]:hidden");
    expect(screen.getByText("June 2026").className).toContain("font-display");
  });

  it("underlines today and mutes outside days", () => {
    render(<Single />);
    expect(cell(12).dataset.today).toBe("true");
    expect(cell(12).className).toContain("[&_button]:underline");
    expect(cell(11).className).not.toContain("[&_button]:underline");
    const outside = document.querySelector<HTMLElement>('td[data-outside="true"]');
    expect(outside?.className).toContain("text-muted-foreground");
  });

  it("ink-fills the day picked through the library", () => {
    render(<Single />);
    expect(inked(dayButton(19))).toBeNull();
    fireEvent.click(dayButton(19));
    const picked = dayButton(19);
    expect(picked.dataset.selectedSingle).toBe("true");
    expect(cell(19).dataset.selected).toBe("true");
    expect(inked(picked)?.dataset.fill).toBe("ink");
    expect(picked.className).toContain("data-[selected-single=true]:bg-primary");
    fireEvent.click(dayButton(22));
    expect(inked(dayButton(19))).toBeNull();
    expect(inked(dayButton(22))?.dataset.fill).toBe("ink");
  });

  it("ink-fills a range's ends and lays its middle on halftone", () => {
    render(<Range />);
    fireEvent.click(dayButton(15));
    fireEvent.click(dayButton(18));
    expect(dayButton(15).dataset.rangeStart).toBe("true");
    expect(dayButton(18).dataset.rangeEnd).toBe("true");
    expect(inked(dayButton(15))?.dataset.fill).toBe("ink");
    expect(inked(dayButton(18))?.dataset.fill).toBe("ink");
    for (const day of [16, 17]) {
      expect(dayButton(day).dataset.rangeMiddle).toBe("true");
      expect(inked(dayButton(day))).toBeNull();
      expect(cell(day).className).toContain("halftone-light");
    }
    expect(cell(15).className).toContain("after:halftone-light");
  });

  it("navigates with mangacn's button classes", () => {
    render(<Single />);
    const next = screen.getByRole("button", { name: /next month/i });
    expect(next.className).toContain("hover:bg-muted");
    fireEvent.click(next);
    expect(screen.getByText("July 2026")).toBeTruthy();
  });

  it("boxes the caption dropdowns in ink", () => {
    render(
      <Calendar
        mode="single"
        captionLayout="dropdown"
        startMonth={new Date(2020, 0)}
        endMonth={new Date(2030, 11)}
        {...month}
      />,
    );
    const labels = document.querySelectorAll<HTMLElement>(".rdp-caption_label");
    expect(labels.length).toBe(2);
    for (const label of labels) expect(label.className).toContain("ink-border");
    expect(screen.getAllByRole("combobox")).toHaveLength(2);
  });

  it("draws its frames once measured", () => {
    const observers = stubResizeObserver();
    render(<Single />);
    fireEvent.click(dayButton(19));
    observers.drawAll(28, 28);
    expect(inked(dayButton(19))?.dataset.inked).toBe("true");
  });

  expectDemosAccessible(import.meta.glob("./demos/*.tsx"));
});
