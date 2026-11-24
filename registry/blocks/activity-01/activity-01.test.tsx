import { readFileSync } from "node:fs";
import path from "node:path";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { hasUseClientDirective } from "@/lib/registry/client";
import { expectNoA11yViolations, expectVariantsAccessible } from "@/lib/test/axe";
import { stubResizeObserver } from "@/lib/test/resize-observer";
import { activityEvents, activityStats } from "./components/activity-data";
import {
  ActivityFeed,
  formatActivityDay,
  formatActivityTime,
  groupByDay,
  initials,
} from "./components/activity-feed";
import { ActivityStats } from "./components/activity-stats";
import Page from "./page";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const source = (file: string) => readFileSync(path.join(__dirname, file), "utf8");

describe("activity data", () => {
  it("has thirty events over two weeks of October 2026, newest first, with unique ids", () => {
    expect(activityEvents).toHaveLength(30);
    expect(new Set(activityEvents.map((event) => event.id)).size).toBe(30);
    const times = activityEvents.map((event) => event.at);
    expect(times).toEqual([...times].sort().reverse());
    expect(times.at(-1)).toBe("2026-10-12T16:20");
    expect(times[0]).toBe("2026-10-25T21:40");
    expect(new Set(times.map((at) => at.slice(0, 10))).size).toBe(14);
  });

  it("has four stats, each with seven literal points", () => {
    expect(activityStats.map((stat) => stat.label)).toEqual([
      "Chapters read",
      "Reading streak",
      "Comments",
      "Followers",
    ]);
    for (const stat of activityStats) expect(stat.trend).toHaveLength(7);
  });
});

describe("formatting", () => {
  it("formats times and days in en-US, from the literal", () => {
    expect(formatActivityTime("2026-10-12T21:40")).toBe("Oct 12, 2026, 21:40");
    expect(formatActivityDay("2026-10-12")).toBe("Monday, October 12, 2026");
  });

  it("takes initials from the first and last word, or the first two letters", () => {
    expect(initials("Ren Kuroda")).toBe("RK");
    expect(initials("Aiko")).toBe("AI");
  });

  it("groups events under their day in order", () => {
    const groups = groupByDay(activityEvents.slice(0, 4));
    expect(groups.map((group) => group.day)).toEqual(["2026-10-25", "2026-10-24"]);
    expect(groups[0].events).toHaveLength(3);
  });
});

describe("ActivityFeed", () => {
  it("shows ten events under day headings, each with its kind and its time", () => {
    render(<ActivityFeed events={activityEvents} />);
    expect(screen.getAllByRole("heading", { level: 4 })).toHaveLength(10);
    expect(
      screen.getByRole("heading", { level: 3, name: "Sunday, October 25, 2026" }),
    ).toBeTruthy();
    const first = screen.getAllByRole("listitem")[0];
    expect(within(first).getByText("Reading")).toBeTruthy();
    const time = first.querySelector("time") as HTMLTimeElement;
    expect(time.getAttribute("datetime")).toBe("2026-10-25T21:40");
    expect(time.textContent).toBe("Oct 25, 2026, 21:40");
    expect(
      screen.getByRole("heading", { level: 4, name: /Volume 3/ }).querySelector("em"),
    ).toBeTruthy();
  });

  it("filters by kind and announces the count politely", () => {
    render(<ActivityFeed events={activityEvents} />);
    const status = screen.getByRole("status");
    expect(status.textContent).toBe("30 events");
    fireEvent.click(screen.getByRole("button", { name: "Comments" }));
    const comments = activityEvents.filter((event) => event.kind === "comments").length;
    expect(status.textContent).toBe(`${comments} events`);
    expect(screen.getAllByRole("heading", { level: 4 })).toHaveLength(Math.min(comments, 10));
    // Pressing the pressed button keeps it: the filter never empties.
    fireEvent.click(screen.getByRole("button", { name: "Comments" }));
    expect(status.textContent).toBe(`${comments} events`);
    fireEvent.click(screen.getByRole("button", { name: "All" }));
    expect(status.textContent).toBe("30 events");
  });

  it("appends ten with Show more, focuses the first new heading, and leaves at the end", () => {
    render(<ActivityFeed events={activityEvents} />);
    fireEvent.click(screen.getByRole("button", { name: "Show more" }));
    const headings = screen.getAllByRole("heading", { level: 4 });
    expect(headings).toHaveLength(20);
    expect(document.activeElement).toBe(headings[10]);
    expect(headings[10].getAttribute("tabindex")).toBe("-1");
    fireEvent.click(screen.getByRole("button", { name: "Show more" }));
    expect(screen.getAllByRole("heading", { level: 4 })).toHaveLength(30);
    expect(screen.queryByRole("button", { name: "Show more" })).toBeNull();
  });

  it("puts no tab stop in the timeline", () => {
    const { container } = render(<ActivityFeed events={activityEvents} />);
    const timeline = container.querySelector('[data-slot="timeline"]') as HTMLElement;
    expect(timeline.querySelectorAll("a, button, input, [tabindex='0']")).toHaveLength(0);
  });
});

describe("ActivityStats", () => {
  it("names each instance by its own heading, with no fixed id", () => {
    render(
      <>
        <ActivityStats stats={activityStats} title="This week" />
        <ActivityStats stats={activityStats} title="Last week" />
      </>,
    );
    const regions = ["This week", "Last week"].map((name) => screen.getByRole("region", { name }));
    const ids = regions.map((region) => region.getAttribute("aria-labelledby"));
    expect(new Set(ids).size).toBe(2);
    expect(ids).not.toContain("activity-stats-title");
    for (const [index, region] of regions.entries()) {
      expect(within(region).getByRole("heading", { level: 2 }).id).toBe(ids[index]);
    }
  });
});

describe("Page", () => {
  it("has one h1, Activity, and its sections named by their headings", () => {
    stubResizeObserver();
    render(<Page />);
    const h1 = screen.getAllByRole("heading", { level: 1 });
    expect(h1.map((heading) => heading.textContent)).toEqual(["Activity"]);
    expect(screen.getByRole("region", { name: "Overview" })).toBeTruthy();
    expect(screen.getByRole("region", { name: "Recent activity" })).toBeTruthy();
  });

  // React's ids count up across renders; the clock is what must not change the markup.
  const markup = (html: string) => html.replace(/_r_[0-9a-z]+_/g, "_r_");

  it("reads no clock in render: the same markup on two different days", () => {
    stubResizeObserver();
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 0, 1, 9, 0));
    const first = markup(render(<Page />).container.innerHTML);
    cleanup();
    vi.setSystemTime(new Date(2031, 6, 15, 23, 30));
    const second = markup(render(<Page />).container.innerHTML);
    expect(second).toBe(first);
  });

  it("passes axe", async () => {
    stubResizeObserver();
    await act(async () => {
      await expectNoA11yViolations(<Page />);
    });
  });
});

describe("activity-01 files", () => {
  it("keeps the page and the stats server components; the feed holds state", () => {
    expect(hasUseClientDirective(source("page.tsx"))).toBe(false);
    expect(hasUseClientDirective(source("components/activity-stats.tsx"))).toBe(false);
    expect(hasUseClientDirective(source("components/activity-feed.tsx"))).toBe(true);
  });

  it("reads no clock and no randomness", () => {
    for (const file of [
      "page.tsx",
      "components/activity-stats.tsx",
      "components/activity-feed.tsx",
      "components/activity-data.ts",
    ]) {
      expect(source(file)).not.toMatch(/Date\.now|new Date\(\)|Math\.random|randomUUID/);
    }
  });
});

describe("variants", () => {
  expectVariantsAccessible(import.meta.glob("./variants/*.tsx"), { setup: stubResizeObserver });
});
