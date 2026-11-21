"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { Badge } from "@/registry/ui/badge/badge";
import {
  DataTable,
  DataTableColumnHeader,
  type DataTableFeatures,
} from "@/registry/ui/data-table/data-table";

interface Chapter {
  number: number;
  title: string;
  status: "Published" | "Lettering" | "Inking" | "Pencils";
  pages: number;
  /** A date literal: the table never reads the clock. */
  date: string;
}

const chapters: Chapter[] = [
  { number: 1, title: "The paper crane", status: "Published", pages: 46, date: "2026-01-09" },
  { number: 2, title: "Rain on Kamo river", status: "Published", pages: 22, date: "2026-02-06" },
  { number: 3, title: "Night market", status: "Published", pages: 20, date: "2026-03-06" },
  { number: 4, title: "The ferry", status: "Published", pages: 19, date: "2026-04-03" },
  { number: 5, title: "Two umbrellas", status: "Published", pages: 21, date: "2026-05-08" },
  { number: 6, title: "Lantern festival", status: "Published", pages: 20, date: "2026-06-05" },
  { number: 7, title: "Ink and ash", status: "Published", pages: 18, date: "2026-07-03" },
  { number: 8, title: "The rooftop", status: "Published", pages: 22, date: "2026-08-07" },
  { number: 9, title: "Shrine steps", status: "Published", pages: 20, date: "2026-09-04" },
  { number: 10, title: "First snow", status: "Lettering", pages: 19, date: "2026-10-02" },
  { number: 11, title: "Paper walls", status: "Inking", pages: 18, date: "2026-11-06" },
  { number: 12, title: "The last train", status: "Pencils", pages: 24, date: "2026-12-04" },
];

const helper = createColumnHelper<DataTableFeatures, Chapter>();

const columns = helper.columns([
  helper.accessor("number", {
    meta: { label: "No." },
    header: ({ column }) => <DataTableColumnHeader column={column} />,
    enableHiding: false,
  }),
  helper.accessor("title", {
    meta: { label: "Title" },
    header: ({ column }) => <DataTableColumnHeader column={column} />,
  }),
  helper.accessor("status", {
    meta: { label: "Status" },
    header: ({ column }) => <DataTableColumnHeader column={column} />,
    cell: ({ getValue }) => {
      const status = getValue();
      return <Badge variant={status === "Published" ? "secondary" : "outline"}>{status}</Badge>;
    },
  }),
  helper.accessor("pages", {
    meta: { label: "Pages" },
    header: ({ column }) => <DataTableColumnHeader column={column} />,
  }),
  helper.accessor("date", {
    meta: { label: "Release" },
    header: ({ column }) => <DataTableColumnHeader column={column} />,
    cell: ({ getValue }) => <time dateTime={getValue()}>{getValue()}</time>,
  }),
]);

export default function DataTableDefaultDemo() {
  return (
    <div className="w-full max-w-2xl">
      <DataTable
        label="Series chapters"
        columns={columns}
        data={chapters}
        filterColumn="title"
        pageSizes={[5, 10, 20]}
      />
    </div>
  );
}
