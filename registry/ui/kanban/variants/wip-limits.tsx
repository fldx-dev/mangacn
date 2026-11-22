"use client";

import { TriangleAlertIcon } from "lucide-react";
import * as React from "react";
import {
  Kanban,
  KanbanCard,
  KanbanColumn,
  type KanbanColumnDef,
  KanbanOverlay,
} from "@/registry/ui/kanban/kanban";

// A small studio's week: each column has a work limit, shown in its footer. The limit warns, it
// does not block: Pencils starts one card over, and moving a card out clears the warning.
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

const limits: Record<string, number> = { pencils: 2, inks: 2, review: 2 };

const initial: Record<string, Page[]> = {
  pencils: [
    { id: "p15", title: "Page 15", assistant: "Haru" },
    { id: "p16", title: "Page 16", assistant: "Ren" },
    { id: "p17", title: "Page 17", assistant: "Haru" },
  ],
  inks: [{ id: "p14", title: "Page 14", assistant: "Mei" }],
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
    // Small text in spot falls under 4.5:1, so the warning is ink with a spot icon beside it.
    <p
      role="status"
      className={
        over
          ? "flex items-center gap-1 text-xs font-medium text-foreground"
          : "text-xs text-muted-foreground"
      }
    >
      {over ? <TriangleAlertIcon aria-hidden className="size-3.5 shrink-0 text-spot" /> : null}
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
