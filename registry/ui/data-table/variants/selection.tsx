"use client";

import { createColumnHelper, type RowSelectionState } from "@tanstack/react-table";
import * as React from "react";
import { Badge } from "@/registry/ui/badge/badge";
import { Button } from "@/registry/ui/button/button";
import {
  createSelectColumn,
  DataTable,
  DataTableColumnHeader,
  type DataTableFeatures,
} from "@/registry/ui/data-table/data-table";

interface Page {
  id: string;
  page: number;
  scene: string;
  stage: "Pencils" | "Inks" | "Tones" | "Done";
}

const pages: Page[] = [
  { id: "p01", page: 1, scene: "Cold open on the platform", stage: "Done" },
  { id: "p02", page: 2, scene: "The conductor's whistle", stage: "Done" },
  { id: "p03", page: 3, scene: "Aiko boards the train", stage: "Tones" },
  { id: "p04", page: 4, scene: "Window seat, rain", stage: "Tones" },
  { id: "p05", page: 5, scene: "The stranger's umbrella", stage: "Inks" },
  { id: "p06", page: 6, scene: "Tunnel, lights out", stage: "Inks" },
  { id: "p07", page: 7, scene: "A name on the ticket", stage: "Pencils" },
  { id: "p08", page: 8, scene: "Last stop", stage: "Pencils" },
];

const helper = createColumnHelper<DataTableFeatures, Page>();

const columns = helper.columns([
  createSelectColumn<Page>({ getRowLabel: (page) => `page ${page.page}` }),
  helper.accessor("page", {
    meta: { label: "Page" },
    header: ({ column }) => <DataTableColumnHeader column={column} />,
    enableHiding: false,
  }),
  helper.accessor("scene", {
    meta: { label: "Scene" },
    header: ({ column }) => <DataTableColumnHeader column={column} />,
  }),
  helper.accessor("stage", {
    meta: { label: "Stage" },
    header: ({ column }) => <DataTableColumnHeader column={column} />,
    cell: ({ getValue }) => {
      const stage = getValue();
      return <Badge variant={stage === "Done" ? "secondary" : "outline"}>{stage}</Badge>;
    },
  }),
]);

export default function DataTableSelectionVariant() {
  const [data, setData] = React.useState(pages);
  const [selection, setSelection] = React.useState<RowSelectionState>({});
  const [done, setDone] = React.useState("");
  const picked = Object.keys(selection).filter((id) => selection[id]);

  const markDone = () => {
    setData((rows) => rows.map((row) => (selection[row.id] ? { ...row, stage: "Done" } : row)));
    setDone(`Marked ${picked.length} ${picked.length === 1 ? "page" : "pages"} done.`);
    setSelection({});
  };

  return (
    <div className="flex w-full max-w-2xl flex-col gap-2">
      <DataTable
        label="Chapter 12 pages"
        columns={columns}
        data={data}
        getRowId={(row) => row.id}
        filterColumn="scene"
        pageSizes={[5, 10]}
        state={{ rowSelection: selection }}
        onRowSelectionChange={setSelection}
        autoResetPageIndex={false}
        toolbar={() => (
          <Button size="sm" focusableWhenDisabled disabled={picked.length === 0} onClick={markDone}>
            Mark done{picked.length > 0 ? ` (${picked.length})` : ""}
          </Button>
        )}
      />
      <p role="status" className="text-sm text-muted-foreground">
        {done}
      </p>
    </div>
  );
}
