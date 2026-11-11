import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { expectDemosAccessible } from "@/lib/test/axe";
import { stubResizeObserver } from "@/lib/test/resize-observer";
import WithLabelDemo from "./demos/with-label";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "./input-group";

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

function Search() {
  return (
    <InputGroup className="custom-class" aria-label="Search">
      <InputGroupInput aria-label="Query" />
      <InputGroupAddon>
        <InputGroupText>https://</InputGroupText>
      </InputGroupAddon>
      <InputGroupAddon align="inline-end">
        <InputGroupButton variant="default">Go</InputGroupButton>
        <InputGroupButton variant="outline">Clear</InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}

describe("InputGroup", () => {
  it("renders stock slots and roles with a forwarded className", () => {
    render(<Search />);
    const group = screen.getByRole("group", { name: "Search" });
    expect(group.getAttribute("data-slot")).toBe("input-group");
    expect(group.classList.contains("custom-class")).toBe(true);
    expect(screen.getByRole("textbox").getAttribute("data-slot")).toBe("input-group-control");
    const addons = group.querySelectorAll('[data-slot="input-group-addon"]');
    expect([...addons].map((addon) => addon.getAttribute("data-align"))).toEqual([
      "inline-start",
      "inline-end",
    ]);
    for (const addon of addons) expect(addon.getAttribute("role")).toBe("group");
    const go = screen.getByRole("button", { name: "Go" });
    expect(go.getAttribute("data-slot")).toBe("button");
    expect(go.getAttribute("data-size")).toBe("xs");
    expect(go.getAttribute("type")).toBe("button");
  });

  it("draws exactly one ink frame around an input, its addons and their buttons", () => {
    render(<Search />);
    const group = screen.getByRole("group", { name: "Search" });
    expect(group.hasAttribute("data-grouped")).toBe(true);
    const frames = outlines(group);
    expect(frames).toHaveLength(1);
    expect(frames[0]).toBe(group.firstElementChild);
    expect(frames[0]?.getAttribute("data-fill")).toBe("paper");
    // The children keep their frames in the DOM; the grouped read turns them off.
    const inputFrame = screen.getByRole("textbox").parentElement;
    expect(inputFrame?.classList.contains("in-data-grouped:[&>svg]:hidden")).toBe(true);
    expect(inputFrame?.classList.contains("in-data-grouped:border-0")).toBe(true);
  });

  it("draws exactly one ink frame around a textarea", () => {
    render(
      <InputGroup aria-label="Letter">
        <InputGroupTextarea aria-label="Body" />
        <InputGroupAddon align="block-end">
          <InputGroupButton variant="default">Send</InputGroupButton>
        </InputGroupAddon>
      </InputGroup>,
    );
    const group = screen.getByRole("group", { name: "Letter" });
    expect(screen.getByRole("textbox").getAttribute("data-slot")).toBe("input-group-control");
    expect(outlines(group)).toHaveLength(1);
    expect(group.className).toContain("has-[>[data-slot=ink-frame]>textarea]:h-auto");
  });

  it("separates each addon from the control with a hand-drawn rule on the facing side", () => {
    render(
      <InputGroup aria-label="Rules">
        <InputGroupAddon>a</InputGroupAddon>
        <InputGroupAddon align="inline-end">b</InputGroupAddon>
        <InputGroupAddon align="block-start">c</InputGroupAddon>
        <InputGroupAddon align="block-end">d</InputGroupAddon>
      </InputGroup>,
    );
    const rules = [
      ...screen
        .getByRole("group", { name: "Rules" })
        .querySelectorAll<HTMLElement>('[data-slot="input-group-addon"] > [data-shape="line"]'),
    ];
    expect(rules.map((rule) => rule.className.match(/(right|left|bottom|top)-0/)?.[1])).toEqual([
      "right",
      "left",
      "bottom",
      "top",
    ]);
  });

  it("rings the group, not the control, on focus and when invalid", () => {
    render(
      <InputGroup aria-label="Ring">
        <InputGroupInput aria-label="Query" aria-invalid />
      </InputGroup>,
    );
    const group = screen.getByRole("group", { name: "Ring" });
    for (const name of [
      "has-[[data-slot=input-group-control]:focus-visible]:ring-3",
      "has-[[data-slot][aria-invalid=true]]:[--ink:var(--destructive)]",
      "border-0",
    ]) {
      expect(group.classList.contains(name), name).toBe(true);
    }
    const input = screen.getByRole("textbox");
    expect(input.classList.contains("focus-visible:ring-0")).toBe(true);
    expect(input.classList.contains("aria-invalid:ring-0")).toBe(true);
  });

  it("focuses the input when an addon is clicked, but not through its button", () => {
    render(<Search />);
    const input = screen.getByRole("textbox");
    fireEvent.click(screen.getByText("https://"));
    expect(document.activeElement).toBe(input);
    input.blur();
    fireEvent.click(screen.getByRole("button", { name: "Go" }));
    expect(document.activeElement).not.toBe(input);
  });

  it("draws the group's frame and its rules once measured", () => {
    const observers = stubResizeObserver();
    render(<Search />);
    observers.drawAll(240, 32);
    const group = screen.getByRole("group", { name: "Search" });
    expect((group.firstElementChild as HTMLElement).dataset.inked).toBe("true");
    for (const rule of group.querySelectorAll<HTMLElement>('[data-shape="line"]')) {
      expect(rule.dataset.inked).toBe("true");
    }
  });

  it("names its input from a visible label", () => {
    render(<WithLabelDemo />);
    const input = screen.getByRole("textbox", { name: "Artist handle" });
    expect(input.closest('[data-slot="input-group"]')).toBeTruthy();
  });

  expectDemosAccessible(import.meta.glob("./demos/*.tsx"));
});
