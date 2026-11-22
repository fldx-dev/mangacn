"use client";

import * as React from "react";
import { Button } from "@/registry/ui/button/button";
import { Input } from "@/registry/ui/input/input";
import {
  Kanban,
  KanbanCard,
  KanbanColumn,
  type KanbanColumnDef,
  KanbanOverlay,
} from "@/registry/ui/kanban/kanban";

// A volume's to-do board: drag a column by its grip to reorder, and add cards from each footer.
interface Note {
  id: string;
  text: string;
}

const initialColumns: KanbanColumnDef[] = [
  { id: "ideas", title: "Ideas" },
  { id: "drafting", title: "Drafting" },
  { id: "done", title: "Done" },
];

const initialValue: Record<string, Note[]> = {
  ideas: [
    { id: "n1", text: "Rival's first appearance" },
    { id: "n2", text: "Festival arc" },
  ],
  drafting: [{ id: "n3", text: "Volume 3 afterword" }],
  done: [],
};

function AddCard({ column, onAdd }: { column: KanbanColumnDef; onAdd: (text: string) => void }) {
  const inputId = React.useId();
  return (
    <form
      className="flex w-full items-center gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const text = String(new FormData(form).get("text") ?? "").trim();
        if (!text) return;
        onAdd(text);
        form.reset();
      }}
    >
      <label htmlFor={inputId} className="sr-only">
        New card in {column.title}
      </label>
      <Input id={inputId} name="text" placeholder="New card" autoComplete="off" />
      <Button type="submit" size="sm" variant="outline">
        Add card
      </Button>
    </form>
  );
}

export default function KanbanColumnsVariant() {
  const [columns, setColumns] = React.useState(initialColumns);
  const [value, setValue] = React.useState(initialValue);
  // Ids from a counter, never from the clock or randomness.
  const next = React.useRef(4);

  return (
    <Kanban
      aria-label="Volume 3 notes"
      value={value}
      onValueChange={setValue}
      columns={columns}
      onColumnsChange={setColumns}
      orderableColumns
      getItemId={(note) => note.id}
      getItemLabel={(note) => note.text}
    >
      {columns.map((column) => (
        <KanbanColumn
          key={column.id}
          id={column.id}
          footer={
            <AddCard
              column={column}
              onAdd={(text) => {
                const note = { id: `n${next.current++}`, text };
                setValue((current) => ({
                  ...current,
                  [column.id]: [...(current[column.id] ?? []), note],
                }));
              }}
            />
          }
        >
          {(note: Note) => <KanbanCard id={note.id}>{note.text}</KanbanCard>}
        </KanbanColumn>
      ))}
      <KanbanOverlay<Note>>{(note) => note.text}</KanbanOverlay>
    </Kanban>
  );
}
