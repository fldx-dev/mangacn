import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { expectDemosAccessible } from "@/lib/test/axe";
import { type TreeNode, TreeView, type TreeViewProps } from "./tree-view";

afterEach(cleanup);

const items: TreeNode[] = [
  {
    id: "a",
    label: "Alpha",
    children: [
      { id: "a1", label: "Apple" },
      { id: "a2", label: "Banana", children: [{ id: "a2x", label: "Berry" }] },
    ],
  },
  { id: "b", label: "Bravo", children: [{ id: "b1", label: "Bolt" }] },
  { id: "c", label: "Charlie", disabled: true },
];

function renderTree(props: Partial<TreeViewProps> = {}) {
  return render(<TreeView items={items} aria-label="Files" {...props} />);
}

function Controlled() {
  const [expanded, setExpanded] = React.useState<string[]>([]);
  return (
    <TreeView
      items={items}
      aria-label="Files"
      expanded={expanded}
      onExpandedChange={setExpanded}
      selected="b"
    />
  );
}

const item = (name: string) => screen.getByRole("treeitem", { name });
const focusedName = () => document.activeElement?.textContent;

function press(key: string) {
  const target = document.activeElement;
  if (!target) throw new Error("nothing focused");
  act(() => {
    fireEvent.keyDown(target, { key });
  });
}

describe("TreeView", () => {
  expectDemosAccessible(import.meta.glob("./demos/*.tsx"));

  it("is an APG tree with data-slots, levels, set sizes and positions", () => {
    renderTree({ defaultExpanded: ["a"], className: "custom" });
    const tree = screen.getByRole("tree", { name: "Files" });
    expect(tree.dataset.slot).toBe("tree-view");
    expect(tree.classList.contains("custom")).toBe(true);
    const alpha = item("Alpha");
    expect(alpha.dataset.slot).toBe("tree-view-item");
    expect(alpha.getAttribute("aria-level")).toBe("1");
    expect(alpha.getAttribute("aria-setsize")).toBe("3");
    expect(alpha.getAttribute("aria-posinset")).toBe("1");
    expect(alpha.getAttribute("aria-expanded")).toBe("true");
    expect(alpha.dataset.state).toBe("open");
    expect(item("Bravo").getAttribute("aria-expanded")).toBe("false");
    expect(item("Bravo").dataset.state).toBe("closed");
    const banana = item("Banana");
    expect(banana.getAttribute("aria-level")).toBe("2");
    expect(banana.getAttribute("aria-setsize")).toBe("2");
    expect(banana.getAttribute("aria-posinset")).toBe("2");
    expect(item("Apple").hasAttribute("aria-expanded")).toBe(false);
    // The open parent owns the group that follows it; its own text is its label alone.
    const group = document.getElementById(alpha.getAttribute("aria-owns") ?? "");
    expect(group?.dataset.slot).toBe("tree-view-group");
    expect(alpha.textContent).toBe("Alpha");
    expect(item("Bravo").hasAttribute("aria-owns")).toBe(false);
    expect(group?.getAttribute("role")).toBe("group");
    expect(alpha.querySelector('[data-slot="tree-view-toggle"]')?.getAttribute("aria-hidden")).toBe(
      "true",
    );
    expect(alpha.querySelector('[data-slot="tree-view-label"]')?.getAttribute("title")).toBe(
      "Alpha",
    );
    expect(item("Charlie").getAttribute("aria-disabled")).toBe("true");
    // Closed parents render no group.
    expect(screen.queryByRole("treeitem", { name: "Bolt" })).toBeNull();
  });

  it("has one tab stop: the selected item, else the first", () => {
    const { unmount } = renderTree();
    const stops = screen.getAllByRole("treeitem").filter((node) => node.tabIndex === 0);
    expect(stops).toEqual([item("Alpha")]);
    unmount();
    renderTree({ defaultExpanded: ["a"], defaultSelected: "a1" });
    expect(screen.getAllByRole("treeitem").filter((node) => node.tabIndex === 0)).toEqual([
      item("Apple"),
    ]);
    expect(item("Apple").getAttribute("aria-selected")).toBe("true");
    expect(item("Apple").hasAttribute("data-selected")).toBe(true);
    expect(item("Alpha").getAttribute("aria-selected")).toBe("false");
  });

  it("moves through visible items with Down and Up, and roves the tab stop", () => {
    renderTree({ defaultExpanded: ["a"] });
    item("Alpha").focus();
    press("ArrowDown");
    expect(focusedName()).toBe("Apple");
    expect(item("Apple").tabIndex).toBe(0);
    expect(item("Alpha").tabIndex).toBe(-1);
    press("ArrowDown");
    press("ArrowDown");
    expect(focusedName()).toBe("Bravo");
    press("ArrowUp");
    expect(focusedName()).toBe("Banana");
  });

  it("Right opens a closed parent, then moves to its first child; does nothing on a leaf", () => {
    const onExpandedChange = vi.fn();
    renderTree({ onExpandedChange });
    item("Alpha").focus();
    press("ArrowRight");
    expect(onExpandedChange).toHaveBeenLastCalledWith(["a"]);
    expect(item("Alpha").getAttribute("aria-expanded")).toBe("true");
    expect(focusedName()).toBe("Alpha");
    press("ArrowRight");
    expect(focusedName()).toBe("Apple");
    press("ArrowRight");
    expect(focusedName()).toBe("Apple");
  });

  it("Left closes an open parent, else moves to the parent", () => {
    renderTree({ defaultExpanded: ["a", "a2"] });
    item("Berry").focus();
    press("ArrowLeft");
    expect(focusedName()).toBe("Banana");
    press("ArrowLeft");
    expect(item("Banana").getAttribute("aria-expanded")).toBe("false");
    expect(focusedName()).toBe("Banana");
    press("ArrowLeft");
    expect(focusedName()).toBe("Alpha");
    press("ArrowLeft");
    expect(item("Alpha").getAttribute("aria-expanded")).toBe("false");
  });

  it("Home and End go to the first and last visible items", () => {
    renderTree({ defaultExpanded: ["a"] });
    item("Apple").focus();
    press("End");
    expect(focusedName()).toBe("Charlie");
    press("Home");
    expect(focusedName()).toBe("Alpha");
  });

  it("Enter and Space select; a disabled item is focusable but not selectable", () => {
    const onSelectedChange = vi.fn();
    renderTree({ defaultExpanded: ["a"], onSelectedChange });
    item("Apple").focus();
    press("Enter");
    expect(onSelectedChange).toHaveBeenLastCalledWith("a1");
    expect(item("Apple").getAttribute("aria-selected")).toBe("true");
    press("ArrowDown");
    press(" ");
    expect(onSelectedChange).toHaveBeenLastCalledWith("a2");
    expect(item("Apple").getAttribute("aria-selected")).toBe("false");
    press("End");
    press("Enter");
    expect(onSelectedChange).toHaveBeenCalledTimes(2);
    expect(item("Charlie").getAttribute("aria-selected")).toBe("false");
  });

  it("* opens every sibling parent at the focused level", () => {
    renderTree();
    item("Alpha").focus();
    press("*");
    expect(item("Alpha").getAttribute("aria-expanded")).toBe("true");
    expect(item("Bravo").getAttribute("aria-expanded")).toBe("true");
    // Only that level: Banana stays closed.
    expect(item("Banana").getAttribute("aria-expanded")).toBe("false");
  });

  it("type-ahead moves to the next visible item starting with the letter, wrapping", () => {
    renderTree({ defaultExpanded: ["a"] });
    item("Alpha").focus();
    press("b");
    expect(focusedName()).toBe("Banana");
    press("B");
    expect(focusedName()).toBe("Bravo");
    press("b");
    expect(focusedName()).toBe("Banana");
    press("a");
    expect(focusedName()).toBe("Alpha");
    press("z");
    expect(focusedName()).toBe("Alpha");
  });

  it("selects on a click and toggles on the chevron", () => {
    const onSelectedChange = vi.fn();
    renderTree({ onSelectedChange });
    fireEvent.click(screen.getByText("Bravo"));
    expect(onSelectedChange).toHaveBeenCalledWith("b");
    expect(document.activeElement).toBe(item("Bravo"));
    const toggle = item("Bravo").querySelector<HTMLElement>('[data-slot="tree-view-toggle"]');
    if (!toggle) throw new Error("no toggle");
    fireEvent.click(toggle);
    expect(item("Bravo").getAttribute("aria-expanded")).toBe("true");
    expect(onSelectedChange).toHaveBeenCalledTimes(1);
  });

  it("follows expanded and selected when controlled", () => {
    render(<Controlled />);
    expect(item("Bravo").getAttribute("aria-selected")).toBe("true");
    item("Bravo").focus();
    press("ArrowRight");
    expect(item("Bravo").getAttribute("aria-expanded")).toBe("true");
    // Selected is controlled and never changed by the parent: Enter does not move it.
    press("ArrowDown");
    press("Enter");
    expect(item("Bravo").getAttribute("aria-selected")).toBe("true");
    cleanup();
    render(<TreeView items={items} aria-label="Files" expanded={[]} />);
    item("Alpha").focus();
    press("ArrowRight");
    expect(item("Alpha").getAttribute("aria-expanded")).toBe("false");
  });

  it("draws labels through renderLabel and keeps the plain label as the name", () => {
    renderTree({ renderLabel: (node) => <em>{node.label.toUpperCase()}</em> });
    expect(screen.getByText("ALPHA").tagName).toBe("EM");
  });

  it("takes aria-labelledby instead of aria-label", () => {
    render(
      <>
        <h2 id="title">Library</h2>
        <TreeView items={items} aria-labelledby="title" />
      </>,
    );
    expect(screen.getByRole("tree", { name: "Library" })).not.toBeNull();
  });

  it("does not animate the chevron under reduced motion and indents 1 rem per level", () => {
    renderTree({ defaultExpanded: ["a"] });
    const chevron = item("Alpha").querySelector('[data-slot="tree-view-toggle"] svg');
    expect(chevron?.getAttribute("class")).toContain("motion-reduce:transition-none");
    expect(item("Alpha").style.paddingLeft).toBe("0.25rem");
    expect(item("Apple").style.paddingLeft).toBe("1.25rem");
  });
});
