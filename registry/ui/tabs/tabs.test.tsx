import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { expectNoA11yViolations } from "@/lib/test/axe";
import { stubResizeObserver } from "@/lib/test/resize-observer";
import TabsDefaultDemo from "./demos/default";
import { Tabs, TabsContent, TabsList, TabsTrigger, tabsListVariants } from "./tabs";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function Story({ variant }: { variant?: "default" | "line" }) {
  return (
    <Tabs defaultValue="story" className="custom-class">
      <TabsList variant={variant}>
        <TabsTrigger value="story">Story</TabsTrigger>
        <TabsTrigger value="art">Art</TabsTrigger>
        <TabsTrigger value="letters">Letters</TabsTrigger>
      </TabsList>
      <TabsContent value="story">Story panel</TabsContent>
      <TabsContent value="art">Art panel</TabsContent>
      <TabsContent value="letters">Letters panel</TabsContent>
    </Tabs>
  );
}

const framesOf = (element: Element | null) => [
  ...(element?.querySelectorAll<HTMLElement>(':scope > [data-slot="ink-frame"]') ?? []),
];

describe("Tabs", () => {
  it("renders stock roles, slots and a forwarded className", () => {
    render(<Story />);
    const list = screen.getByRole("tablist");
    expect(list.getAttribute("data-slot")).toBe("tabs-list");
    expect(list.getAttribute("data-variant")).toBe("default");
    expect(list.parentElement?.classList.contains("custom-class")).toBe(true);
    expect(list.parentElement?.getAttribute("data-slot")).toBe("tabs");
    const story = screen.getByRole("tab", { name: "Story" });
    expect(story.getAttribute("data-slot")).toBe("tabs-trigger");
    expect(story.getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("tabpanel").getAttribute("data-slot")).toBe("tabs-content");
  });

  it("replaces the pill with a hand-drawn rule and outlines the active tab on three sides", () => {
    render(<Story />);
    const list = screen.getByRole("tablist");
    expect(tabsListVariants()).not.toContain("bg-muted");
    const [rule] = framesOf(list);
    expect(rule?.getAttribute("data-shape")).toBe("line");
    const [box, underline] = framesOf(screen.getByRole("tab", { name: "Story" }));
    expect(box?.getAttribute("data-fill")).toBe("paper");
    expect(box?.className).toContain(
      "group-data-[variant=default]/tabs-list:group-data-active/tabs-trigger:block",
    );
    expect(box?.className).toMatch(/\[clip-path:inset\(/);
    expect(underline?.getAttribute("data-shape")).toBe("line");
  });

  it("draws only the active underline in the line variant", () => {
    render(<Story variant="line" />);
    expect(framesOf(screen.getByRole("tablist"))).toHaveLength(0);
    const [, underline] = framesOf(screen.getByRole("tab", { name: "Story" }));
    expect(underline?.className).toContain(
      "group-data-[variant=line]/tabs-list:group-data-active/tabs-trigger:block",
    );
  });

  it("has no CSS borders or shadows on triggers", () => {
    render(<Story />);
    for (const name of screen.getByRole("tab", { name: "Art" }).classList) {
      expect(name, name).not.toMatch(/(^|:)border(-transparent|-input|-ring)?$|shadow-sm|after:/);
    }
  });

  it("moves between tabs with the arrow keys and selects with Enter, like stock", async () => {
    render(<Story />);
    const [story, art] = screen.getAllByRole("tab");
    act(() => story.focus());
    fireEvent.keyDown(story, { key: "ArrowRight" });
    await act(async () => {});
    expect(document.activeElement).toBe(art);
    fireEvent.keyDown(art, { key: "Enter" });
    fireEvent.click(art);
    await act(async () => {});
    expect(art.getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("tabpanel").textContent).toBe("Art panel");
  });

  it("draws the rule and the active tab once measured", () => {
    const observers = stubResizeObserver();
    render(<Story />);
    observers.drawAll(120, 32);
    expect(framesOf(screen.getByRole("tablist"))[0]?.dataset.inked).toBe("true");
    expect(framesOf(screen.getByRole("tab", { name: "Story" }))[0]?.dataset.inked).toBe("true");
  });

  it("has no axe violations in its default demo", async () => {
    await expectNoA11yViolations(<TabsDefaultDemo />);
  });
});
