import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { expectDemosAccessible } from "@/lib/test/axe";
import { stubResizeObserver } from "@/lib/test/resize-observer";
import { Button } from "@/registry/ui/button/button";
import { Input } from "@/registry/ui/input/input";
import {
  ButtonGroup,
  ButtonGroupSeparator,
  ButtonGroupText,
  buttonGroupVariants,
} from "./button-group";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

/** The classes by which mangacn's input, textarea and button turn their frame off in a group. */
const GROUPED_OFF = ["in-data-grouped:hidden", "in-data-grouped:[&>svg]:hidden"];

/** The outlines a group shows: every ink frame but rules and the frames the grouped read hides. */
const outlines = (root: HTMLElement) =>
  [...root.querySelectorAll<HTMLElement>('[data-slot="ink-frame"]')].filter(
    (frame) =>
      frame.dataset.shape !== "line" && !GROUPED_OFF.some((name) => frame.classList.contains(name)),
  );

/** The rules the group draws between its children (its own line frames). */
const rules = (group: HTMLElement) =>
  [...group.querySelectorAll<HTMLElement>(':scope > [data-slot="ink-frame"]')].filter(
    (frame) => frame.dataset.shape === "line",
  );

describe("ButtonGroup", () => {
  it("renders stock slots, role and orientation with a forwarded className", () => {
    render(
      <ButtonGroup aria-label="Pages" orientation="vertical" className="custom-class">
        <Button variant="outline">One</Button>
        <ButtonGroupText>of 24</ButtonGroupText>
      </ButtonGroup>,
    );
    const group = screen.getByRole("group", { name: "Pages" });
    expect(group.getAttribute("data-slot")).toBe("button-group");
    expect(group.getAttribute("data-orientation")).toBe("vertical");
    expect(group.classList.contains("custom-class")).toBe(true);
    expect(group.classList.contains("flex-col")).toBe(true);
    expect(screen.getByText("of 24").getAttribute("data-slot")).toBe("button-group-text");
  });

  it("draws exactly one ink frame around its buttons and an input", () => {
    render(
      <ButtonGroup aria-label="Search">
        <Button variant="outline">Series</Button>
        <Input aria-label="Terms" />
        <Button>Go</Button>
      </ButtonGroup>,
    );
    const group = screen.getByRole("group", { name: "Search" });
    expect(group.hasAttribute("data-grouped")).toBe(true);
    const frames = outlines(group);
    expect(frames).toHaveLength(1);
    expect(frames[0]).toBe(group.firstElementChild);
    expect(frames[0]?.getAttribute("data-fill")).toBe("paper");
    for (const button of screen.getAllByRole("button")) {
      const frame = button.querySelector(':scope > [data-slot="ink-frame"]');
      expect(frame?.classList.contains("in-data-grouped:hidden")).toBe(true);
    }
  });

  it("draws a hand-drawn rule between neighbours, along the orientation", () => {
    const { rerender } = render(
      <ButtonGroup aria-label="Nav">
        <Button variant="outline">Prev</Button>
        <Button variant="outline">Ch. 12</Button>
        <Button variant="outline">Next</Button>
      </ButtonGroup>,
    );
    const group = screen.getByRole("group", { name: "Nav" });
    let lines = rules(group);
    expect(lines).toHaveLength(2);
    for (const rule of lines) {
      expect(rule.classList.contains("w-(--outline-width)")).toBe(true);
      expect(rule.nextElementSibling?.getAttribute("data-slot")).toBe("button");
    }
    rerender(
      <ButtonGroup aria-label="Nav" orientation="vertical">
        <Button variant="outline">Prev</Button>
        <Button variant="outline">Next</Button>
      </ButtonGroup>,
    );
    lines = rules(group);
    expect(lines).toHaveLength(1);
    expect(lines[0]?.classList.contains("h-(--outline-width)")).toBe(true);
  });

  it("draws no rule beside an explicit separator", () => {
    render(
      <ButtonGroup aria-label="Split">
        <Button variant="secondary">Read</Button>
        <ButtonGroupSeparator />
        <Button variant="secondary">More</Button>
      </ButtonGroup>,
    );
    const group = screen.getByRole("group", { name: "Split" });
    expect(rules(group)).toHaveLength(0);
    const separator = group.querySelector('[data-slot="button-group-separator"]');
    expect(separator?.getAttribute("aria-orientation")).toBe("vertical");
  });

  it("leaves a group of groups to its nested strips", () => {
    render(
      <ButtonGroup aria-label="Toolbar">
        <ButtonGroup aria-label="History">
          <Button variant="outline">Undo</Button>
          <Button variant="outline">Redo</Button>
        </ButtonGroup>
        <ButtonGroup aria-label="Share">
          <Button variant="outline">Share</Button>
        </ButtonGroup>
      </ButtonGroup>,
    );
    const outer = screen.getByRole("group", { name: "Toolbar" });
    expect(outer.hasAttribute("data-grouped")).toBe(false);
    expect(outer.querySelector(':scope > [data-slot="ink-frame"]')).toBeNull();
    for (const name of ["History", "Share"]) {
      const inner = screen.getByRole("group", { name });
      expect(inner.hasAttribute("data-grouped")).toBe(true);
      expect(outlines(inner)).toHaveLength(1);
    }
  });

  it("turns a select trigger's frame off and keeps stock's corner selectors past the frame", () => {
    const horizontal = buttonGroupVariants({ orientation: "horizontal" });
    expect(horizontal).toContain("[&>[data-slot=select-trigger]>[data-slot=ink-frame]]:hidden");
    expect(horizontal).toContain(
      "[&>[data-slot]:not([data-slot=ink-frame])~[data-slot]]:rounded-l-none",
    );
    expect(buttonGroupVariants({ orientation: "vertical" })).toContain(
      "[&>[data-slot]:not([data-slot=ink-frame])~[data-slot]]:rounded-t-none",
    );
  });

  it("draws the strip and its rules once measured", () => {
    const observers = stubResizeObserver();
    render(
      <ButtonGroup aria-label="Nav">
        <Button variant="outline">Prev</Button>
        <Button variant="outline">Next</Button>
      </ButtonGroup>,
    );
    observers.drawAll(160, 32);
    const group = screen.getByRole("group", { name: "Nav" });
    expect((group.firstElementChild as HTMLElement).dataset.inked).toBe("true");
    expect(rules(group)[0]?.dataset.inked).toBe("true");
  });

  expectDemosAccessible(import.meta.glob("./demos/*.tsx"));
});
