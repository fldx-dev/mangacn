import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { expectNoA11yViolations } from "@/lib/test/axe";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./collapsible";
import CollapsibleCardDemo from "./demos/card";
import CollapsibleDefaultDemo from "./demos/default";
import CollapsibleGlyphDemo from "./demos/glyph";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("Collapsible", () => {
  it("keeps stock behaviour and data-slots", () => {
    render(
      <Collapsible data-testid="root">
        <CollapsibleTrigger>Notes</CollapsibleTrigger>
        <CollapsibleContent>Page 7: speed lines.</CollapsibleContent>
      </Collapsible>,
    );
    expect(screen.getByTestId("root").getAttribute("data-slot")).toBe("collapsible");
    const trigger = screen.getByRole("button", { name: "Notes" });
    expect(trigger.getAttribute("data-slot")).toBe("collapsible-trigger");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByText("Page 7: speed lines.")).toBeNull();
    fireEvent.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    const panel = screen.getByText("Page 7: speed lines.");
    expect(panel.getAttribute("data-slot")).toBe("collapsible-content");
    expect(trigger.getAttribute("aria-controls")).toBe(panel.id);
  });

  it("leaves the default trigger as stock: no classes, no glyph", () => {
    render(
      <Collapsible>
        <CollapsibleTrigger className="custom-class">Notes</CollapsibleTrigger>
      </Collapsible>,
    );
    const trigger = screen.getByRole("button", { name: "Notes" });
    expect(trigger.className).toBe("custom-class");
    expect(trigger.querySelector("svg")).toBeNull();
  });

  it("adds accordion's + / − glyph with variant glyph, flipped by aria-expanded", () => {
    render(
      <Collapsible>
        <CollapsibleTrigger variant="glyph" className="custom-class">
          Credits
        </CollapsibleTrigger>
        <CollapsibleContent>Letters: Sam Ito</CollapsibleContent>
      </Collapsible>,
    );
    const trigger = screen.getByRole("button", { name: "Credits" });
    for (const name of ["group/collapsible-trigger", "focus-visible:ring-3", "custom-class"]) {
      expect(trigger.classList.contains(name), name).toBe(true);
    }
    const [plus, minus] = trigger.querySelectorAll("svg");
    expect(plus.classList.contains("lucide-plus")).toBe(true);
    expect(plus.classList.contains("group-aria-expanded/collapsible-trigger:hidden")).toBe(true);
    expect(minus.classList.contains("lucide-minus")).toBe(true);
    expect(minus.classList.contains("hidden")).toBe(true);
    expect(minus.classList.contains("group-aria-expanded/collapsible-trigger:inline")).toBe(true);
    for (const glyph of [plus, minus]) expect(glyph.getAttribute("aria-hidden")).toBe("true");
    fireEvent.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByText("Letters: Sam Ito")).toBeTruthy();
  });

  it("opens the glyph demo's first panel and the card demo's credits by default", () => {
    render(<CollapsibleGlyphDemo />);
    expect(screen.getByRole("button", { name: "Reading order" }).ariaExpanded).toBe("true");
    expect(screen.getByRole("button", { name: "Sound effects" }).ariaExpanded).toBe("false");
    cleanup();
    render(<CollapsibleCardDemo />);
    expect(screen.getByRole("button", { name: "Credits" }).ariaExpanded).toBe("true");
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });

  it("toggles through a registry button in the default demo", () => {
    render(<CollapsibleDefaultDemo />);
    const trigger = screen.getByRole("button", { name: "Show all" });
    expect(trigger.getAttribute("data-slot")).toBe("collapsible-trigger");
    expect(trigger.querySelector(':scope > [data-slot="ink-frame"]')).not.toBeNull();
    fireEvent.click(trigger);
    expect(screen.getByText("Page 11: tone the night sky.")).toBeTruthy();
  });

  it("has no axe violations in its demos", async () => {
    await expectNoA11yViolations(<CollapsibleDefaultDemo />);
    await expectNoA11yViolations(<CollapsibleGlyphDemo />);
    await expectNoA11yViolations(<CollapsibleCardDemo />);
  });
});
