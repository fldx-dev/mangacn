import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "@/lib/test/axe";
import { stubResizeObserver } from "@/lib/test/resize-observer";
import { AgentStrip } from "./agent-strip";

beforeEach(() => {
  stubResizeObserver();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("AgentStrip", () => {
  it("is a standing note, not a live alert, titled in the display face", () => {
    const { container } = render(<AgentStrip />);
    const alert = container.querySelector('[data-slot="alert"]');
    expect(alert?.getAttribute("role")).toBe("note");
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByRole("heading", { level: 2, name: "Agent-ready" }).className).toContain(
      "font-display",
    );
  });

  it("lists the four chips as badges", () => {
    render(<AgentStrip />);
    const chips = within(screen.getByRole("list", { name: "Agent features" })).getAllByRole(
      "listitem",
    );
    expect(chips.map((chip) => chip.textContent)).toEqual([
      "/llms.txt",
      "/docs/*.md",
      "copy prompt",
      "MCP · soon",
    ]);
    for (const chip of chips) expect(chip.querySelector('[data-slot="badge"]')).not.toBeNull();
  });

  it("has no axe violations", async () => {
    const { container } = render(<AgentStrip />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
