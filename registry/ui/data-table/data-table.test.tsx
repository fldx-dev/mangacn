import { readFileSync } from "node:fs";
import { createColumnHelper } from "@tanstack/react-table";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { expectVariantsAccessible } from "@/lib/test/axe";
import {
  createSelectColumn,
  DataTable,
  DataTableColumnHeader,
  type DataTableFeatures,
} from "./data-table";
import DefaultVariant from "./variants/default";
import SelectionVariant from "./variants/selection";
import ServerVariant from "./variants/server";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const status = () => document.querySelector('[data-slot="data-table-status"]')?.textContent;
const bodyRows = () => within(screen.getAllByRole("rowgroup")[1]).getAllByRole("row");
const firstCells = () => bodyRows().map((row) => row.querySelector("td")?.textContent);
const header = (name: string) => screen.getByRole("columnheader", { name: new RegExp(name) });

async function pick(trigger: string, item: string) {
  fireEvent.click(screen.getByRole("button", { name: trigger }));
  await act(async () => {});
  fireEvent.click(screen.getByRole("menuitem", { name: item }));
  await act(async () => {});
}

async function click(name: string) {
  fireEvent.click(screen.getByRole("button", { name }));
  await act(async () => {});
}

describe("DataTable", () => {
  expectVariantsAccessible(import.meta.glob("./variants/*.tsx"));

  it("renders the table in its frame with slots, a named region and a silent status", () => {
    render(<DefaultVariant />);
    const root = document.querySelector('[data-slot="data-table"]');
    expect(root?.querySelector('[data-slot="data-table-toolbar"]')).not.toBeNull();
    expect(root?.querySelector('[data-slot="data-table-pagination"]')).not.toBeNull();
    const frame = root?.querySelector('[data-slot="data-table-frame"]');
    expect(frame?.firstElementChild?.getAttribute("data-slot")).toBe("ink-frame");
    expect(screen.getByRole("region", { name: "Series chapters" })).toBeTruthy();
    expect(screen.getAllByRole("columnheader")).toHaveLength(5);
    expect(bodyRows()).toHaveLength(5);
    expect(screen.getByText("Page 1 of 3")).toBeTruthy();
    expect(screen.getByRole("status").textContent).toBe("");
    // No header is sorted yet, so none carries aria-sort.
    expect(document.querySelector("th[aria-sort]")).toBeNull();
  });

  it("fits a narrow, content-sized parent: the rows wrap and the frame adds no minimum width", () => {
    render(<DefaultVariant />);
    for (const slot of ["data-table-toolbar", "data-table-pagination"]) {
      const row = document.querySelector(`[data-slot="${slot}"]`);
      expect(row?.classList.contains("flex-wrap")).toBe(true);
    }
    // A one-column grid track of minmax(0, 1fr): the frame's min-content is zero, so the table
    // scrolls inside it instead of widening a w-fit or flex-row parent past the viewport.
    const frame = document.querySelector('[data-slot="data-table-frame"]');
    expect(frame?.classList.contains("grid")).toBe(true);
    expect(frame?.classList.contains("grid-cols-[minmax(0,1fr)]")).toBe(true);
  });

  it("pins the first column: every first cell is sticky at the start", () => {
    render(<DefaultVariant />);
    for (const cell of document.querySelectorAll("th, td")) {
      expect(cell.className).toContain("first:sticky");
      expect(cell.className).toContain("first:start-0");
    }
  });

  it("sorts from the column menu, sets aria-sort and announces the order", async () => {
    render(<DefaultVariant />);
    await pick("Title", "Ascending");
    expect(header("Title").getAttribute("aria-sort")).toBe("ascending");
    expect(status()).toBe("Sorted by Title, ascending");
    expect(bodyRows()[0].textContent).toContain("First snow");

    await pick("Pages", "Descending");
    expect(header("Pages").getAttribute("aria-sort")).toBe("descending");
    expect(header("Title").hasAttribute("aria-sort")).toBe(false);
    expect(status()).toBe("Sorted by Pages, descending");
    expect(firstCells()[0]).toBe("1");
  });

  it("filters from the toolbar, announces the count and resets", async () => {
    render(<DefaultVariant />);
    const field = screen.getByRole("searchbox", { name: "Filter by Title" });
    fireEvent.change(field, { target: { value: "the" } });
    await act(async () => {});
    expect(status()).toBe("4 of 12 rows");
    expect(firstCells()).toEqual(["1", "4", "8", "12"]);

    fireEvent.change(field, { target: { value: "zzz" } });
    await act(async () => {});
    expect(status()).toBe("0 of 12 rows");
    expect(screen.getByText("No results.")).toBeTruthy();

    await click("Reset");
    expect(status()).toBe("12 of 12 rows");
    expect((field as HTMLInputElement).value).toBe("");
  });

  it("pages with the buttons and announces page n of m; a filter's page reset says the count", async () => {
    render(<DefaultVariant />);
    expect(
      screen.getByRole("button", { name: "Previous page" }).getAttribute("aria-disabled"),
    ).toBe("true");
    await click("Next page");
    expect(status()).toBe("Page 2 of 3");
    expect(firstCells()[0]).toBe("6");
    await click("Last page");
    expect(status()).toBe("Page 3 of 3");
    // The disabled button keeps focus rather than dropping it to the body.
    expect(screen.getByRole("button", { name: "Next page" }).getAttribute("aria-disabled")).toBe(
      "true",
    );
    await click("First page");
    expect(firstCells()[0]).toBe("1");

    await click("Next page");
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "a" } });
    await act(async () => {});
    expect(screen.getByText(/^Page 1 of/)).toBeTruthy();
    expect(status()).toMatch(/^\d+ of 12 rows$/);
  });

  it("changes the page size from the select and announces it", async () => {
    render(<DefaultVariant />);
    const trigger = screen.getByRole("combobox", { name: "Rows per page" });
    act(() => trigger.focus());
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    await act(async () => {});
    const option = screen.getByRole("option", { name: "10" });
    act(() => option.focus());
    fireEvent.keyDown(option, { key: "Enter" });
    await act(async () => {});
    expect(bodyRows()).toHaveLength(10);
    expect(status()).toBe("10 rows per page, page 1 of 2");
  });

  it("selects rows by name, shows a mixed select-all and announces the count", async () => {
    render(<SelectionVariant />);
    const all = screen.getByRole("checkbox", { name: "Select all rows on this page" });
    expect(all.getAttribute("aria-checked")).toBe("false");

    fireEvent.click(screen.getByRole("checkbox", { name: "Select page 3" }));
    await act(async () => {});
    expect(status()).toBe("1 selected");
    expect(all.getAttribute("aria-checked")).toBe("mixed");
    expect(all.hasAttribute("data-indeterminate")).toBe(true);
    // Mixed hides the check icon only (not the ink frames' drawings) and shows a dash.
    expect(all.className).toContain("data-indeterminate:[&_.lucide]:hidden");
    expect(all.className).not.toContain("[&_svg]:hidden");
    expect(
      screen.getByRole("checkbox", { name: "Select page 3" }).closest("tr")?.dataset.state,
    ).toBe("selected");
    expect(screen.getByText("1 of 8 selected")).toBeTruthy();

    fireEvent.click(all);
    await act(async () => {});
    expect(all.getAttribute("aria-checked")).toBe("true");
    expect(status()).toBe("5 selected");

    fireEvent.click(all);
    await act(async () => {});
    expect(status()).toBe("No rows selected");
  });

  it("runs a bulk action from the toolbar slot on the selected rows", async () => {
    render(<SelectionVariant />);
    const action = screen.getByRole("button", { name: "Mark done" });
    expect(action.getAttribute("aria-disabled")).toBe("true");
    fireEvent.click(screen.getByRole("checkbox", { name: "Select page 1" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Select page 2" }));
    await act(async () => {});
    await click("Mark done (2)");
    expect(screen.getByText("Marked 2 pages done.")).toBeTruthy();
    expect(screen.getByText("0 of 8 selected")).toBeTruthy();
  });

  it("counts the selected rows the filter shows, of the rows it shows", async () => {
    render(<SelectionVariant />);
    await click("Next page");
    fireEvent.click(screen.getByRole("checkbox", { name: "Select page 6" }));
    await act(async () => {});
    expect(screen.getByText("1 of 8 selected")).toBeTruthy();
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "seat" } });
    await act(async () => {});
    // Page 6 is picked but filtered out; only "Window seat, rain" shows, on page 1 again.
    expect(screen.getByText("Page 1 of 1")).toBeTruthy();
    expect(screen.getByText("0 of 1 selected")).toBeTruthy();
    fireEvent.click(screen.getByRole("checkbox", { name: "Select page 4" }));
    await act(async () => {});
    expect(screen.getByText("1 of 1 selected")).toBeTruthy();
    expect(status()).toBe("1 selected");
  });

  it("keeps the selection through a sort and a filter", async () => {
    render(<SelectionVariant />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Select page 4" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Select page 5" }));
    await act(async () => {});
    await pick("Scene", "Descending");
    expect(
      screen.getByRole("checkbox", { name: "Select page 4" }).getAttribute("aria-checked"),
    ).toBe("true");
    expect(
      screen.getByRole("checkbox", { name: "Select page 5" }).getAttribute("aria-checked"),
    ).toBe("true");
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "the" } });
    await act(async () => {});
    expect(
      screen.getByRole("checkbox", { name: "Select page 5" }).getAttribute("aria-checked"),
    ).toBe("true");
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "" } });
    await act(async () => {});
    expect(screen.getByText("2 of 8 selected")).toBeTruthy();
  });

  it("stays on its page when Mark done changes the data (autoResetPageIndex off)", async () => {
    render(<SelectionVariant />);
    await click("Next page");
    fireEvent.click(screen.getByRole("checkbox", { name: "Select page 7" }));
    await act(async () => {});
    await click("Mark done (1)");
    await act(async () => {});
    expect(screen.getByText("Page 2 of 2")).toBeTruthy();
    expect(firstCells().length).toBe(3);
  });

  it("applies two updates of one slice made before a re-render", async () => {
    const onPaginationChange = vi.fn();
    const helper = createColumnHelper<DataTableFeatures, { id: string; name: string }>();
    const columns = helper.columns([
      createSelectColumn<{ id: string; name: string }>({ getRowLabel: (row) => row.name }),
      helper.accessor("name", { meta: { label: "Name" } }),
    ]);
    const data = Array.from({ length: 30 }, (_, index) => ({
      id: `r${index}`,
      name: `Row ${index}`,
    }));
    render(
      <DataTable
        columns={columns}
        data={data}
        getRowId={(row) => row.id}
        filterColumn="name"
        onPaginationChange={onPaginationChange}
        toolbar={(table) => (
          <>
            <button
              type="button"
              onClick={() => {
                table.setPageSize(20);
                table.setPageIndex(0);
              }}
            >
              Twenty
            </button>
            <button
              type="button"
              onClick={() => {
                table.getRow("r0").toggleSelected(true);
                table.getRow("r1").toggleSelected(true);
              }}
            >
              Two
            </button>
          </>
        )}
      />,
    );
    await click("Twenty");
    expect(bodyRows()).toHaveLength(20);
    await click("Two");
    expect(screen.getByText("2 of 30 selected")).toBeTruthy();

    // A filter's page reset reports the new page once.
    await click("Next page");
    onPaginationChange.mockClear();
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "Row 1" } });
    await act(async () => {});
    expect(onPaginationChange).toHaveBeenCalledTimes(1);
    expect(onPaginationChange).toHaveBeenLastCalledWith({ pageIndex: 0, pageSize: 20 });
  });

  it("hides a column from its menu, moves focus to the table and announces it", async () => {
    render(<DefaultVariant />);
    await pick("Pages", "Hide");
    expect(screen.queryByRole("columnheader", { name: /Pages/ })).toBeNull();
    expect(screen.getAllByRole("columnheader")).toHaveLength(4);
    expect(document.activeElement).toBe(screen.getByRole("region", { name: "Series chapters" }));
    expect(status()).toBe("Pages hidden");
  });

  it("shows and hides columns from the View menu", async () => {
    render(<DefaultVariant />);
    fireEvent.click(screen.getByRole("button", { name: "View" }));
    await act(async () => {});
    const items = screen.getAllByRole("menuitemcheckbox").map((item) => item.textContent);
    // No. cannot be hidden, so it has no toggle.
    expect(items).toEqual(["Title", "Status", "Pages", "Release"]);
    fireEvent.click(screen.getByRole("menuitemcheckbox", { name: "Status" }));
    await act(async () => {});
    expect(screen.queryByRole("columnheader", { name: /Status/ })).toBeNull();
  });

  it("hears selection changes through onRowSelectionChange without controlling them", async () => {
    const onRowSelectionChange = vi.fn();
    const helper = createColumnHelper<DataTableFeatures, { id: string; name: string }>();
    const columns = helper.columns([
      createSelectColumn<{ id: string; name: string }>({ getRowLabel: (row) => row.name }),
      helper.accessor("name", {
        header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
      }),
    ]);
    render(
      <DataTable
        columns={columns}
        data={[
          { id: "a", name: "Aiko" },
          { id: "b", name: "Ren" },
        ]}
        getRowId={(row) => row.id}
        onRowSelectionChange={onRowSelectionChange}
      />,
    );
    fireEvent.click(screen.getByRole("checkbox", { name: "Select Ren" }));
    await act(async () => {});
    expect(onRowSelectionChange).toHaveBeenLastCalledWith({ b: true });
    expect(screen.getByRole("checkbox", { name: "Select Ren" }).getAttribute("aria-checked")).toBe(
      "true",
    );
    // Without a label, a row is named by its position.
    cleanup();
    render(<DataTable columns={[createSelectColumn()]} data={[{}]} />);
    expect(screen.getByRole("checkbox", { name: "Select row 1" })).toBeTruthy();
  });

  it("a column that can neither sort nor hide shows its title alone", () => {
    const helper = createColumnHelper<DataTableFeatures, { name: string }>();
    const columns = helper.columns([
      helper.accessor("name", {
        meta: { label: "Name" },
        header: ({ column }) => <DataTableColumnHeader column={column} />,
        enableSorting: false,
        enableHiding: false,
      }),
    ]);
    render(<DataTable columns={columns} data={[{ name: "Aiko" }]} />);
    expect(screen.getByRole("columnheader", { name: "Name" }).querySelector("button")).toBeNull();
    expect(screen.getByText("1 row")).toBeTruthy();
  });

  it("server: a click starts the request; the rows arrive after the latency, busy meanwhile", async () => {
    vi.useFakeTimers();
    render(<ServerVariant />);
    expect(firstCells()).toEqual(["1", "2", "3", "4", "5"]);
    expect(screen.getByText("Page 1 of 10")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    await act(async () => {});
    expect(status()).toBe("Page 2 of 10");
    expect(screen.getByRole("table").getAttribute("aria-busy")).toBe("true");
    expect(firstCells()[0]).toBe("1");
    await act(async () => {
      vi.advanceTimersByTime(600);
    });
    expect(screen.getByRole("table").hasAttribute("aria-busy")).toBe(false);
    expect(firstCells()).toEqual(["6", "7", "8", "9", "10"]);

    await pick("No.", "Descending");
    expect(status()).toBe("Sorted by No., descending");
    expect(screen.getByText("Page 1 of 10")).toBeTruthy();
    await act(async () => {
      vi.advanceTimersByTime(600);
    });
    expect(firstCells()).toEqual(["48", "47", "46", "45", "44"]);
  });

  it("server: starts no timer on render, and clears a pending one on unmount", async () => {
    vi.useFakeTimers();
    const { unmount } = render(<ServerVariant />);
    expect(vi.getTimerCount()).toBe(0);
    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    await act(async () => {});
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("reads no clock while rendering: the same markup at two dates", () => {
    vi.useFakeTimers();
    for (const Variant of [DefaultVariant, SelectionVariant, ServerVariant]) {
      vi.setSystemTime(new Date(2026, 0, 1, 9));
      const first = renderToStaticMarkup(<Variant />);
      vi.setSystemTime(new Date(2031, 6, 15, 23));
      expect(renderToStaticMarkup(<Variant />)).toBe(first);
    }
    for (const file of [
      "data-table.tsx",
      "variants/default.tsx",
      "variants/selection.tsx",
      "variants/server.tsx",
    ]) {
      const source = readFileSync(new URL(file, import.meta.url), "utf8");
      expect(source, file).not.toMatch(/new Date\(|Date\.now|Math\.random|randomUUID/);
    }
  });
});
