import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { startOfDay, subDays } from "date-fns";
import { ja } from "date-fns/locale";
import * as React from "react";
import type { DateRange } from "react-day-picker";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { expectDemosAccessible } from "@/lib/test/axe";
import { DateRangePicker } from "./date-range-picker";

// jsdom has no matchMedia, and useIsMobile reads window.innerWidth against it (as in
// registry/ui/sidebar/sidebar.test.tsx).
function stubViewport(width: number) {
  vi.stubGlobal("innerWidth", width);
  vi.stubGlobal("matchMedia", (query: string) => ({
    media: query,
    matches: width < 768,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

beforeEach(() => stubViewport(1280));
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const JUNE = { from: new Date(2026, 5, 8), to: new Date(2026, 5, 14) };

const flush = () => act(async () => {});

async function openWith(trigger: HTMLElement) {
  fireEvent.click(trigger);
  await flush();
  return screen.getByRole("dialog");
}

function Controlled({ onValueChange }: { onValueChange?: (range?: DateRange) => void }) {
  const [range, setRange] = React.useState<DateRange | undefined>(JUNE);
  return (
    <>
      <DateRangePicker
        value={range}
        onValueChange={(next) => {
          setRange(next);
          onValueChange?.(next);
        }}
      />
      <button type="button" onClick={() => setRange(undefined)}>
        Clear
      </button>
    </>
  );
}

describe("DateRangePicker", () => {
  expectDemosAccessible(import.meta.glob("./demos/*.tsx"), { setup: () => stubViewport(1280) });

  it("shows the range on a trigger that opens a dialog, with every slot", async () => {
    render(<DateRangePicker defaultValue={JUNE} />);
    const trigger = screen.getByRole("button", { name: "Jun 8, 2026 – Jun 14, 2026" });
    expect(trigger.dataset.slot).toBe("date-range-picker-trigger");
    expect(trigger.getAttribute("aria-haspopup")).toBe("dialog");
    expect(trigger.closest('[data-slot="date-range-picker"]')?.getAttribute("data-state")).toBe(
      "closed",
    );
    const dialog = await openWith(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    for (const slot of ["content", "presets", "preset", "calendar"]) {
      expect(dialog.querySelector(`[data-slot="date-range-picker-${slot}"]`)).not.toBeNull();
    }
    expect(dialog.querySelectorAll('[data-slot="date-range-picker-preset"]')).toHaveLength(4);
    expect(dialog.querySelectorAll(".rdp-month")).toHaveLength(2);
  });

  it("shows the placeholder, and the field's label with it as the trigger's name", () => {
    render(
      <>
        <span id="dates-label">Booth dates</span>
        <DateRangePicker id="dates" aria-labelledby="dates-label" />
      </>,
    );
    const trigger = screen.getByRole("button", { name: "Booth dates Pick a date range" });
    expect(trigger.id).toBe("dates");
    expect(trigger.hasAttribute("data-placeholder")).toBe(true);
  });

  it("formats through formatRange and placeholder", () => {
    render(
      <>
        <DateRangePicker placeholder="When?" />
        <DateRangePicker defaultValue={JUNE} formatRange={(r) => `${r.from?.getDate()}→`} />
      </>,
    );
    expect(screen.getByRole("button", { name: "When?" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "8→" })).toBeTruthy();
  });

  it("writes the range in the locale it is given", () => {
    render(<DateRangePicker defaultValue={JUNE} locale={ja} />);
    expect(screen.getByRole("button").textContent).toBe("6月 8, 2026 – 6月 14, 2026");
  });

  it("is controlled: picking calls onValueChange, the value drives the text", async () => {
    const onValueChange = vi.fn();
    render(<Controlled onValueChange={onValueChange} />);
    const dialog = await openWith(screen.getByRole("button", { name: /Jun 8, 2026/ }));
    fireEvent.click(within(dialog).getByRole("button", { name: /June 20, 2026/ }));
    expect(onValueChange).toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(screen.getByRole("button", { name: "Pick a date range" })).toBeTruthy();
  });

  it("keeps the popover open after the second date, so a range can be redone", async () => {
    const onValueChange = vi.fn();
    render(
      <DateRangePicker onValueChange={onValueChange} calendarProps={{ defaultMonth: JUNE.from }} />,
    );
    const dialog = await openWith(screen.getByRole("button"));
    fireEvent.click(within(dialog).getByRole("button", { name: /June 3, 2026/ }));
    fireEvent.click(within(dialog).getByRole("button", { name: /June 9, 2026/ }));
    const last = onValueChange.mock.lastCall?.[0] as DateRange;
    expect(last.from?.getDate()).toBe(3);
    expect(last.to?.getDate()).toBe(9);
    await flush();
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("sets the range from a preset, marks it pressed and closes", async () => {
    const onOpenChange = vi.fn();
    const onValueChange = vi.fn();
    render(<DateRangePicker onOpenChange={onOpenChange} onValueChange={onValueChange} />);
    const trigger = screen.getByRole("button");
    let dialog = await openWith(trigger);
    const presets = within(dialog).getByRole("group", { name: "Presets" });
    const week = within(presets).getByRole("button", { name: "Last 7 days" });
    expect(week.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(week);
    await flush();
    const today = startOfDay(new Date());
    expect(onValueChange).toHaveBeenLastCalledWith({ from: subDays(today, 6), to: today });
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    dialog = await openWith(trigger);
    expect(
      within(dialog).getByRole("button", { name: "Last 7 days" }).getAttribute("aria-pressed"),
    ).toBe("true");
  });

  it("hides the presets column with presets={[]}", async () => {
    render(<DateRangePicker presets={[]} />);
    const dialog = await openWith(screen.getByRole("button"));
    expect(within(dialog).queryByRole("group")).toBeNull();
  });

  it("opens on ArrowDown, puts focus on the selected day and returns it on Escape", async () => {
    render(<DateRangePicker defaultValue={JUNE} />);
    const trigger = screen.getByRole("button");
    trigger.focus();
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    await flush();
    const dialog = screen.getByRole("dialog");
    await flush();
    expect(dialog.contains(document.activeElement)).toBe(true);
    expect(document.activeElement?.getAttribute("aria-label")).toMatch(/June 8, 2026/);
    fireEvent.keyDown(document.activeElement as Element, { key: "Escape" });
    await flush();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("keeps stock's grid keys in the calendar", async () => {
    render(<DateRangePicker defaultValue={JUNE} />);
    await openWith(screen.getByRole("button"));
    await flush();
    const day = document.activeElement as HTMLElement;
    fireEvent.keyDown(day, { key: "ArrowRight" });
    await flush();
    expect(document.activeElement?.getAttribute("aria-label")).toMatch(/June 9, 2026/);
  });

  it("shows one month under 768 px whatever numberOfMonths says", async () => {
    stubViewport(360);
    render(<DateRangePicker numberOfMonths={2} />);
    const dialog = await openWith(screen.getByRole("button"));
    expect(dialog.querySelectorAll(".rdp-month")).toHaveLength(1);
  });

  it("opens from defaultOpen and reports state on open", async () => {
    render(<DateRangePicker defaultOpen />);
    await flush();
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(
      document.querySelector('[data-slot="date-range-picker"]')?.getAttribute("data-state"),
    ).toBe("open");
  });

  it("posts the two days as yyyy-MM-dd under <name>-from and <name>-to", () => {
    render(
      <form data-testid="form">
        <DateRangePicker name="trip" defaultValue={JUNE} />
        <DateRangePicker name="none" />
      </form>,
    );
    const data = new FormData(screen.getByTestId("form") as HTMLFormElement);
    expect(data.get("trip-from")).toBe("2026-06-08");
    expect(data.get("trip-to")).toBe("2026-06-14");
    expect(data.get("none-from")).toBe("");
    expect(data.get("none-to")).toBe("");
  });

  it("takes a field's aria-invalid and aria-describedby on the trigger", () => {
    render(<DateRangePicker aria-invalid aria-describedby="hint" />);
    const trigger = screen.getByRole("button");
    expect(trigger.getAttribute("aria-invalid")).toBe("true");
    expect(trigger.getAttribute("aria-describedby")).toBe("hint");
  });

  it("names the presets group through labels", async () => {
    render(<DateRangePicker labels={{ presets: "Raccourcis" }} />);
    const dialog = await openWith(screen.getByRole("button"));
    expect(within(dialog).getByRole("group", { name: "Raccourcis" })).toBeTruthy();
  });

  it("does not open when disabled", async () => {
    render(<DateRangePicker disabled />);
    const trigger = screen.getByRole("button");
    fireEvent.click(trigger);
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    await flush();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("drops the popover animation under reduced motion", async () => {
    render(<DateRangePicker defaultOpen />);
    await flush();
    expect(screen.getByRole("dialog").className).toContain("motion-reduce:animate-none!");
  });
});
