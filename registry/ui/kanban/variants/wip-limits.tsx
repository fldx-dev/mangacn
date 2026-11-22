"use client";

import * as React from "react";
import {
  Kanban,
  KanbanCard,
  KanbanColumn,
  type KanbanColumnDef,
  KanbanOverlay,
} from "@/registry/ui/kanban/kanban";

// A small studio's week: each column has a work limit, shown in its footer. The limit warns, it
// does not block: Inks starts one card over, and moving a card out clears the warning.
interface Page {
  id: string;
  title: string;
  assistant: string;
}

const columns: KanbanColumnDef[] = [
  { id: "pencils", title: "Pencils" },
  { id: "inks", title: "Inks" },
  { id: "review", title: "Editor review" },
];

const limits: Record<string, number> = { pencils: 3, inks: 2, review: 2 };

const initial: Record<string, Page[]> = {
  pencils: [{ id: "p17", title: "Page 17", assistant: "Haru" }],
  inks: [
    { id: "p12", title: "Page 12", assistant: "Mei" },
    { id: "p13", title: "Page 13", assistant: "Ren" },
    { id: "p14", title: "Page 14", assistant: "Mei" },
  ],
  review: [],
};

function PageFace({ page }: { page: Page }) {
  return (
    <>
      <span className="block font-medium">{page.title}</span>
      <span className="block text-xs text-muted-foreground">{page.assistant}</span>
    </>
  );
}

function LimitNote({ count, limit }: { count: number; limit: number }) {
  const over = count > limit;
  return (
    <p className={over ? "text-xs font-medium text-spot" : "text-xs text-muted-foreground"}>
      {over ? `Over the limit of ${limit}` : `Limit ${limit}`}
    </p>
  );
}

export default function KanbanWipLimitsVariant() {
  const [value, setValue] = React.useState(initial);
  return (
    <Kanban
      aria-label="Chapter 13 studio board"
      value={value}
      onValueChange={setValue}
      columns={columns}
      getItemId={(page) => page.id}
      getItemLabel={(page) => page.title}
    >
      {columns.map((column) => (
        <KanbanColumn
          key={column.id}
          id={column.id}
          footer={
            <LimitNote count={value[column.id]?.length ?? 0} limit={limits[column.id] ?? 0} />
          }
        >
          {(page: Page) => (
            <KanbanCard id={page.id}>
              <PageFace page={page} />
            </KanbanCard>
          )}
        </KanbanColumn>
      ))}
      <KanbanOverlay<Page>>{(page) => <PageFace page={page} />}</KanbanOverlay>
    </Kanban>
  );
}
