"use client";

import { useState } from "react";
import { Checkbox } from "@/registry/ui/checkbox/checkbox";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/registry/ui/table/table";

const pages = [
  { number: 4, note: "Speed lines on the jump" },
  { number: 7, note: "Tone the night sky" },
  { number: 9, note: "Redraw the ferry rail" },
  { number: 13, note: "Letter the last balloon" },
];

export default function TableRowSelectionVariant() {
  const [selected, setSelected] = useState<number[]>([7]);
  const allSelected = selected.length === pages.length;

  const toggle = (number: number, checked: boolean) =>
    setSelected((current) =>
      checked ? [...current, number] : current.filter((page) => page !== number),
    );

  return (
    <div className="w-full max-w-md">
      <Table label="Pages to send back">
        <TableCaption>
          {selected.length} of {pages.length} pages marked for the assistant.
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8">
              <Checkbox
                aria-label="Select every page"
                checked={allSelected}
                indeterminate={selected.length > 0 && !allSelected}
                onCheckedChange={(checked) =>
                  setSelected(checked ? pages.map((page) => page.number) : [])
                }
              />
            </TableHead>
            <TableHead className="w-12">Page</TableHead>
            <TableHead>Fix</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pages.map((page) => {
            const isSelected = selected.includes(page.number);
            return (
              <TableRow key={page.number} data-state={isSelected ? "selected" : undefined}>
                <TableCell>
                  <Checkbox
                    aria-label={`Select page ${page.number}`}
                    checked={isSelected}
                    onCheckedChange={(checked) => toggle(page.number, checked)}
                  />
                </TableCell>
                <TableCell className="font-medium">{page.number}</TableCell>
                <TableCell>{page.note}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
