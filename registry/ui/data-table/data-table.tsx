"use client";

import {
  type Column,
  type ColumnDef,
  type ColumnFiltersState,
  type ColumnVisibilityState,
  columnFilteringFeature,
  columnVisibilityFeature,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_includesString,
  functionalUpdate,
  metaHelper,
  type PaginationState,
  type Row,
  type RowData,
  type RowSelectionState,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  type SortingState,
  sortFn_alphanumeric,
  sortFn_basic,
  sortFn_datetime,
  sortFn_text,
  type Table as TanStackTable,
  tableFeatures,
  type Updater,
  useTable,
} from "@tanstack/react-table";
import { cn } from "cn";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  ChevronsUpDownIcon,
  EyeOffIcon,
  Settings2Icon,
  XIcon,
} from "lucide-react";
import * as React from "react";
import { InkFrame } from "@/components/ink-frame";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// mangacn data-table: the pieces of shadcn/ui's data-table guide (MIT, https://ui.shadcn.com),
// ported to TanStack Table v9 and drawn with mangacn's items: `table` in an ink frame, the
// column menus on `dropdown-menu`, `checkbox` for selection, `select` for the page size. The
// library is the engine only; no stylesheet of its own. Every sort, filter, page and selection
// made through these pieces is announced in one polite status line.

/** What a column can carry for the table's own words. */
export interface DataTableColumnMeta {
  /** The column's name in menus and announcements; else a string `header`, else the id. */
  label?: string;
}

/**
 * The TanStack Table v9 features every data table registers: sorting, a column filter, column
 * visibility, row selection and pagination, with their client row models. Type your columns
 * with it: `createColumnHelper<DataTableFeatures, Chapter>()`.
 */
export const dataTableFeatures = tableFeatures({
  columnFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  filterFns: { includesString: filterFn_includesString },
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
    basic: sortFn_basic,
    datetime: sortFn_datetime,
    text: sortFn_text,
  },
  columnVisibilityFeature,
  rowSelectionFeature,
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
  columnMeta: metaHelper<DataTableColumnMeta>(),
});

export type DataTableFeatures = typeof dataTableFeatures;

/** A column of a data table: TanStack's `ColumnDef` over `DataTableFeatures`. */
export type DataTableColumnDef<TData extends RowData, TValue = unknown> = ColumnDef<
  DataTableFeatures,
  TData,
  TValue
>;

/** The table instance the pieces take: TanStack's `Table` over `DataTableFeatures`. */
export type DataTableInstance<TData extends RowData> = TanStackTable<DataTableFeatures, TData>;

/** The state a data table keeps; each slice can be controlled through `state`. */
export interface DataTableState {
  sorting: SortingState;
  columnFilters: ColumnFiltersState;
  pagination: PaginationState;
  columnVisibility: ColumnVisibilityState;
  rowSelection: RowSelectionState;
}

/** What the status line says next; its words are read from the table when it renders. */
type Announcement =
  | { kind: "sort" | "filter" | "page" | "page-size" | "select" }
  | { kind: "hide"; label: string };

const AnnounceContext = React.createContext<(announcement: Announcement) => void>(() => {});

function columnLabel<TData extends RowData, TValue>(
  column: Column<DataTableFeatures, TData, TValue>,
): string {
  const header = column.columnDef.header;
  return column.columnDef.meta?.label ?? (typeof header === "string" ? header : column.id);
}

/** Classes that pin the first visible column while the rest scroll under it. */
const PINNED_FIRST =
  "first:sticky first:start-0 first:z-1 first:bg-paper group-hover/row:first:bg-[color-mix(in_oklab,var(--muted)_50%,var(--paper))] group-data-[state=selected]/row:first:bg-muted";

export interface DataTableColumnHeaderProps<TData extends RowData, TValue>
  extends React.ComponentProps<"div"> {
  /** The column, from the header context: `header: ({ column }) => …`. */
  column: Column<DataTableFeatures, TData, TValue>;
  /** The visible title; defaults to the column's `meta.label`, its string header or its id. */
  title?: string;
}

/**
 * A column's header with a menu to sort it ascending or descending, or to hide it. A column
 * that can do neither shows its title alone.
 */
export function DataTableColumnHeader<TData extends RowData, TValue>({
  column,
  title,
  className,
  ...props
}: DataTableColumnHeaderProps<TData, TValue>) {
  const announce = React.useContext(AnnounceContext);
  const trigger = React.useRef<HTMLButtonElement>(null);
  // Set by Hide: the column goes once the menu has closed, and focus goes to the table region.
  const hiding = React.useRef<{ table: HTMLElement | null } | null>(null);
  const label = title ?? columnLabel(column);
  const canSort = column.getCanSort();
  const canHide = column.getCanHide();
  if (!canSort && !canHide) {
    return (
      <div data-slot="data-table-column-header" className={className} {...props}>
        {label}
      </div>
    );
  }
  const sorted = column.getIsSorted();
  const sort = (desc: boolean) => {
    column.toggleSorting(desc);
    announce({ kind: "sort" });
  };
  // The menu and its trigger leave with the column, so the column is hidden once the menu has
  // closed, and focus goes to the table instead of the trigger (whichever comes first).
  const hide = () => {
    hiding.current = {
      table: trigger.current?.closest<HTMLElement>('[data-slot="table-container"]') ?? null,
    };
  };
  const closed = (open: boolean) => {
    const pending = hiding.current;
    if (open || !pending) {
      hiding.current = null;
      return;
    }
    column.toggleVisibility(false);
    announce({ kind: "hide", label });
    pending.table?.focus();
  };
  return (
    <div
      data-slot="data-table-column-header"
      className={cn("flex items-center gap-2", className)}
      {...props}
    >
      <DropdownMenu onOpenChangeComplete={closed}>
        <DropdownMenuTrigger
          ref={trigger}
          render={<Button variant="ghost" size="sm" className="-ms-2.5 h-8" />}
        >
          <span>{label}</span>
          {sorted === "desc" ? (
            <ArrowDownIcon />
          ) : sorted === "asc" ? (
            <ArrowUpIcon />
          ) : (
            <ChevronsUpDownIcon className="text-muted-foreground" />
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-36" finalFocus={() => hiding.current?.table ?? true}>
          <DropdownMenuGroup>
            {canSort && (
              <>
                <DropdownMenuItem onClick={() => sort(false)}>
                  <ArrowUpIcon />
                  Ascending
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => sort(true)}>
                  <ArrowDownIcon />
                  Descending
                </DropdownMenuItem>
              </>
            )}
            {canSort && canHide && <DropdownMenuSeparator />}
            {canHide && (
              <DropdownMenuItem onClick={hide}>
                <EyeOffIcon />
                Hide
              </DropdownMenuItem>
            )}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export interface DataTableViewOptionsProps<TData extends RowData> {
  table: DataTableInstance<TData>;
}

/** A "View" menu that shows or hides each column that has data and can be hidden. */
export function DataTableViewOptions<TData extends RowData>({
  table,
}: DataTableViewOptionsProps<TData>) {
  const columns = table
    .getAllLeafColumns()
    .filter((column) => column.accessorFn !== undefined && column.getCanHide());
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="outline" size="sm" className="ms-auto" />}
        data-slot="data-table-view-options"
      >
        <Settings2Icon />
        View
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
          {columns.map((column) => (
            <DropdownMenuCheckboxItem
              key={column.id}
              checked={column.getIsVisible()}
              onCheckedChange={(checked) => column.toggleVisibility(checked)}
            >
              {columnLabel(column)}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export interface DataTableToolbarProps<TData extends RowData> extends React.ComponentProps<"div"> {
  table: DataTableInstance<TData>;
  /** The id of the column the text field filters; no field without it. */
  filterColumn?: string;
  /** The field's placeholder; defaults to "Filter {label}…". */
  filterPlaceholder?: string;
}

/**
 * The row above the table: a filter field with a reset button, then your own controls (the
 * children), then the View menu. It wraps at narrow widths.
 */
export function DataTableToolbar<TData extends RowData>({
  table,
  filterColumn,
  filterPlaceholder,
  className,
  children,
  ...props
}: DataTableToolbarProps<TData>) {
  const announce = React.useContext(AnnounceContext);
  const column = filterColumn ? table.getColumn(filterColumn) : undefined;
  const label = column ? columnLabel(column) : "";
  const filtered = table.atoms.columnFilters.get().length > 0;
  return (
    <div
      data-slot="data-table-toolbar"
      className={cn("flex flex-wrap items-center gap-2", className)}
      {...props}
    >
      {column && (
        <div className="w-full sm:w-64">
          <Input
            type="search"
            aria-label={`Filter by ${label}`}
            placeholder={filterPlaceholder ?? `Filter ${label.toLowerCase()}…`}
            value={(column.getFilterValue() as string | undefined) ?? ""}
            onChange={(event) => {
              column.setFilterValue(event.target.value);
              // A new filter starts from the first page, even with autoResetPageIndex off.
              table.setPageIndex(0);
              announce({ kind: "filter" });
            }}
          />
        </div>
      )}
      {filtered && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            table.resetColumnFilters();
            table.setPageIndex(0);
            announce({ kind: "filter" });
          }}
        >
          Reset
          <XIcon data-icon="inline-end" />
        </Button>
      )}
      {children}
      <DataTableViewOptions table={table} />
    </div>
  );
}

export interface DataTablePaginationProps<TData extends RowData>
  extends React.ComponentProps<"div"> {
  table: DataTableInstance<TData>;
  /**
   * The choices of the "Rows per page" select.
   * @default [10, 20, 30, 40, 50]
   */
  pageSizes?: number[];
}

/**
 * The row under the table: how many rows are selected (or shown), rows per page, page n of m,
 * and first / previous / next / last. It wraps at narrow widths.
 */
export function DataTablePagination<TData extends RowData>({
  table,
  pageSizes = [10, 20, 30, 40, 50],
  className,
  ...props
}: DataTablePaginationProps<TData>) {
  const announce = React.useContext(AnnounceContext);
  const sizeLabel = React.useId();
  const { pageIndex, pageSize } = table.atoms.pagination.get();
  const pageCount = Math.max(table.getPageCount(), 1);
  const rowCount = table.getRowCount();
  const selectable = table.getAllLeafColumns().some((column) => column.id === "select");
  const go = (move: () => void) => () => {
    move();
    announce({ kind: "page" });
  };
  return (
    <div
      data-slot="data-table-pagination"
      className={cn(
        "flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-sm",
        className,
      )}
      {...props}
    >
      <p className="text-muted-foreground">
        {selectable
          ? `${selectedCount(table)} of ${serverOwned(table) ? rowCount : table.getFilteredRowModel().rows.length} selected`
          : `${rowCount} ${rowCount === 1 ? "row" : "rows"}`}
      </p>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <div className="flex items-center gap-2">
          <span id={sizeLabel}>Rows per page</span>
          <Select
            items={pageSizes.map((size) => ({ label: String(size), value: size }))}
            value={pageSize}
            onValueChange={(size) => {
              if (size === null) return;
              table.setPageSize(size);
              announce({ kind: "page-size" });
            }}
          >
            <SelectTrigger size="sm" aria-labelledby={sizeLabel} className="w-18">
              <SelectValue />
            </SelectTrigger>
            <SelectContent side="top">
              {pageSizes.map((size) => (
                <SelectItem key={size} value={size}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="tabular-nums">
          Page {pageIndex + 1} of {pageCount}
        </p>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="First page"
            focusableWhenDisabled
            disabled={!table.getCanPreviousPage()}
            onClick={go(() => table.firstPage())}
          >
            <ChevronsLeftIcon />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Previous page"
            focusableWhenDisabled
            disabled={!table.getCanPreviousPage()}
            onClick={go(() => table.previousPage())}
          >
            <ChevronLeftIcon />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Next page"
            focusableWhenDisabled
            disabled={!table.getCanNextPage()}
            onClick={go(() => table.nextPage())}
          >
            <ChevronRightIcon />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Last page"
            focusableWhenDisabled
            disabled={!table.getCanNextPage()}
            onClick={go(() => table.lastPage())}
          >
            <ChevronsRightIcon />
          </Button>
        </div>
      </div>
    </div>
  );
}

function DataTableSelectAll<TData extends RowData>({ table }: { table: DataTableInstance<TData> }) {
  const announce = React.useContext(AnnounceContext);
  const all = table.getIsAllPageRowsSelected();
  return (
    <Checkbox
      aria-label="Select all rows on this page"
      checked={all}
      indeterminate={!all && table.getIsSomePageRowsSelected()}
      onCheckedChange={(checked) => {
        table.toggleAllPageRowsSelected(checked);
        announce({ kind: "select" });
      }}
      className={MIXED}
    />
  );
}

/** The shipped checkbox draws a check; a mixed box hides it and shows a paper dash instead. */
const MIXED =
  "data-indeterminate:bg-primary data-indeterminate:text-primary-foreground data-indeterminate:[&_.lucide]:hidden data-indeterminate:before:absolute data-indeterminate:before:h-0.5 data-indeterminate:before:w-2 data-indeterminate:before:rounded-full data-indeterminate:before:bg-current";

function DataTableSelectRow<TData extends RowData>({
  row,
  label,
}: {
  row: Row<DataTableFeatures, TData>;
  label: string;
}) {
  const announce = React.useContext(AnnounceContext);
  return (
    <Checkbox
      aria-label={`Select ${label}`}
      checked={row.getIsSelected()}
      disabled={!row.getCanSelect()}
      onCheckedChange={(checked) => {
        row.toggleSelected(checked);
        announce({ kind: "select" });
      }}
    />
  );
}

/**
 * The checkbox column: a select-all box in the header (mixed when some rows of the page are
 * picked) and a box per row, named "Select {getRowLabel(row)}". Its id is `select`.
 */
export function createSelectColumn<TData extends RowData>({
  getRowLabel,
}: {
  /** The row's name in its checkbox's label; defaults to "row {n}". */
  getRowLabel?: (row: TData) => string;
} = {}): DataTableColumnDef<TData> {
  return {
    id: "select",
    header: ({ table }) => <DataTableSelectAll table={table} />,
    cell: ({ row }) => (
      <DataTableSelectRow
        row={row}
        label={getRowLabel ? getRowLabel(row.original) : `row ${row.index + 1}`}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  };
}

/** Whether the server owns the rows' filtering or paging, so only the ids are known. */
function serverOwned<TData extends RowData>(table: DataTableInstance<TData>): boolean {
  return Boolean(table.options.manualPagination || table.options.manualFiltering);
}

/**
 * The picked rows the reader can reach: those the filter shows (stock's count), or every picked
 * id when the server owns the filter or the pages.
 */
function selectedCount<TData extends RowData>(table: DataTableInstance<TData>): number {
  return serverOwned(table)
    ? table.getSelectedRowIds().length
    : table.getFilteredSelectedRowModel().rows.length;
}

/** One slice of state, held here unless `controlled` holds it; `onChange` hears every change. */
function useSlice<T>(controlled: T | undefined, initial: T, onChange?: (value: T) => void) {
  const [own, setOwn] = React.useState(initial);
  const value = controlled ?? own;
  // Two updates before a re-render (setPageSize then setPageIndex) each build on the one before.
  const latest = React.useRef(value);
  latest.current = value;
  const update = (updater: Updater<T>) => {
    const next = functionalUpdate(updater, latest.current);
    if (Object.is(next, latest.current)) return;
    latest.current = next;
    if (controlled === undefined) setOwn(next);
    onChange?.(next);
  };
  return [value, update] as const;
}

export interface DataTableProps<TData extends RowData> {
  /**
   * The columns, from `createColumnHelper<DataTableFeatures, TData>().columns([…])`;
   * `createSelectColumn()` adds the checkboxes.
   */
  // biome-ignore lint/suspicious/noExplicitAny: each column keeps its own value type, as helper.columns() returns them.
  columns: DataTableColumnDef<TData, any>[];
  /** The rows: every row, or one page of them with `manualPagination`. */
  data: TData[];
  /**
   * The table's accessible name, read when its scroll region takes focus.
   * @default "Table"
   */
  label?: string;
  /** The id of the column the toolbar's text field filters. */
  filterColumn?: string;
  /** The filter field's placeholder; defaults to "Filter {label}…". */
  filterPlaceholder?: string;
  /** Your controls in the toolbar, between the filter and the View menu (bulk actions). */
  toolbar?: (table: DataTableInstance<TData>) => React.ReactNode;
  /**
   * The choices of the "Rows per page" select.
   * @default [10, 20, 30, 40, 50]
   */
  pageSizes?: number[];
  /** A stable id per row (keeps the selection when rows move); defaults to the row's index. */
  getRowId?: (row: TData, index: number) => string;
  /** The state at first: a sort, filters, a page size, hidden columns, picked rows. */
  initialState?: Partial<DataTableState>;
  /** Controlled slices of state; pair each with its `on…Change`. */
  state?: Partial<DataTableState>;
  onSortingChange?: (sorting: SortingState) => void;
  onColumnFiltersChange?: (columnFilters: ColumnFiltersState) => void;
  onPaginationChange?: (pagination: PaginationState) => void;
  onColumnVisibilityChange?: (columnVisibility: ColumnVisibilityState) => void;
  /** Hears every selection change, keyed by row id; works without `state.rowSelection`. */
  onRowSelectionChange?: (rowSelection: RowSelectionState) => void;
  /** `data` comes sorted by the server, from `state.sorting`. */
  manualSorting?: boolean;
  /** `data` comes filtered by the server, from `state.columnFilters`. */
  manualFiltering?: boolean;
  /** `data` is one page, from `state.pagination`; give `rowCount` too. */
  manualPagination?: boolean;
  /** Every row on the server, for page n of m under `manualPagination`. */
  rowCount?: number;
  /**
   * Goes back to the first page when the data or the filter changes; `false` keeps the page.
   * @default true (false with `manualPagination`)
   */
  autoResetPageIndex?: boolean;
  /** Marks the rows busy (`aria-busy`) and mutes them while a page loads. */
  loading?: boolean;
  /** Classes for the root, a column of toolbar, table and pagination. */
  className?: string;
}

/**
 * A table over TanStack Table v9 with sorting, a column filter, column visibility, row
 * selection and pagination, in an ink frame. The first column stays pinned while the rest
 * scroll sideways. The pieces (`DataTableColumnHeader`, `DataTableToolbar`,
 * `DataTablePagination`, `createSelectColumn`) announce their changes only inside `DataTable`,
 * which holds the status line; used elsewhere, or through `table.*` calls, they stay silent.
 */
export function DataTable<TData extends RowData>({
  columns,
  data,
  label,
  filterColumn,
  filterPlaceholder,
  toolbar,
  pageSizes,
  getRowId,
  initialState,
  state,
  onSortingChange,
  onColumnFiltersChange,
  onPaginationChange,
  onColumnVisibilityChange,
  onRowSelectionChange,
  manualSorting,
  manualFiltering,
  manualPagination,
  rowCount,
  autoResetPageIndex,
  loading,
  className,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useSlice(
    state?.sorting,
    initialState?.sorting ?? [],
    onSortingChange,
  );
  const [columnFilters, setColumnFilters] = useSlice(
    state?.columnFilters,
    initialState?.columnFilters ?? [],
    onColumnFiltersChange,
  );
  const [pagination, setPagination] = useSlice(
    state?.pagination,
    initialState?.pagination ?? { pageIndex: 0, pageSize: pageSizes?.[0] ?? 10 },
    onPaginationChange,
  );
  const [columnVisibility, setColumnVisibility] = useSlice(
    state?.columnVisibility,
    initialState?.columnVisibility ?? {},
    onColumnVisibilityChange,
  );
  const [rowSelection, setRowSelection] = useSlice(
    state?.rowSelection,
    initialState?.rowSelection ?? {},
    onRowSelectionChange,
  );
  const table = useTable({
    features: dataTableFeatures,
    columns,
    data,
    getRowId,
    state: { sorting, columnFilters, pagination, columnVisibility, rowSelection },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    manualSorting,
    manualFiltering,
    manualPagination,
    rowCount,
    autoResetPageIndex,
  });

  // Nothing is said on load; each change through the pieces says its result.
  const [announcement, setAnnouncement] = React.useState<Announcement | null>(null);
  const rows = table.getRowModel().rows;
  const columnCount = table.getVisibleLeafColumns().length;

  return (
    <AnnounceContext.Provider value={setAnnouncement}>
      <div data-slot="data-table" className={cn("flex w-full min-w-0 flex-col gap-3", className)}>
        <DataTableToolbar
          table={table}
          filterColumn={filterColumn}
          filterPlaceholder={filterPlaceholder}
        >
          {toolbar?.(table)}
        </DataTableToolbar>
        <div data-slot="data-table-frame" className="relative isolate w-full min-w-0 px-2 py-1">
          <InkFrame
            as="span"
            fill="paper"
            className="pointer-events-none absolute inset-0 -z-1 rounded-lg"
          />
          <Table
            label={label}
            aria-busy={loading || undefined}
            className="aria-busy:text-muted-foreground"
          >
            <TableHeader>
              {table.getHeaderGroups().map((group) => (
                <TableRow key={group.id} className="group/row">
                  {group.headers.map((header) => {
                    const sorted = header.column.getIsSorted();
                    return (
                      <TableHead
                        key={header.id}
                        colSpan={header.colSpan}
                        aria-sort={
                          sorted === "asc"
                            ? "ascending"
                            : sorted === "desc"
                              ? "descending"
                              : undefined
                        }
                        className={PINNED_FIRST}
                      >
                        {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {rows.length > 0 ? (
                rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() ? "selected" : undefined}
                    className="group/row"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className={PINNED_FIRST}>
                        <table.FlexRender cell={cell} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow className="group/row">
                  <TableCell colSpan={columnCount} className="h-24 text-center">
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <DataTablePagination table={table} pageSizes={pageSizes} />
        <p data-slot="data-table-status" role="status" className="sr-only">
          {statusText(announcement, table, manualFiltering)}
        </p>
      </div>
    </AnnounceContext.Provider>
  );
}

/** The status line's words for the last change, read from the table as it is now. */
function statusText<TData extends RowData>(
  announcement: Announcement | null,
  table: DataTableInstance<TData>,
  manualFiltering: boolean | undefined,
): string {
  if (!announcement) return "";
  const sorting = table.atoms.sorting.get();
  const pagination = table.atoms.pagination.get();
  const page = `page ${pagination.pageIndex + 1} of ${Math.max(table.getPageCount(), 1)}`;
  switch (announcement.kind) {
    case "sort": {
      const [sort] = sorting;
      const column = sort ? table.getColumn(sort.id) : undefined;
      if (!sort || !column) return "Sorting cleared";
      return `Sorted by ${columnLabel(column)}, ${sort.desc ? "descending" : "ascending"}`;
    }
    case "filter": {
      const shown = table.getRowCount();
      if (manualFiltering) return `${shown} ${shown === 1 ? "row" : "rows"}`;
      return `${shown} of ${table.getCoreRowModel().rows.length} rows`;
    }
    case "page":
      return page.charAt(0).toUpperCase() + page.slice(1);
    case "page-size":
      return `${pagination.pageSize} rows per page, ${page}`;
    case "select": {
      const count = selectedCount(table);
      return count === 0 ? "No rows selected" : `${count} selected`;
    }
    case "hide":
      return `${announcement.label} hidden`;
  }
}
