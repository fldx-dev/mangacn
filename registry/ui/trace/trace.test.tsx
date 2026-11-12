import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { expectDemosAccessible } from "@/lib/test/axe";
import {
  Trace,
  TraceCollapsible,
  TraceCollapsibleContent,
  TraceCollapsibleTrigger,
  TraceDescription,
  TraceIcon,
  TraceLine,
  TraceTitle,
} from "./trace";

afterEach(() => {
  cleanup();
});

/** The dot's box (a span holding the drawn ellipse), and the frame inside it. */
const dotFrameOf = (line: HTMLElement) =>
  line.querySelector<HTMLElement>(':scope > span > [data-slot="ink-frame"][data-shape="ellipse"]');
const dotOf = (line: HTMLElement) => dotFrameOf(line)?.parentElement;

describe("Trace", () => {
  it("renders stock slots with a forwarded className", () => {
    render(
      <Trace data-testid="trace" className="custom-class">
        <TraceLine data-testid="line">
          <TraceIcon data-testid="icon">i</TraceIcon>
          <TraceTitle data-testid="title">Read the script</TraceTitle>
          <TraceDescription data-testid="description">0.4 s</TraceDescription>
        </TraceLine>
      </Trace>,
    );
    const trace = screen.getByTestId("trace");
    expect(trace.getAttribute("data-slot")).toBe("trace");
    expect(trace.classList.contains("custom-class")).toBe(true);
    const slots = {
      line: "trace-line",
      icon: "trace-icon",
      title: "trace-title",
      description: "trace-description",
    };
    for (const [id, slot] of Object.entries(slots)) {
      expect(screen.getByTestId(id).getAttribute("data-slot"), id).toBe(slot);
    }
    expect(screen.getByTestId("icon").getAttribute("aria-hidden")).toBe("true");
  });

  it("draws one ink line down the side, behind the steps", () => {
    render(<Trace data-testid="trace" />);
    const trace = screen.getByTestId("trace");
    const line = trace.firstElementChild as HTMLElement;
    expect(line.getAttribute("data-slot")).toBe("ink-frame");
    expect(line.getAttribute("data-shape")).toBe("line");
    expect(line.getAttribute("aria-hidden")).toBe("true");
    expect(line.classList.contains("absolute")).toBe(true);
  });

  it("draws a dot per step: ink when done, pulsing when running, spot on error, paper pending", () => {
    render(
      <Trace>
        <TraceLine data-testid="done">Done</TraceLine>
        <TraceLine data-testid="running" status="running">
          Running
        </TraceLine>
        <TraceLine data-testid="error" status="error">
          Error
        </TraceLine>
        <TraceLine data-testid="pending" status="pending">
          Pending
        </TraceLine>
      </Trace>,
    );
    const dot = (id: string) => dotOf(screen.getByTestId(id));
    const fill = (id: string) => dotFrameOf(screen.getByTestId(id))?.getAttribute("data-fill");
    expect(fill("done")).toBe("ink");
    expect(fill("running")).toBe("ink");
    expect(fill("error")).toBe("ink");
    expect(fill("pending")).toBe("paper");
    expect(dot("done")?.getAttribute("aria-hidden")).toBe("true");
    expect(dot("done")?.classList.contains("size-3")).toBe(true);
    expect(dot("running")?.classList.contains("motion-safe:animate-pulse")).toBe(true);
    expect(dot("done")?.className).not.toContain("animate-pulse");
    expect(dot("error")?.className).toContain("[--ink:var(--spot)]");
    // The step's text never pulses: faded text fails contrast.
    expect(screen.getByTestId("running").className).not.toContain("animate-pulse");
    expect(screen.getByTestId("running").getAttribute("data-status")).toBe("running");
  });

  it("keeps pending and descriptions at full opacity, so they pass contrast", () => {
    render(
      <TraceLine data-testid="pending" status="pending">
        <TraceTitle>Later</TraceTitle>
        <TraceDescription data-testid="description">1 s</TraceDescription>
      </TraceLine>,
    );
    expect(screen.getByTestId("pending").className).not.toContain("opacity");
    expect(screen.getByTestId("description").className).not.toContain("/70");
    expect(screen.getByTestId("pending").className).not.toContain("shimmer");
  });

  it("opens a collapsible step and shows its details beside the line", () => {
    render(
      <Trace>
        <TraceCollapsible data-testid="collapsible">
          <TraceCollapsibleTrigger>
            <TraceLine>
              <TraceTitle>Searched</TraceTitle>
            </TraceLine>
          </TraceCollapsibleTrigger>
          <TraceCollapsibleContent>Two hits</TraceCollapsibleContent>
        </TraceCollapsible>
      </Trace>,
    );
    expect(screen.getByTestId("collapsible").getAttribute("data-slot")).toBe("trace-collapsible");
    const trigger = screen.getByRole("button", { name: "Searched" });
    expect(trigger.getAttribute("data-slot")).toBe("trace-collapsible-trigger");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    const inner = screen.getByText("Two hits");
    expect(inner.getAttribute("data-slot")).toBe("trace-collapsible-content-inner");
    expect(inner.closest('[data-slot="trace-collapsible-content"]')).not.toBeNull();
    expect(inner.classList.contains("border-l")).toBe(false);
  });

  expectDemosAccessible(import.meta.glob("./demos/*.tsx"));
});
