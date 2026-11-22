"use client";

import { Badge } from "@/registry/ui/badge/badge";
import { type TreeNode, TreeView } from "@/registry/ui/tree-view/tree-view";

// A volume in production: each chapter's label carries its stage as a badge.
const items: TreeNode[] = [
  {
    id: "volume-12",
    label: "Volume 12",
    children: [
      { id: "volume-12/ch-108", label: "Chapter 108" },
      { id: "volume-12/ch-109", label: "Chapter 109" },
      { id: "volume-12/ch-110", label: "Chapter 110" },
      { id: "volume-12/ch-111", label: "Chapter 111" },
      { id: "volume-12/ch-112", label: "Chapter 112" },
    ],
  },
  {
    id: "volume-13",
    label: "Volume 13",
    children: [{ id: "volume-13/ch-113", label: "Chapter 113" }],
  },
];

const stages: Record<string, { text: string; variant: "outline" | "secondary" | "spot" }> = {
  "volume-12/ch-108": { text: "Done", variant: "outline" },
  "volume-12/ch-109": { text: "Done", variant: "outline" },
  "volume-12/ch-110": { text: "Done", variant: "outline" },
  "volume-12/ch-111": { text: "Inks", variant: "secondary" },
  "volume-12/ch-112": { text: "Late", variant: "spot" },
  "volume-13/ch-113": { text: "Script", variant: "secondary" },
};

function chapterLabel(node: TreeNode) {
  const stage = stages[node.id];
  return (
    <span className="flex min-w-0 items-center justify-between gap-2">
      <span className="truncate">{node.label}</span>
      {stage ? <Badge variant={stage.variant}>{stage.text}</Badge> : null}
    </span>
  );
}

export default function TreeViewStatusBadgesVariant() {
  return (
    <TreeView
      items={items}
      defaultExpanded={["volume-12"]}
      defaultSelected="volume-12/ch-111"
      renderLabel={chapterLabel}
      aria-label="Chapters by volume"
      className="w-full max-w-72"
    />
  );
}
