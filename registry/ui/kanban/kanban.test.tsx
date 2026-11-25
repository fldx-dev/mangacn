import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import * as React from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { expectVariantsAccessible } from "@/lib/test/axe";
import { Kanban, KanbanCard, KanbanColumn, type KanbanColumnDef, KanbanOverlay } from "./kanban";
import KanbanColumnsVariant from "./variants/columns";
import KanbanDefaultVariant from "./variants/default";

interface Task {
  id: string;
  title: string;
}

const columns: KanbanColumnDef[] = [
  { id: "pencils", title: "Pencils" },
  { id: "inks", title: "Inks" },
  { id: "tones", title: "Tones" },
];

const initial: Record<string, Task[]> = {
  pencils: [
    { id: "rooftop", title: "Rooftop chase" },
    { id: "station", title: "Night station" },
  ],
  inks: [
    { id: "cold-open", title: "Cold open" },
    { id: "dojo", title: "Dojo flashback" },
  ],
  tones: [],
};

type SetBoard = React.Dispatch<React.SetStateAction<Record<string, Task[]>>>;

function Board({
  onValueChange,
  setter,
  cardProps,
  columnProps,
}: {
  onValueChange?: (value: Record<string, Task[]>) => void;
  /** Receives the board's setter, to change `value` from outside while a card is carried. */
  setter?: { current: SetBoard | null };
  cardProps?: (task: Task) => Partial<React.ComponentProps<typeof KanbanCard>>;
  columnProps?: (id: string) => Partial<React.ComponentProps<typeof KanbanColumn<Task>>>;
}) {
  const [value, setValue] = React.useState(initial);
  if (setter) setter.current = setValue;
  return (
    <Kanban
      aria-label="Chapter 12"
      value={value}
      onValueChange={(next) => {
        onValueChange?.(next);
        setValue(next);
      }}
      columns={columns}
      getItemId={(task) => task.id}
      getItemLabel={(task) => task.title}
    >
      {columns.map((column) => (
        <KanbanColumn key={column.id} id={column.id} {...columnProps?.(column.id)}>
          {(task: Task) => (
            <KanbanCard id={task.id} {...cardProps?.(task)}>
              {task.title}
            </KanbanCard>
          )}
        </KanbanColumn>
      ))}
      <KanbanOverlay<Task>>{(task) => task.title}</KanbanOverlay>
    </Kanban>
  );
}

// jsdom lays nothing out. Give each column and card the box it would have on a page: columns
// 300 px apart, cards 60 px apart down their column, so dnd-kit measures a real board.
function stubLayout() {
  const box = (left: number, top: number, width: number, height: number) =>
    ({
      x: left,
      y: top,
      left,
      top,
      width,
      height,
      right: left + width,
      bottom: top + height,
      toJSON() {},
    }) as DOMRect;
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (this: Element) {
    const column = this.closest('[data-slot="kanban-column"]');
    const all = [...document.querySelectorAll('[data-slot="kanban-column"]')];
    const x = column ? all.indexOf(column) * 300 : 0;
    const card = this.closest('[data-slot="kanban-card"]');
    if (card && column) {
      const cards = [...column.querySelectorAll('[data-slot="kanban-card"]')];
      return box(x + 10, 60 + cards.indexOf(card) * 60, 260, 50);
    }
    if (column) return box(x, 0, 280, 400);
    return box(0, 0, 0, 0);
  });
  Element.prototype.scrollIntoView = () => {};
}

const live = () => document.querySelector('[id^="DndLiveRegion"]')?.textContent ?? "";
const cardsIn = (title: string) =>
  [
    ...screen
      .getByRole("group", { name: new RegExp(`^${title}`) })
      .querySelectorAll('[data-slot="kanban-card-body"]'),
  ].map((card) => card.textContent);

/** dnd-kit's keyboard sensor reads `event.code` from the document, attached a tick later. */
async function key(code: string, target: Element | Document = document) {
  await act(async () => {
    fireEvent.keyDown(target, { code, key: code === "Space" ? " " : code });
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

describe("Kanban", () => {
  expectVariantsAccessible(import.meta.glob("./variants/*.tsx"));

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("renders columns as named groups with a count, and cards as draggable buttons", () => {
    render(<Board />);
    const board = screen.getByRole("group", { name: "Chapter 12" });
    expect(board.dataset.slot).toBe("kanban");
    const pencils = screen.getByRole("group", { name: /^Pencils/ });
    expect(pencils.dataset.slot).toBe("kanban-column");
    // The name is the title and the count badge, read as "Pencils 2 cards".
    expect(
      pencils
        .getAttribute("aria-labelledby")
        ?.split(" ")
        .map((id) => document.getElementById(id)?.textContent?.trim())
        .join(" "),
    ).toBe("Pencils 2 cards");
    expect(screen.getByRole("group", { name: /^Tones/ }).textContent).toContain("No cards");
    const card = screen.getByRole("button", { name: "Rooftop chase" });
    expect(card.dataset.slot).toBe("kanban-card-body");
    expect(card.getAttribute("aria-roledescription")).toBe("draggable card");
    // The screen-reader instructions are tied to every card.
    const instructions = document.getElementById(card.getAttribute("aria-describedby") ?? "");
    expect(instructions?.textContent).toMatch(/^To pick up, press Space\./);
    expect(screen.getByRole("button", { name: "Move Rooftop chase" })).toBeTruthy();
  });

  describe("keyboard", () => {
    beforeEach(stubLayout);

    it("picks up, moves across columns and drops, announcing each step", async () => {
      const onValueChange = vi.fn();
      render(<Board onValueChange={onValueChange} />);
      const card = screen.getByRole("button", { name: "Rooftop chase" });
      card.focus();
      await key("Space", card);
      expect(live()).toBe("Picked up Rooftop chase. Column Pencils, position 1 of 2.");
      await key("ArrowRight");
      expect(live()).toBe("Moved to column Inks, position 1 of 3.");
      await key("ArrowDown");
      expect(live()).toBe("Moved to column Inks, position 2 of 3.");
      await key("ArrowRight");
      expect(live()).toBe("Moved to column Tones, position 1 of 1.");
      // Left and Right keep the position, or take the column's end.
      await key("ArrowLeft");
      expect(live()).toBe("Moved to column Inks, position 1 of 3.");
      await key("ArrowDown");
      expect(live()).toBe("Moved to column Inks, position 2 of 3.");
      expect(onValueChange).not.toHaveBeenCalled();
      await key("Space");
      expect(live()).toBe("Dropped Rooftop chase in column Inks, position 2 of 3.");
      expect(onValueChange).toHaveBeenCalledTimes(1);
      expect(
        Object.fromEntries(
          Object.entries(onValueChange.mock.calls[0]?.[0] as Record<string, Task[]>).map(
            ([column, tasks]) => [column, tasks.map((task) => task.id)],
          ),
        ),
      ).toEqual({ pencils: ["station"], inks: ["cold-open", "rooftop", "dojo"], tones: [] });
      expect(cardsIn("Inks")).toEqual(["Cold open", "Rooftop chase", "Dojo flashback"]);
    });

    it("Escape cancels: the card goes back and the board is unchanged", async () => {
      const onValueChange = vi.fn();
      render(<Board onValueChange={onValueChange} />);
      const card = screen.getByRole("button", { name: "Rooftop chase" });
      card.focus();
      await key("Space", card);
      await key("ArrowRight");
      expect(cardsIn("Inks")).toEqual(["Rooftop chase", "Cold open", "Dojo flashback"]);
      await key("Escape");
      expect(live()).toBe("Cancelled. Rooftop chase returned to column Pencils, position 1 of 2.");
      expect(onValueChange).not.toHaveBeenCalled();
      expect(cardsIn("Pencils")).toEqual(["Rooftop chase", "Night station"]);
      expect(cardsIn("Inks")).toEqual(["Cold open", "Dojo flashback"]);
    });

    it("does not call onValueChange for a drop where the card started", async () => {
      const onValueChange = vi.fn();
      render(<Board onValueChange={onValueChange} />);
      const card = screen.getByRole("button", { name: "Rooftop chase" });
      card.focus();
      await key("Space", card);
      await key("ArrowDown");
      await key("ArrowUp");
      await key("ArrowRight");
      await key("ArrowLeft");
      await key("Space");
      expect(live()).toBe("Dropped Rooftop chase in column Pencils, position 1 of 2.");
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it("drops onto the board as it is now, not as it was at pickup", async () => {
      const onValueChange = vi.fn();
      const setter: { current: SetBoard | null } = { current: null };
      render(<Board onValueChange={onValueChange} setter={setter} />);
      const card = screen.getByRole("button", { name: "Rooftop chase" });
      card.focus();
      await key("Space", card);
      await key("ArrowRight");
      // While the card is carried, a card arrives in Inks and another leaves Pencils.
      act(() => {
        setter.current?.((board) => ({
          ...board,
          pencils: (board.pencils ?? []).filter((task) => task.id !== "station"),
          inks: [...(board.inks ?? []), { id: "late", title: "Late page" }],
        }));
      });
      await key("Space");
      const ids = (board: Record<string, Task[]>) =>
        Object.fromEntries(
          Object.entries(board).map(([column, tasks]) => [column, tasks.map((task) => task.id)]),
        );
      expect(onValueChange).toHaveBeenCalledTimes(1);
      expect(ids(onValueChange.mock.calls[0]?.[0] as Record<string, Task[]>)).toEqual({
        pencils: [],
        inks: ["rooftop", "cold-open", "dojo", "late"],
        tones: [],
      });
    });

    it("drops where the last arrow key pointed, even before dnd-kit reports it", async () => {
      const onValueChange = vi.fn();
      render(<Board onValueChange={onValueChange} />);
      const card = screen.getByRole("button", { name: "Rooftop chase" });
      card.focus();
      await key("Space", card);
      // ArrowRight and Space in one task: no render, so no "over", between the two keys.
      await act(async () => {
        for (const code of ["ArrowRight", "Space"]) {
          document.dispatchEvent(new KeyboardEvent("keydown", { code, bubbles: true }));
        }
      });
      expect(live()).toBe("Dropped Rooftop chase in column Inks, position 1 of 3.");
      expect(cardsIn("Inks")).toEqual(["Rooftop chase", "Cold open", "Dojo flashback"]);
    });

    it("keeps a user's style and ref beside dnd-kit's transform and node", async () => {
      const cardRef = React.createRef<HTMLLIElement>();
      const columnRef = React.createRef<HTMLDivElement>();
      render(
        <Board
          cardProps={(task) =>
            task.id === "rooftop" ? { ref: cardRef, style: { color: "rgb(255, 0, 0)" } } : {}
          }
          columnProps={(id) =>
            id === "pencils" ? { ref: columnRef, style: { color: "rgb(0, 0, 255)" } } : {}
          }
        />,
      );
      const li = cardRef.current;
      expect(li?.dataset.slot).toBe("kanban-card");
      expect(columnRef.current?.dataset.slot).toBe("kanban-column");
      expect(columnRef.current?.style.color).toBe("rgb(0, 0, 255)");
      expect(li?.style.color).toBe("rgb(255, 0, 0)");
      const card = screen.getByRole("button", { name: "Rooftop chase" });
      card.focus();
      await key("Space", card);
      await key("ArrowDown");
      // The carried card's placeholder moves by dnd-kit's transform; the user's colour stays.
      expect(li?.style.transform).toMatch(/^translate3d\(0px, 60px, 0(px)?\)$/);
      expect(li?.style.color).toBe("rgb(255, 0, 0)");
      await key("Escape");
    });

    it("reorders columns with the column's handle", async () => {
      render(<KanbanColumnsVariant />);
      const handle = screen.getByRole("button", { name: "Move column Ideas" });
      handle.focus();
      await key("Space", handle);
      expect(live()).toBe("Picked up column Ideas. Position 1 of 3.");
      await key("ArrowRight");
      expect(live()).toBe("Moved column Ideas to position 2 of 3.");
      await key("Space");
      expect(live()).toBe("Dropped column Ideas at position 2 of 3.");
      expect(
        screen.getAllByRole("group", { name: /cards?$/ }).map((column) => column.dataset.slot),
      ).toHaveLength(3);
      expect(
        [...document.querySelectorAll('[data-slot="kanban-column-title"]')].map(
          (title) => title.textContent,
        ),
      ).toEqual(["Drafting", "Ideas", "Done"]);
    });
  });

  it("moves a card from its menu, announces it and keeps the focus on it", async () => {
    render(<Board />);
    fireEvent.click(screen.getByRole("button", { name: "Move Rooftop chase" }));
    const item = await screen.findByRole("menuitem", { name: "Tones" });
    expect(screen.queryByRole("menuitem", { name: "Pencils" })).toBeNull();
    await act(async () => {
      fireEvent.click(item);
    });
    expect(cardsIn("Tones")).toEqual(["Rooftop chase"]);
    expect(document.querySelector('[data-slot="kanban-announcer"]')?.textContent).toBe(
      "Moved Rooftop chase to column Tones, position 1 of 1.",
    );
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Rooftop chase" }));
  });

  it("names a card's menu after the item as it is now, in the render that changes it", () => {
    const setter: { current: SetBoard | null } = { current: null };
    render(<Board setter={setter} />);
    act(() => {
      setter.current?.((board) => ({
        ...board,
        pencils: [{ id: "rooftop", title: "Rooftop escape" }, ...(board.pencils ?? []).slice(1)],
      }));
    });
    expect(screen.getByRole("button", { name: "Move Rooftop escape" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Move Rooftop chase" })).toBeNull();
  });

  it("moves a second card from its menu onto the board as the first move left it", async () => {
    const onValueChange = vi.fn();
    render(<Board onValueChange={onValueChange} />);
    const moveToTones = async (title: string) => {
      fireEvent.click(screen.getByRole("button", { name: `Move ${title}` }));
      const item = await screen.findByRole("menuitem", { name: "Tones" });
      await act(async () => {
        fireEvent.click(item);
      });
    };
    await moveToTones("Rooftop chase");
    await moveToTones("Night station");
    expect(cardsIn("Tones")).toEqual(["Rooftop chase", "Night station"]);
    expect(cardsIn("Pencils")).toEqual([]);
    expect(onValueChange).toHaveBeenCalledTimes(2);
  });

  it("adds a card from a column's form in the columns variant", () => {
    render(<KanbanColumnsVariant />);
    const input = screen.getByLabelText("New card in Done");
    fireEvent.change(input, { target: { value: "Back cover" } });
    fireEvent.submit(input);
    expect(cardsIn("Done")).toEqual(["Back cover"]);
    // A card added without a drag is named by its label at once, in its menu and its moves.
    fireEvent.click(screen.getByRole("button", { name: "Move Back cover" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Ideas" }));
    expect(document.querySelector('[data-slot="kanban-announcer"]')?.textContent).toBe(
      "Moved Back cover to column Ideas, position 3 of 3.",
    );
  });

  it("reads no clock in render: the same server markup on two different days", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    for (const Variant of [KanbanDefaultVariant, KanbanColumnsVariant]) {
      vi.setSystemTime(new Date(2026, 0, 1, 9, 0));
      const first = renderToString(<Variant />);
      vi.setSystemTime(new Date(2031, 6, 15, 23, 30));
      expect(renderToString(<Variant />)).toBe(first);
    }
  });

  it("hydrates the prerendered board without a mismatch, with useId-based dnd-kit ids", async () => {
    const html = renderToString(<KanbanDefaultVariant />);
    // dnd-kit's own counter ids ("DndDescribedBy-0") would differ between server and client;
    // the board passes a useId() as DndContext's id, which dnd-kit then uses as is.
    const describedBy = html.match(/aria-describedby="([^"]+)"/)?.[1] ?? "";
    expect(describedBy).toMatch(/^_R_/);
    expect(html).not.toMatch(/Dnd[A-Za-z]+-\d+/);
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.append(container);
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const root = await act(async () => hydrateRoot(container, <KanbanDefaultVariant />));
    expect(errors).not.toHaveBeenCalled();
    act(() => root.unmount());
    container.remove();
  });
});
