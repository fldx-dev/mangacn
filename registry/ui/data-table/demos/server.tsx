"use client";

import { createColumnHelper, type PaginationState, type SortingState } from "@tanstack/react-table";
import * as React from "react";
import {
  DataTable,
  DataTableColumnHeader,
  type DataTableFeatures,
} from "@/registry/ui/data-table/data-table";

interface Chapter {
  number: number;
  title: string;
  pages: number;
}

const ARCS = ["Spring", "Summer", "Autumn", "Winter"];
const PLACES = ["harbour", "shrine", "rooftop", "station", "market", "library"];

// The "server": 48 chapters made from literals (no clock, no randomness), sorted and sliced
// the way a real endpoint would.
const SERVER_ROWS: Chapter[] = Array.from({ length: 48 }, (_, index) => ({
  number: index + 1,
  title: `${ARCS[Math.floor(index / 12)]} at the ${PLACES[index % PLACES.length]}`,
  pages: 18 + ((index * 7) % 11),
}));

function query(sorting: SortingState, { pageIndex, pageSize }: PaginationState) {
  const [sort] = sorting;
  const rows = [...SERVER_ROWS];
  if (sort) {
    const key = sort.id as keyof Chapter;
    rows.sort((a, b) => {
      const order = a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0;
      return sort.desc ? -order : order;
    });
  }
  return rows.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);
}

/** How long the pretend server takes to answer. */
const LATENCY = 600;

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
  helper.accessor("pages", {
    meta: { label: "Pages" },
    header: ({ column }) => <DataTableColumnHeader column={column} />,
  }),
]);

const FIRST_PAGE: PaginationState = { pageIndex: 0, pageSize: 5 };

export default function DataTableServerDemo() {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState(FIRST_PAGE);
  // The first page is there on the server render; later pages arrive after the latency.
  const [rows, setRows] = React.useState(() => query([], FIRST_PAGE));
  const [loading, setLoading] = React.useState(false);
  const request = React.useRef<ReturnType<typeof setTimeout>>(undefined);

  React.useEffect(() => () => clearTimeout(request.current), []);

  // Called from the sort menu and the page buttons: the timer starts from that click, and the
  // latest request wins.
  const load = (nextSorting: SortingState, nextPagination: PaginationState) => {
    setLoading(true);
    clearTimeout(request.current);
    request.current = setTimeout(() => {
      setRows(query(nextSorting, nextPagination));
      setLoading(false);
    }, LATENCY);
  };

  return (
    <div className="w-full max-w-xl">
      <DataTable
        label="Chapters on the server"
        columns={columns}
        data={rows}
        manualSorting
        manualPagination
        rowCount={SERVER_ROWS.length}
        pageSizes={[5, 10, 20]}
        loading={loading}
        state={{ sorting, pagination }}
        onSortingChange={(next) => {
          // A new order starts again from the first page.
          const page = { ...pagination, pageIndex: 0 };
          setSorting(next);
          setPagination(page);
          load(next, page);
        }}
        onPaginationChange={(next) => {
          setPagination(next);
          load(sorting, next);
        }}
      />
    </div>
  );
}
