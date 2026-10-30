import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { expectNoA11yViolations } from "@/lib/test/axe";
import { stubResizeObserver } from "@/lib/test/resize-observer";
import TableDefaultDemo from "./demos/default";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function Chapters() {
  return (
    <Table className="custom-class">
      <TableCaption>Chapters</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>No.</TableHead>
          <TableHead>Title</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>11</TableCell>
          <TableCell>Two umbrellas</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>12</TableCell>
          <TableCell>Rooftop</TableCell>
        </TableRow>
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell>Total</TableCell>
          <TableCell>2</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}

const ruleOf = (cell: HTMLElement) =>
  cell.querySelector<HTMLElement>(':scope > [data-slot="ink-frame"]');

describe("Table", () => {
  it("renders every part with its data-slot and a forwarded className", () => {
    render(<Chapters />);
    const table = screen.getByRole("table");
    expect(table.getAttribute("data-slot")).toBe("table");
    expect(table.classList.contains("custom-class")).toBe(true);
    expect(table.parentElement?.getAttribute("data-slot")).toBe("table-container");
    for (const slot of [
      "table-caption",
      "table-header",
      "table-body",
      "table-footer",
      "table-row",
      "table-head",
      "table-cell",
    ]) {
      expect(table.querySelector(`[data-slot="${slot}"]`), slot).not.toBeNull();
    }
  });

  it("draws every row rule as hand-drawn segments instead of CSS borders", () => {
    render(<Chapters />);
    const table = screen.getByRole("table");
    for (const element of table.querySelectorAll("thead, tbody, tfoot, tr")) {
      expect(element.className, element.tagName).not.toMatch(/border/);
    }
    for (const cell of screen.getAllByRole("cell")) {
      expect(ruleOf(cell)?.getAttribute("data-shape")).toBe("line");
    }
    for (const head of screen.getAllByRole("columnheader")) {
      expect(ruleOf(head)?.getAttribute("data-shape")).toBe("line");
    }
  });

  it("rules the header heavy, drops the last body rule and rules the footer from above", () => {
    render(<Chapters />);
    const table = screen.getByRole("table");
    expect(table.querySelector("thead")?.className).toContain(
      "[&>tr>*>[data-slot=ink-frame]]:[--outline-width:var(--outline-width-heavy)]",
    );
    expect(table.querySelector("tbody")?.className).toContain(
      "[&>tr:last-child>*>[data-slot=ink-frame]]:hidden",
    );
    expect(table.querySelector("tfoot")?.className).toContain(
      "[&>tr>*>[data-slot=ink-frame]]:top-0",
    );
  });

  it("draws one stroke per cell once measured", () => {
    const observers = stubResizeObserver();
    render(<Chapters />);
    observers.drawAll(120, 1.5);
    const cell = screen.getByText("Rooftop");
    expect(ruleOf(cell)?.dataset.inked).toBe("true");
    expect(ruleOf(cell)?.querySelectorAll("path")).toHaveLength(1);
  });

  it("has no axe violations in its default demo", async () => {
    await expectNoA11yViolations(<TableDefaultDemo />);
  });
});
