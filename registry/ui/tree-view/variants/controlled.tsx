"use client";

import * as React from "react";
import { type TreeNode, TreeView } from "@/registry/ui/tree-view/tree-view";

// Series → volumes → chapters, with the selection kept by the page and shown beside the tree.
const items: TreeNode[] = [
  {
    id: "ink-and-steel",
    label: "Ink & Steel",
    children: [
      {
        id: "ink-and-steel/v1",
        label: "Volume 1",
        children: [
          { id: "ink-and-steel/v1/c1", label: "Chapter 1: The Nib" },
          { id: "ink-and-steel/v1/c2", label: "Chapter 2: Wet Paper" },
          { id: "ink-and-steel/v1/c3", label: "Chapter 3: Screentone" },
        ],
      },
      {
        id: "ink-and-steel/v2",
        label: "Volume 2",
        children: [
          { id: "ink-and-steel/v2/c4", label: "Chapter 4: Deadline" },
          { id: "ink-and-steel/v2/c5", label: "Chapter 5: Night Shift", disabled: true },
        ],
      },
    ],
  },
  {
    id: "kyoto-lanterns",
    label: "Kyoto Lanterns",
    children: [
      {
        id: "kyoto-lanterns/v1",
        label: "Volume 1",
        children: [{ id: "kyoto-lanterns/v1/c1", label: "Chapter 1: First Light" }],
      },
    ],
  },
];

function findLabel(nodes: TreeNode[], id: string | null): string | undefined {
  for (const node of nodes) {
    if (node.id === id) return node.label;
    const found = findLabel(node.children ?? [], id);
    if (found) return found;
  }
  return undefined;
}

export default function TreeViewControlledVariant() {
  const [expanded, setExpanded] = React.useState(["ink-and-steel", "ink-and-steel/v1"]);
  const [selected, setSelected] = React.useState<string | null>("ink-and-steel/v1/c2");

  return (
    <div className="flex w-full max-w-xl flex-col gap-4 sm:flex-row">
      <TreeView
        items={items}
        expanded={expanded}
        onExpandedChange={setExpanded}
        selected={selected}
        onSelectedChange={setSelected}
        aria-labelledby="tree-view-controlled-title"
        className="sm:max-w-64"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1 text-sm">
        <p id="tree-view-controlled-title" className="font-medium">
          Library
        </p>
        <p className="text-muted-foreground">
          Reading:{" "}
          <span className="text-foreground">{findLabel(items, selected) ?? "nothing"}</span>
        </p>
        <p className="text-muted-foreground">{expanded.length} open</p>
      </div>
    </div>
  );
}
