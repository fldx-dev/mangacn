"use client";

import {
  type Announcements,
  type CollisionDetection,
  closestCenter,
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  type DropAnimation,
  defaultDropAnimationSideEffects,
  getFirstCollision,
  type KeyboardCoordinateGetter,
  KeyboardSensor,
  MeasuringStrategy,
  MouseSensor,
  pointerWithin,
  rectIntersection,
  TouchSensor,
  type UniqueIdentifier,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { cn } from "cn";
import { EllipsisIcon, GripVerticalIcon } from "lucide-react";
import * as React from "react";
import { InkFrame } from "@/components/ink-frame";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// mangacn kanban: columns of cards that move within and between columns, on dnd-kit
// (@dnd-kit/core + @dnd-kit/sortable) as the engine and mangacn's card, badge and ink frames as
// the look. Space picks a card up, the arrow keys move it, Space drops it and Escape cancels;
// every step is announced in mangacn's words, and each card's menu moves it without dragging.

/** A column of the board: its key in `value` and its title. */
export interface KanbanColumnDef {
  /** The column's key in `value`. Must not clash with an item id. */
  id: string;
  /** The column's title, shown in its header and read in announcements. */
  title: string;
}

export interface KanbanProps<T>
  extends Omit<React.ComponentProps<"div">, "children" | "defaultValue" | "onChange"> {
  /** The cards of each column, by column id (controlled). Pair with `onValueChange`. */
  value: Record<string, T[]>;
  /** Called with the new board when a card is dropped somewhere new or moved from its menu. */
  onValueChange?: (value: Record<string, T[]>) => void;
  /** The columns, in order. */
  columns: KanbanColumnDef[];
  /** Called with the new column order when a column is dropped somewhere new. */
  onColumnsChange?: (columns: KanbanColumnDef[]) => void;
  /** A card's unique id, the `id` its `KanbanCard` takes. */
  getItemId: (item: T) => string;
  /** The words a screen reader hears for a card ("Inks: chapter 12"). Defaults to its id. */
  getItemLabel?: (item: T) => string;
  /**
   * Columns get a drag handle and can be reordered; pair with `onColumnsChange`.
   * @default false
   */
  orderableColumns?: boolean;
  /** A `KanbanColumn` for each of `columns`, then a `KanbanOverlay`. */
  children: React.ReactNode;
}

export interface KanbanColumnProps<T> extends Omit<React.ComponentProps<"div">, "id" | "children"> {
  /** The column's id, one of the board's `columns`. */
  id: string;
  /** Under the cards, on the column's footer rule: an "Add card" form, a link. */
  footer?: React.ReactNode;
  /**
   * Draws one card, a `KanbanCard`, from its item. The column calls it for each of its items
   * as the drag leaves them, so a card picked up from another column shows here at once.
   */
  children: (item: T) => React.ReactNode;
}

export interface KanbanCardProps extends Omit<React.ComponentProps<"li">, "id"> {
  /** The card's id: `getItemId` of its item. */
  id: string;
}

export interface KanbanOverlayProps<T> {
  /** Draws the card under the pointer from its item; defaults to the card's label. */
  children?: (item: T) => React.ReactNode;
  className?: string;
}

type Kind = "card" | "column";

interface Spot {
  columnId: string;
  /** Zero-based. */
  index: number;
  count: number;
}

interface KanbanContextValue {
  board: Record<string, unknown[]>;
  columns: KanbanColumnDef[];
  getItemId: (item: unknown) => string;
  labelOf: (id: string) => string;
  orderableColumns: boolean;
  hydrated: boolean;
  reducedMotion: boolean;
  active: { kind: Kind; id: string; keyboard: boolean } | null;
  moveTo: (itemId: string, columnId: string) => void;
  /** True once for the card a menu moved, which then takes the focus back. */
  takeFocusRequest: (id: string) => boolean;
}

const KanbanContext = React.createContext<KanbanContextValue | null>(null);

function useKanban(part: string): KanbanContextValue {
  const context = React.useContext(KanbanContext);
  if (!context) throw new Error(`${part} must be used inside <Kanban>.`);
  return context;
}

// Columns share the droppable id space with cards; a prefix keeps them apart.
const COLUMN_PREFIX = "kanban-column:";
const columnKey = (id: string) => `${COLUMN_PREFIX}${id}`;
const isColumnKey = (id: UniqueIdentifier) => String(id).startsWith(COLUMN_PREFIX);
const fromColumnKey = (id: UniqueIdentifier) => String(id).slice(COLUMN_PREFIX.length);

/** dnd-kit's transform as CSS: translate only, so cards of other heights are not squashed. */
function toTransform(transform: { x: number; y: number } | null): string | undefined {
  return transform
    ? `translate3d(${Math.round(transform.x)}px, ${Math.round(transform.y)}px, 0)`
    : undefined;
}

const subscribeNothing = () => () => {};

const ARROWS: Record<string, { x: number; y: number }> = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
};

const INSTRUCTIONS =
  "To pick up, press Space. Move with the arrow keys, press Space again to drop, or press Escape to cancel. A card's menu also moves it to another column.";

const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: "1" } } }),
};

export function Kanban<T>({
  value,
  onValueChange,
  columns,
  onColumnsChange,
  getItemId,
  getItemLabel,
  orderableColumns = false,
  className,
  children,
  ...props
}: KanbanProps<T>) {
  const dndId = React.useId();
  // False on the server and while hydrating, so the prerendered board and the first client
  // render match; nothing can be dragged (or measured) before then.
  const hydrated = React.useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  );
  const [draft, setDraft] = React.useState<Record<string, T[]> | null>(null);
  const [active, setActive] = React.useState<KanbanContextValue["active"]>(null);
  const [reducedMotion, setReducedMotion] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const board = draft ?? value;

  // Read by dnd-kit's callbacks, which run outside render: the board as the drag has left it,
  // where the dragged card or column would land, and where it started.
  const draftRef = React.useRef<Record<string, T[]>>(value);
  const projection = React.useRef<Spot | null>(null);
  const origin = React.useRef<Spot | null>(null);
  const activeLabel = React.useRef("");
  const spoken = React.useRef("");
  const lastOver = React.useRef<UniqueIdentifier | null>(null);
  const movedToNewColumn = React.useRef(false);
  // A keyboard drag steps through the board itself, not through rectangles: the arrow key names
  // the place, and the collision is that place.
  const keyboardTarget = React.useRef<{ overId: UniqueIdentifier; spot: Spot } | null>(null);
  const focusRequest = React.useRef<string | null>(null);
  const latest = React.useRef({
    value,
    columns,
    getItemId,
    getItemLabel,
    kind: null as Kind | null,
  });
  // Synced after each commit, not while rendering: handlers and dnd-kit's callbacks read it, and
  // the collision check dnd-kit runs while rendering reads only `kind` and `getItemId` from it.
  React.useLayoutEffect(() => {
    latest.current = { ...latest.current, value, columns, getItemId, getItemLabel };
  });

  React.useEffect(() => {
    // After a card changed column, let the new layout settle before collisions move it again.
    if (draft === null) return;
    const frame = requestAnimationFrame(() => {
      movedToNewColumn.current = false;
    });
    return () => cancelAnimationFrame(frame);
  }, [draft]);

  // Read after mount, never in render: the sensors take it when a drag starts.
  React.useEffect(() => {
    const query = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!query) return;
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    // A short press picks a card up on touch, so a swipe still scrolls the row.
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: (event, args) => keyboardStep(event, args),
      scrollBehavior: reducedMotion ? "auto" : "smooth",
    }),
  );

  const titleOf = React.useCallback(
    (columnId: string) =>
      latest.current.columns.find((column) => column.id === columnId)?.title ?? columnId,
    [],
  );

  // Cards read it while they render, so it reads this render's board (the draft while a card is
  // dragged, else the board as given), not a ref.
  const labelOf = React.useCallback(
    (id: string) => {
      for (const items of Object.values(board)) {
        const item = items.find((candidate) => getItemId(candidate) === id);
        if (item !== undefined) return getItemLabel ? getItemLabel(item) : id;
      }
      return id;
    },
    [board, getItemId, getItemLabel],
  );

  const spotOf = (current: Record<string, T[]>, id: string) =>
    findSpot(current, latest.current.columns, latest.current.getItemId, id);

  const columnSpot = (columnId: string): Spot => ({
    columnId,
    index: latest.current.columns.findIndex((column) => column.id === columnId),
    count: latest.current.columns.length,
  });

  const announcements = React.useMemo<Announcements>(() => {
    const where = (spot: Spot | null) =>
      spot ? `column ${titleOf(spot.columnId)}, position ${spot.index + 1} of ${spot.count}` : "";
    const at = (spot: Spot | null) => (spot ? `position ${spot.index + 1} of ${spot.count}` : "");
    const kindOf = (data: unknown) => (data as { kind?: Kind } | undefined)?.kind;
    // dnd-kit reports "over" again whenever the collision rect settles; say a place only once.
    const keyOf = (spot: Spot | null) =>
      spot ? `${spot.columnId}:${spot.index}:${spot.count}` : "none";
    return {
      onDragStart: ({ active: dragged }) => {
        spoken.current = keyOf(origin.current);
        return kindOf(dragged.data.current) === "column"
          ? `Picked up column ${activeLabel.current}. ${capitalize(at(origin.current))}.`
          : `Picked up ${activeLabel.current}. ${capitalize(where(origin.current))}.`;
      },
      onDragOver: ({ active: dragged, over }) => {
        const column = kindOf(dragged.data.current) === "column";
        const key = over ? keyOf(projection.current) : "none";
        if (key === spoken.current) return undefined;
        spoken.current = key;
        if (!over) {
          return column
            ? `Column ${activeLabel.current} is not over a column.`
            : `${activeLabel.current} is not over a column.`;
        }
        return column
          ? `Moved column ${activeLabel.current} to ${at(projection.current)}.`
          : `Moved to ${where(projection.current)}.`;
      },
      onDragEnd: ({ active: dragged }) =>
        kindOf(dragged.data.current) === "column"
          ? `Dropped column ${activeLabel.current} at ${at(projection.current)}.`
          : `Dropped ${activeLabel.current} in ${where(projection.current)}.`,
      onDragCancel: ({ active: dragged }) =>
        kindOf(dragged.data.current) === "column"
          ? `Cancelled. Column ${activeLabel.current} returned to ${at(origin.current)}.`
          : `Cancelled. ${activeLabel.current} returned to ${where(origin.current)}.`,
    };
  }, [titleOf]);

  // Up and Down move a card one place in its column; Left and Right move it to the next column
  // at the same position (or its end), and move a column one place.
  const keyboardStep: KeyboardCoordinateGetter = (event, { context }) => {
    const step = ARROWS[event.code];
    if (!step) return undefined;
    event.preventDefault();
    const from = projection.current;
    const activeId = context.active?.id;
    if (!from || activeId == null) return undefined;
    const { columns: order, getItemId: idOf } = latest.current;
    let target: { overId: UniqueIdentifier; spot: Spot; after?: boolean } | null = null;
    if (latest.current.kind === "column") {
      const index = from.index + step.x;
      const column = step.x !== 0 ? order[index] : undefined;
      if (column) target = { overId: columnKey(column.id), spot: { ...from, index } };
    } else if (step.y !== 0) {
      const index = from.index + step.y;
      const over = (draftRef.current[from.columnId] ?? [])[index];
      if (over !== undefined) target = { overId: idOf(over), spot: { ...from, index } };
    } else {
      const column = order[order.findIndex((entry) => entry.id === from.columnId) + step.x];
      if (column) {
        const items = draftRef.current[column.id] ?? [];
        const index = Math.min(from.index, items.length);
        const spot = { columnId: column.id, index, count: items.length + 1 };
        const last = items[items.length - 1];
        target =
          last === undefined
            ? { overId: columnKey(column.id), spot }
            : index < items.length
              ? { overId: idOf(items[index] as T), spot }
              : { overId: idOf(last), spot, after: true };
      }
    }
    if (!target) return undefined;
    keyboardTarget.current = { overId: target.overId, spot: target.spot };
    // Where the overlay goes: the place's own box (under the last card, past a column's end).
    const rect = context.droppableRects.get(target.overId);
    if (!rect) return undefined;
    return { x: rect.left, y: target.after ? rect.top + rect.height : rect.top };
  };

  const collisionDetection = React.useCallback<CollisionDetection>((args) => {
    if (keyboardTarget.current) return [{ id: keyboardTarget.current.overId }];
    if (latest.current.kind === "column") {
      return closestCenter({
        ...args,
        droppableContainers: args.droppableContainers.filter((entry) => isColumnKey(entry.id)),
      });
    }
    // Just moved into another column: stay over the card itself until the layout settles, so the
    // column's other cards do not shift around it and the next arrow key starts from its place.
    if (movedToNewColumn.current) {
      lastOver.current = args.active.id;
      return [{ id: args.active.id }];
    }
    const pointer = pointerWithin(args);
    const hits = pointer.length > 0 ? pointer : rectIntersection(args);
    let overId = getFirstCollision(hits, "id");
    if (overId != null) {
      if (isColumnKey(overId)) {
        // Over a column with cards: take the nearest card in it, not the column's end.
        const ids = new Set(
          (draftRef.current[fromColumnKey(overId)] ?? []).map((item) =>
            latest.current.getItemId(item),
          ),
        );
        if (ids.size > 0) {
          overId =
            closestCenter({
              ...args,
              droppableContainers: args.droppableContainers.filter((entry) =>
                ids.has(String(entry.id)),
              ),
            })[0]?.id ?? overId;
        }
      }
      lastOver.current = overId;
      return [{ id: overId }];
    }
    return lastOver.current != null ? [{ id: lastOver.current }] : [];
  }, []);

  const handleDragStart = ({ active: dragged, activatorEvent }: DragStartEvent) => {
    const id = String(dragged.id);
    const kind: Kind = isColumnKey(id) ? "column" : "card";
    latest.current.kind = kind;
    draftRef.current = value;
    lastOver.current = null;
    if (kind === "column") {
      const columnId = fromColumnKey(id);
      activeLabel.current = titleOf(columnId);
      origin.current = columnSpot(columnId);
    } else {
      activeLabel.current = labelOf(id);
      origin.current = spotOf(value, id);
      setDraft(value);
    }
    projection.current = origin.current;
    keyboardTarget.current =
      activatorEvent instanceof KeyboardEvent && origin.current
        ? { overId: dragged.id, spot: origin.current }
        : null;
    setActive({
      kind,
      id: kind === "column" ? fromColumnKey(id) : id,
      keyboard: activatorEvent instanceof KeyboardEvent,
    });
  };

  const handleDragOver = ({ active: dragged, over }: DragOverEvent) => {
    if (!over) return;
    const activeId = String(dragged.id);
    if (latest.current.kind === "column") {
      if (isColumnKey(over.id)) projection.current = columnSpot(fromColumnKey(over.id));
      return;
    }
    const current = draftRef.current;
    const from = spotOf(current, activeId);
    if (!from) return;
    const overId = String(over.id);
    if (overId === activeId) {
      projection.current = from;
      return;
    }
    const step = keyboardTarget.current;
    if (step && String(step.overId) === overId) {
      if (step.spot.columnId === from.columnId) {
        projection.current = step.spot;
      } else {
        moveCard(current, from, step.spot.columnId, step.spot.index);
        // The card now holds that place itself.
        keyboardTarget.current = { overId: activeId, spot: step.spot };
      }
      return;
    }
    const target = isColumnKey(overId)
      ? { columnId: fromColumnKey(overId), index: -1 }
      : (() => {
          const spot = spotOf(current, overId);
          return spot ? { columnId: spot.columnId, index: spot.index } : null;
        })();
    if (!target) return;
    if (target.columnId === from.columnId) {
      // Within a column, dnd-kit shifts the cards; the drop commits the order.
      projection.current = target.index === -1 ? from : { ...from, index: target.index };
      return;
    }
    // Into another column: move the card there now, so the column makes room for it.
    const into = current[target.columnId] ?? [];
    let index = into.length;
    if (target.index !== -1) {
      const translated = dragged.rect.current.translated;
      const below = translated ? translated.top > over.rect.top + over.rect.height / 2 : false;
      index = target.index + (below ? 1 : 0);
    }
    moveCard(current, from, target.columnId, index);
  };

  /** Moves the dragged card into another column of the draft, at `index`. */
  const moveCard = (current: Record<string, T[]>, from: Spot, columnId: string, index: number) => {
    const into = current[columnId] ?? [];
    const item = (current[from.columnId] ?? [])[from.index] as T;
    const next = {
      ...current,
      [from.columnId]: (current[from.columnId] ?? []).filter((_, i) => i !== from.index),
      [columnId]: [...into.slice(0, index), item, ...into.slice(index)],
    };
    draftRef.current = next;
    movedToNewColumn.current = true;
    projection.current = { columnId, index, count: into.length + 1 };
    setDraft(next);
  };

  const finish = () => {
    latest.current.kind = null;
    keyboardTarget.current = null;
    setDraft(null);
    setActive(null);
  };

  const handleDragEnd = ({ active: dragged }: DragEndEvent) => {
    const kind = latest.current.kind;
    // A keyboard drag lands where the last arrow key pointed, even when dnd-kit has not yet
    // reported "over" there (a key that scrolled the row, then Space at once).
    const landing = keyboardTarget.current?.spot ?? projection.current;
    projection.current = landing;
    if (kind === "column") {
      const from = origin.current?.index ?? -1;
      if (landing && from !== -1 && landing.index !== from) {
        onColumnsChange?.(arrayMove(columns, from, landing.index));
      }
    } else if (landing) {
      // Apply the move to the board as it is now, not to the copy taken at pickup: a card added
      // or removed during the drag stays added or removed.
      const next = placeCard(
        value,
        draftRef.current,
        columns,
        getItemId,
        String(dragged.id),
        landing,
      );
      if (next && !sameBoard(next, value, getItemId)) onValueChange?.(next);
    }
    finish();
  };

  const handleDragCancel = () => {
    draftRef.current = value;
    finish();
  };

  const moveTo = React.useCallback(
    (itemId: string, columnId: string) => {
      const { value: current, columns: order, getItemId: idOf } = latest.current;
      const from = findSpot(current, order, idOf, itemId);
      if (!from || from.columnId === columnId) return;
      const item = (current[from.columnId] ?? [])[from.index] as T;
      const into = [...(current[columnId] ?? []), item];
      const next = {
        ...current,
        [from.columnId]: (current[from.columnId] ?? []).filter((_, i) => i !== from.index),
        [columnId]: into,
      };
      const title = order.find((column) => column.id === columnId)?.title ?? columnId;
      focusRequest.current = itemId;
      setMessage(
        `Moved ${labelOf(itemId)} to column ${title}, position ${into.length} of ${into.length}.`,
      );
      onValueChange?.(next);
    },
    [labelOf, onValueChange],
  );

  const takeFocusRequest = React.useCallback((id: string) => {
    if (focusRequest.current !== id) return false;
    focusRequest.current = null;
    return true;
  }, []);

  const context = React.useMemo<KanbanContextValue>(
    () => ({
      board: board as Record<string, unknown[]>,
      columns,
      getItemId: getItemId as (item: unknown) => string,
      labelOf,
      orderableColumns,
      hydrated,
      reducedMotion,
      active,
      moveTo,
      takeFocusRequest,
    }),
    [
      board,
      columns,
      getItemId,
      labelOf,
      orderableColumns,
      hydrated,
      reducedMotion,
      active,
      moveTo,
      takeFocusRequest,
    ],
  );

  return (
    <KanbanContext.Provider value={context}>
      {/* biome-ignore lint/a11y/useSemanticElements: a named board of columns, not a form fieldset. */}
      <div
        role="group"
        data-slot="kanban"
        className={cn("@container/kanban w-full min-w-0 text-ink", className)}
        {...props}
      >
        <DndContext
          id={dndId}
          sensors={sensors}
          collisionDetection={collisionDetection}
          // Nothing is measured before hydration; after it, columns and cards are measured again
          // whenever a card changes column, so the arrow keys see the new layout.
          measuring={{
            droppable: {
              strategy: hydrated ? MeasuringStrategy.Always : MeasuringStrategy.WhileDragging,
            },
          }}
          accessibility={{ announcements, screenReaderInstructions: { draggable: INSTRUCTIONS } }}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext
            items={columns.map((column) => columnKey(column.id))}
            strategy={horizontalListSortingStrategy}
          >
            <div
              data-slot="kanban-board"
              data-active={active ? "" : undefined}
              className="flex snap-x snap-mandatory scroll-px-2 gap-4 overflow-x-auto p-2 data-active:snap-none"
            >
              {children}
            </div>
          </SortableContext>
        </DndContext>
        <div
          data-slot="kanban-announcer"
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        >
          {message}
        </div>
      </div>
    </KanbanContext.Provider>
  );
}

/**
 * `current` with card `id` moved to `landing` (its index once in place). The neighbours it lands
 * between come from `draft`, the board the drag shows, so cards added or removed in `current`
 * meanwhile keep their place. Null when the card is no longer on `current`.
 */
function placeCard<T>(
  current: Record<string, T[]>,
  draft: Record<string, T[]>,
  columns: KanbanColumnDef[],
  getItemId: (item: T) => string,
  id: string,
  landing: Spot,
): Record<string, T[]> | null {
  const from = findSpot(current, columns, getItemId, id);
  if (!from) return null;
  const item = (current[from.columnId] ?? [])[from.index] as T;
  const without = (items: T[]) => items.filter((entry) => getItemId(entry) !== id);
  // The landing column as the drag shows it, card included at its landing index.
  const shown = without(draft[landing.columnId] ?? []).map(getItemId);
  shown.splice(landing.index, 0, id);
  const target = without(current[landing.columnId] ?? []);
  const indexOf = (other: string | undefined) =>
    other === undefined ? -1 : target.findIndex((entry) => getItemId(entry) === other);
  const after = indexOf(shown[landing.index + 1]);
  const before = indexOf(shown[landing.index - 1]);
  const index =
    after !== -1 ? after : before !== -1 ? before + 1 : Math.min(landing.index, target.length);
  return {
    ...current,
    [from.columnId]: without(current[from.columnId] ?? []),
    [landing.columnId]: [...target.slice(0, index), item, ...target.slice(index)],
  };
}

/** Sets every ref in `refs` to `node`, function or object. */
function setRefs<E>(node: E | null, ...refs: (React.Ref<E> | undefined)[]) {
  for (const ref of refs) {
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  }
}

/** Where card `id` is on `board`: its column, index and the column's length. */
function findSpot<T>(
  board: Record<string, T[]>,
  columns: KanbanColumnDef[],
  getItemId: (item: T) => string,
  id: string,
): Spot | null {
  for (const column of columns) {
    const items = board[column.id] ?? [];
    const index = items.findIndex((item) => getItemId(item) === id);
    if (index !== -1) return { columnId: column.id, index, count: items.length };
  }
  return null;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function sameBoard<T>(
  a: Record<string, T[]>,
  b: Record<string, T[]>,
  getItemId: (item: T) => string,
): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    const left = a[key] ?? [];
    const right = b[key] ?? [];
    if (left.length !== right.length) return false;
    if (left.some((item, index) => getItemId(item) !== getItemId(right[index] as T))) return false;
  }
  return true;
}

export function KanbanColumn<T>({
  id,
  footer,
  className,
  style,
  ref,
  children,
  ...props
}: KanbanColumnProps<T>) {
  const context = useKanban("KanbanColumn");
  const items = context.board[id] ?? [];
  const title = context.columns.find((column) => column.id === id)?.title ?? id;
  const titleId = React.useId();
  const countId = React.useId();
  const {
    setNodeRef,
    setActivatorNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: columnKey(id),
    data: { kind: "column" },
    disabled: { draggable: !context.orderableColumns || !context.hydrated, droppable: false },
    attributes: { roleDescription: "draggable column" },
    transition: context.reducedMotion ? null : undefined,
  });
  const columnRef = React.useCallback(
    (node: HTMLDivElement | null) => setRefs(node, setNodeRef, ref),
    [setNodeRef, ref],
  );

  return (
    <Card
      size="sm"
      role="group"
      aria-labelledby={`${titleId} ${countId}`}
      data-slot="kanban-column"
      data-dragging={isDragging ? "" : undefined}
      className={cn("group/kanban-column w-full shrink-0 snap-start @lg/kanban:w-72", className)}
      {...props}
      // dnd-kit's node and transform win over a user's, which are kept beside them.
      ref={columnRef}
      style={{
        ...style,
        transform: toTransform(transform) ?? style?.transform,
        transition: transition ?? style?.transition,
      }}
    >
      {isDragging ? (
        <span
          aria-hidden="true"
          data-slot="kanban-column-placeholder"
          className="pointer-events-none absolute inset-0 rounded-xl halftone"
        />
      ) : null}
      <CardHeader className="flex items-center gap-1.5 group-data-dragging/kanban-column:opacity-0">
        {context.orderableColumns ? (
          <Button
            ref={setActivatorNodeRef}
            variant="ghost"
            size="icon-xs"
            data-slot="kanban-column-handle"
            aria-label={`Move column ${title}`}
            className="-ml-1 cursor-grab touch-manipulation"
            {...attributes}
            {...listeners}
          >
            <GripVerticalIcon aria-hidden="true" />
          </Button>
        ) : null}
        <CardTitle id={titleId} data-slot="kanban-column-title" className="min-w-0 truncate">
          {title}
        </CardTitle>
        <Badge id={countId} variant="secondary" data-slot="kanban-column-count" className="ml-auto">
          {items.length}
          <span className="sr-only"> {items.length === 1 ? "card" : "cards"}</span>
        </Badge>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col group-data-dragging/kanban-column:opacity-0">
        <SortableContext
          items={items.map((item) => context.getItemId(item))}
          strategy={verticalListSortingStrategy}
        >
          <ul data-slot="kanban-column-cards" className="flex list-none flex-col gap-2">
            {items.map((item) => (
              <React.Fragment key={context.getItemId(item)}>{children(item as T)}</React.Fragment>
            ))}
          </ul>
        </SortableContext>
        {items.length === 0 ? (
          <p
            data-slot="kanban-column-empty"
            className="py-4 text-center text-xs text-muted-foreground"
          >
            No cards
          </p>
        ) : null}
      </CardContent>
      {footer ? (
        <CardFooter
          data-slot="kanban-column-footer"
          className="group-data-dragging/kanban-column:opacity-0"
        >
          {footer}
        </CardFooter>
      ) : null}
    </Card>
  );
}

export function KanbanCard({ id, className, style, ref, children, ...props }: KanbanCardProps) {
  const context = useKanban("KanbanCard");
  const label = context.labelOf(id);
  const columnId = Object.keys(context.board).find((key) =>
    (context.board[key] ?? []).some((item) => context.getItemId(item) === id),
  );
  const activator = React.useRef<HTMLDivElement | null>(null);
  const {
    setNodeRef,
    setActivatorNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    data: { kind: "card" },
    disabled: { draggable: !context.hydrated, droppable: context.active?.kind === "column" },
    attributes: { roleDescription: "draggable card" },
    transition: context.reducedMotion ? null : undefined,
  });

  const cardRef = React.useCallback(
    (node: HTMLLIElement | null) => setRefs(node, setNodeRef, ref),
    [setNodeRef, ref],
  );

  // A card that changes column mounts anew in the other list. Moved from its menu, it takes the
  // focus back; carried by the keyboard, it keeps it, so the drag stays on a focused card.
  const keyboardDrag = isDragging && context.active?.keyboard === true;
  React.useEffect(() => {
    const node = activator.current;
    if (!node) return;
    if (context.takeFocusRequest(id)) {
      node.focus();
    } else if (keyboardDrag && document.activeElement !== node) {
      node.focus({ preventScroll: true });
    }
  });

  return (
    <li
      data-slot="kanban-card"
      data-dragging={isDragging ? "" : undefined}
      className={cn(
        "group/kanban-card relative isolate rounded-md text-sm data-dragging:halftone",
        className,
      )}
      {...props}
      // dnd-kit's node and transform win over a user's, which are kept beside them.
      ref={cardRef}
      style={{
        ...style,
        transform: toTransform(transform) ?? style?.transform,
        transition: transition ?? style?.transition,
      }}
    >
      <InkFrame
        as="span"
        fill={isDragging ? "none" : "paper"}
        dashed={isDragging}
        className="pointer-events-none absolute inset-0 -z-1 rounded-md"
      />
      <div className="flex items-start gap-1 p-2.5 group-data-dragging/kanban-card:opacity-0">
        <div
          ref={(node) => {
            activator.current = node;
            setActivatorNodeRef(node);
          }}
          data-slot="kanban-card-body"
          className="min-w-0 flex-1 cursor-grab touch-manipulation rounded-sm outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50"
          {...attributes}
          {...listeners}
        >
          {children}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-xs"
                data-slot="kanban-card-menu"
                aria-label={`Move ${label}`}
                className="-mt-0.5 -mr-1"
              />
            }
          >
            <EllipsisIcon aria-hidden="true" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-auto min-w-40">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Move to…</DropdownMenuLabel>
              {context.columns
                .filter((column) => column.id !== columnId)
                .map((column) => (
                  <DropdownMenuItem key={column.id} onClick={() => context.moveTo(id, column.id)}>
                    {column.title}
                  </DropdownMenuItem>
                ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  );
}

export function KanbanOverlay<T>({ children, className }: KanbanOverlayProps<T>) {
  const context = useKanban("KanbanOverlay");
  const { active } = context;
  let face: React.ReactNode = null;
  if (active?.kind === "card") {
    const item = Object.values(context.board)
      .flat()
      .find((candidate) => context.getItemId(candidate) === active.id);
    if (item !== undefined) {
      face = (
        <div
          data-slot="kanban-overlay-face"
          className={cn(
            "relative isolate h-full cursor-grabbing rounded-md p-2.5 text-sm text-ink rotate-2 motion-reduce:rotate-0",
            className,
          )}
        >
          <InkFrame
            as="span"
            fill="paper"
            className="pointer-events-none absolute inset-0 -z-1 rounded-md"
          />
          {children ? children(item as T) : context.labelOf(active.id)}
        </div>
      );
    }
  } else if (active?.kind === "column") {
    const title = context.columns.find((column) => column.id === active.id)?.title ?? active.id;
    const count = (context.board[active.id] ?? []).length;
    face = (
      <Card
        size="sm"
        data-slot="kanban-overlay-face"
        className={cn("h-full cursor-grabbing rotate-1 motion-reduce:rotate-0", className)}
      >
        <CardHeader className="flex items-center gap-1.5">
          <CardTitle className="min-w-0 truncate">{title}</CardTitle>
          <Badge variant="secondary" className="ml-auto">
            {count}
          </Badge>
        </CardHeader>
      </Card>
    );
  }
  return (
    <DragOverlay
      dropAnimation={context.reducedMotion ? null : dropAnimation}
      // dnd-kit eases a keyboard-carried card from place to place; under reduced motion it jumps.
      transition={context.reducedMotion ? "none" : undefined}
    >
      {/* dnd-kit measures this unrotated box; the tilt is on the face inside, so it never moves
          the collision rect. */}
      {face ? (
        <div data-slot="kanban-overlay" className="h-full">
          {face}
        </div>
      ) : null}
    </DragOverlay>
  );
}
