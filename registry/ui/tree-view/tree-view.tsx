"use client";

import { cn } from "cn";
import { ChevronRightIcon } from "lucide-react";
import * as React from "react";

// mangacn tree view: nested, collapsible items from an `items` tree, on the WAI-ARIA Tree View
// pattern (single select). One tab stop that roves with the arrow keys; indent guides in ink;
// the selected row in dropdown-menu's ink highlight.

export interface TreeNode {
  /** Unique in the whole tree: the key for `expanded` and `selected`. */
  id: string;
  /** The text shown, and matched by type-ahead. */
  label: string;
  /** An icon before the label; decorative. */
  icon?: React.ReactNode;
  /** Child nodes; with any, the node is a parent that opens and closes. */
  children?: TreeNode[];
  /** Focusable but not selectable. */
  disabled?: boolean;
}

export interface TreeViewProps
  extends Omit<React.ComponentProps<"div">, "children" | "defaultValue" | "onSelect"> {
  /** The tree. */
  items: TreeNode[];
  /** The ids of the open parents (controlled). Pair with `onExpandedChange`. */
  expanded?: string[];
  /**
   * The ids of the parents open at first (uncontrolled).
   * @default []
   */
  defaultExpanded?: string[];
  /** Called with the new list of open parents whenever one opens or closes. */
  onExpandedChange?: (ids: string[]) => void;
  /** The selected node's id, or `null` for none (controlled). Pair with `onSelectedChange`. */
  selected?: string | null;
  /**
   * The node selected at first (uncontrolled).
   * @default null
   */
  defaultSelected?: string | null;
  /** Called with the id of the node Enter, Space or a click selects. */
  onSelectedChange?: (id: string) => void;
  /** Draws a node's label; defaults to `node.label`. */
  renderLabel?: (node: TreeNode) => React.ReactNode;
  /** Names the tree. Required unless `aria-labelledby` names it. */
  "aria-label"?: string;
  /** The id of the element that names the tree, instead of `aria-label`. */
  "aria-labelledby"?: string;
}

interface VisibleNode {
  node: TreeNode;
  level: number;
  parentId: string | null;
  /** The node's siblings, itself included. */
  siblings: TreeNode[];
}

const hasChildren = (node: TreeNode) => (node.children?.length ?? 0) > 0;

/** The nodes a user can see, in order: every root and the children of every open parent. */
function flatten(items: TreeNode[], open: ReadonlySet<string>): VisibleNode[] {
  const out: VisibleNode[] = [];
  const walk = (nodes: TreeNode[], level: number, parentId: string | null) => {
    for (const node of nodes) {
      out.push({ node, level, parentId, siblings: nodes });
      if (hasChildren(node) && open.has(node.id)) walk(node.children ?? [], level + 1, node.id);
    }
  };
  walk(items, 1, null);
  return out;
}

export function TreeView({
  items,
  expanded: expandedProp,
  defaultExpanded = [],
  onExpandedChange,
  selected: selectedProp,
  defaultSelected = null,
  onSelectedChange,
  renderLabel,
  className,
  onKeyDown,
  ...props
}: TreeViewProps) {
  const [uncontrolledExpanded, setUncontrolledExpanded] = React.useState(defaultExpanded);
  const [uncontrolledSelected, setUncontrolledSelected] = React.useState(defaultSelected);
  const expanded = expandedProp ?? uncontrolledExpanded;
  const selected = selectedProp === undefined ? uncontrolledSelected : selectedProp;
  const open = React.useMemo(() => new Set(expanded), [expanded]);
  const visible = React.useMemo(() => flatten(items, open), [items, open]);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const elements = React.useRef(new Map<string, HTMLDivElement>());
  const baseId = React.useId();

  // One tab stop: the focused node while it is visible, else the selected one, else the first.
  const tabStop =
    visible.find((entry) => entry.node.id === activeId)?.node.id ??
    visible.find((entry) => entry.node.id === selected)?.node.id ??
    visible[0]?.node.id;

  const setExpanded = (next: string[]) => {
    if (expandedProp === undefined) setUncontrolledExpanded(next);
    onExpandedChange?.(next);
  };

  const toggle = (id: string, to = !open.has(id)) => {
    if (to === open.has(id)) return;
    setExpanded(to ? [...expanded, id] : expanded.filter((other) => other !== id));
  };

  const select = (node: TreeNode) => {
    if (node.disabled) return;
    if (selectedProp === undefined) setUncontrolledSelected(node.id);
    onSelectedChange?.(node.id);
  };

  const focus = (id: string | undefined) => {
    if (id === undefined) return;
    setActiveId(id);
    elements.current.get(id)?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
    // The item the key came from: the focused treeitem.
    const fromId =
      [...elements.current].find(([, element]) => element === event.target)?.[0] ?? tabStop;
    const index = visible.findIndex((entry) => entry.node.id === fromId);
    const current = visible[index];
    if (!current) return;
    const { node } = current;
    let handled = true;

    switch (event.key) {
      case "ArrowDown":
        focus(visible[index + 1]?.node.id);
        break;
      case "ArrowUp":
        focus(visible[index - 1]?.node.id);
        break;
      case "ArrowRight":
        if (hasChildren(node)) {
          if (open.has(node.id)) focus(node.children?.[0]?.id);
          else toggle(node.id, true);
        }
        break;
      case "ArrowLeft":
        if (hasChildren(node) && open.has(node.id)) toggle(node.id, false);
        else focus(current.parentId ?? undefined);
        break;
      case "Home":
        focus(visible[0]?.node.id);
        break;
      case "End":
        focus(visible[visible.length - 1]?.node.id);
        break;
      case "Enter":
      case " ":
        select(node);
        break;
      case "*": {
        const closed = current.siblings
          .filter((sibling) => hasChildren(sibling) && !open.has(sibling.id))
          .map((sibling) => sibling.id);
        if (closed.length > 0) setExpanded([...expanded, ...closed]);
        break;
      }
      default:
        if (event.key.length === 1 && event.key.trim()) {
          // Type-ahead: the next visible node whose label starts with the letter, wrapping.
          const letter = event.key.toLocaleLowerCase();
          const order = [...visible.slice(index + 1), ...visible.slice(0, index + 1)];
          const match = order.find((entry) =>
            entry.node.label.toLocaleLowerCase().startsWith(letter),
          );
          focus(match?.node.id);
        } else {
          handled = false;
        }
    }
    if (handled) event.preventDefault();
  };

  const domId = (id: string) => `${baseId}-${id.replace(/[^\w-]/g, "_")}`;

  // Each treeitem is its row; an open parent owns the group that follows it (`aria-owns`), so
  // its visible text is its label alone. The name comes from the label (`aria-labelledby`):
  // name-from-content would take in the owned children too.
  const renderNodes = (nodes: TreeNode[], level: number): React.ReactNode =>
    nodes.map((node, index) => {
      const parent = hasChildren(node);
      const isOpen = parent && open.has(node.id);
      const isSelected = selected === node.id;
      const groupId = `${domId(node.id)}-group`;
      const labelId = `${domId(node.id)}-label`;
      return (
        <React.Fragment key={node.id}>
          {/* biome-ignore lint/a11y/useKeyWithClickEvents: the tree handles the keys */}
          <div
            ref={(element) => {
              if (element) elements.current.set(node.id, element);
              else elements.current.delete(node.id);
            }}
            role="treeitem"
            aria-labelledby={labelId}
            aria-level={level}
            aria-setsize={nodes.length}
            aria-posinset={index + 1}
            aria-expanded={parent ? isOpen : undefined}
            aria-owns={isOpen ? groupId : undefined}
            aria-selected={isSelected}
            aria-disabled={node.disabled || undefined}
            tabIndex={node.id === tabStop ? 0 : -1}
            data-slot="tree-view-item"
            data-state={parent ? (isOpen ? "open" : "closed") : undefined}
            data-selected={isSelected ? "" : undefined}
            data-disabled={node.disabled ? "" : undefined}
            style={{ paddingLeft: `${level - 1 + 0.25}rem` }}
            className={cn(
              "flex h-8 min-w-0 cursor-default items-center gap-1.5 rounded-md pr-2 text-sm outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50",
              isSelected
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted hover:text-foreground",
              node.disabled && "opacity-50",
            )}
            onFocus={() => setActiveId(node.id)}
            onClick={() => {
              focus(node.id);
              select(node);
            }}
          >
            {parent ? (
              <span
                data-slot="tree-view-toggle"
                aria-hidden="true"
                className="flex size-4 shrink-0 items-center justify-center"
                onClick={(event) => {
                  event.stopPropagation();
                  focus(node.id);
                  toggle(node.id);
                }}
              >
                <ChevronRightIcon
                  className={cn(
                    "size-4 transition-transform duration-150 motion-reduce:transition-none",
                    isOpen && "rotate-90",
                  )}
                />
              </span>
            ) : (
              <span aria-hidden="true" className="size-4 shrink-0" />
            )}
            {node.icon && (
              <span
                aria-hidden="true"
                className="flex shrink-0 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4"
              >
                {node.icon}
              </span>
            )}
            <span
              id={labelId}
              data-slot="tree-view-label"
              title={node.label}
              className="min-w-0 flex-1 truncate"
            >
              {renderLabel ? renderLabel(node) : node.label}
            </span>
          </div>
          {isOpen && (
            // biome-ignore lint/a11y/useSemanticElements: the APG tree's child group, not a fieldset.
            <div
              id={groupId}
              role="group"
              data-slot="tree-view-group"
              style={{ "--tree-guide": `${level - 1 + 0.75}rem` } as React.CSSProperties}
              className="relative flex flex-col before:pointer-events-none before:absolute before:inset-y-0 before:left-(--tree-guide) before:w-px before:bg-ink"
            >
              {renderNodes(node.children ?? [], level + 1)}
            </div>
          )}
        </React.Fragment>
      );
    });

  return (
    <div
      role="tree"
      data-slot="tree-view"
      className={cn("flex w-full min-w-0 flex-col text-ink", className)}
      onKeyDown={handleKeyDown}
      {...props}
    >
      {renderNodes(items, 1)}
    </div>
  );
}
