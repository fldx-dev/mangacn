"use client";

import * as React from "react";
import {
  Kanban,
  KanbanCard,
  KanbanColumn,
  type KanbanColumnDef,
  KanbanOverlay,
} from "@/registry/ui/kanban/kanban";

// Chapter 12's production board: each card is a batch of pages, moving from script to lettering.
interface Task {
  id: string;
  title: string;
  pages: string;
}

const columns: KanbanColumnDef[] = [
  { id: "script", title: "Script" },
  { id: "pencils", title: "Pencils" },
  { id: "inks", title: "Inks" },
  { id: "tones", title: "Tones" },
  { id: "lettering", title: "Lettering" },
];

const initial: Record<string, Task[]> = {
  script: [{ id: "c12-epilogue", title: "Epilogue", pages: "pp. 23–24" }],
  pencils: [
    { id: "c12-rooftop", title: "Rooftop chase", pages: "pp. 13–18" },
    { id: "c12-station", title: "Night station", pages: "pp. 19–22" },
  ],
  inks: [
    { id: "c12-cold-open", title: "Cold open", pages: "pp. 1–4" },
    { id: "c12-dojo", title: "Dojo flashback", pages: "pp. 5–8" },
  ],
  tones: [{ id: "c12-title-spread", title: "Title spread", pages: "pp. 9–10" }],
  lettering: [{ id: "c12-cover", title: "Colour cover", pages: "p. 0" }],
};

function TaskFace({ task }: { task: Task }) {
  return (
    <>
      <span className="block font-medium">{task.title}</span>
      <span className="block text-xs text-muted-foreground">{task.pages}</span>
    </>
  );
}

export default function KanbanDefaultDemo() {
  const [value, setValue] = React.useState(initial);
  return (
    <Kanban
      aria-label="Chapter 12 production board"
      value={value}
      onValueChange={setValue}
      columns={columns}
      getItemId={(task) => task.id}
      getItemLabel={(task) => task.title}
    >
      {columns.map((column) => (
        <KanbanColumn key={column.id} id={column.id}>
          {(task: Task) => (
            <KanbanCard id={task.id}>
              <TaskFace task={task} />
            </KanbanCard>
          )}
        </KanbanColumn>
      ))}
      <KanbanOverlay<Task>>{(task) => <TaskFace task={task} />}</KanbanOverlay>
    </Kanban>
  );
}
