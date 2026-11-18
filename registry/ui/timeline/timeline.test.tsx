import { readFileSync } from "node:fs";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { expectDemosAccessible } from "@/lib/test/axe";
import {
  Timeline,
  TimelineContent,
  TimelineDescription,
  TimelineIndicator,
  TimelineItem,
  TimelineTime,
  TimelineTitle,
} from "./timeline";

afterEach(cleanup);

function Example({ align }: { align?: "start" | "alternate" }) {
  return (
    <Timeline aria-label="History" align={align}>
      <TimelineItem>
        <TimelineIndicator />
        <TimelineContent>
          <TimelineTime dateTime="2024-04-12">April 2024</TimelineTime>
          <TimelineTitle>One-shot</TimelineTitle>
          <TimelineDescription>Forty pages.</TimelineDescription>
        </TimelineContent>
      </TimelineItem>
      <TimelineItem status="current" labels={{ current: "en cours" }}>
        <TimelineIndicator />
        <TimelineContent>
          <TimelineTitle>Serialisation</TimelineTitle>
        </TimelineContent>
      </TimelineItem>
      <TimelineItem status="upcoming">
        <TimelineIndicator />
        <TimelineContent>
          <TimelineTitle>Anime</TimelineTitle>
        </TimelineContent>
      </TimelineItem>
    </Timeline>
  );
}

describe("Timeline", () => {
  expectDemosAccessible(import.meta.glob("./demos/*.tsx"));

  it("is a server component", () => {
    const source = readFileSync("registry/ui/timeline/timeline.tsx", "utf8");
    expect(source).not.toMatch(/^["']use client["']/m);
  });

  it("renders an ordered list with a slot on every part", () => {
    const { container } = render(<Example />);
    const list = screen.getByRole("list", { name: "History" });
    expect(list.tagName).toBe("OL");
    expect(list.dataset.slot).toBe("timeline");
    expect(list.dataset.align).toBe("start");
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    for (const slot of [
      "timeline-item",
      "timeline-indicator",
      "timeline-content",
      "timeline-title",
      "timeline-time",
      "timeline-description",
    ]) {
      expect(container.querySelector(`[data-slot="${slot}"]`)).not.toBeNull();
    }
  });

  it("renders the time as <time dateTime>", () => {
    render(<Example />);
    const time = screen.getByText("April 2024");
    expect(time.tagName).toBe("TIME");
    expect(time.getAttribute("datetime")).toBe("2024-04-12");
  });

  it("marks status, the current item and hides the indicator", () => {
    render(<Example />);
    const items = screen.getAllByRole("listitem");
    expect(items.map((item) => item.dataset.status)).toEqual(["done", "current", "upcoming"]);
    expect(items[0].hasAttribute("aria-current")).toBe(false);
    expect(items[1].getAttribute("aria-current")).toBe("true");
    for (const indicator of document.querySelectorAll('[data-slot="timeline-indicator"]')) {
      expect(indicator.getAttribute("aria-hidden")).toBe("true");
    }
  });

  it("says current in screen-reader text, overridable by labels", () => {
    render(
      <Timeline>
        <TimelineItem status="current">
          <TimelineTitle>Now</TimelineTitle>
        </TimelineItem>
      </Timeline>,
    );
    expect(screen.getByText("current").className).toContain("sr-only");
    cleanup();
    render(<Example />);
    expect(screen.getByText("en cours").className).toContain("sr-only");
    expect(screen.queryByText("current")).toBeNull();
  });

  it("alternates sides only from 768 px", () => {
    render(<Example align="alternate" />);
    expect(screen.getByRole("list").dataset.align).toBe("alternate");
    const item = screen.getAllByRole("listitem")[0];
    expect(item.className).toContain("md:group-data-[align=alternate]/timeline:grid-cols-");
    expect(item.className).toContain("grid-cols-[auto_minmax(0,1fr)]");
  });

  it("forwards className", () => {
    render(<Timeline aria-label="X" className="extra" />);
    expect(screen.getByRole("list").className).toContain("extra");
  });
});
