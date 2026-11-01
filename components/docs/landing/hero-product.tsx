import { cn } from "cn";
import { Badge } from "@/registry/ui/badge/badge";
import { Button } from "@/registry/ui/button/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/registry/ui/card/card";
import { Progress, ProgressLabel, ProgressValue } from "@/registry/ui/progress/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/registry/ui/table/table";
import { TABLE_FITS } from "./fit";

const PAGES = [
  { pages: "1–6", status: "Inked" },
  { pages: "7–12", status: "Inking" },
  { pages: "13–18", status: "Pencils" },
];

/** Hero cell "In a product": a small status card built from stock primitives only. */
export function HeroProduct() {
  return (
    <Card size="sm" className={cn("w-full text-xs", TABLE_FITS)}>
      <CardHeader>
        <CardTitle className="text-sm">Chapter 12 · Rooftop</CardTitle>
        <div className="flex flex-wrap gap-1.5">
          <Badge>Inking</Badge>
          <Badge variant="spot">Due Fri</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Table className="text-xs">
          <TableHeader>
            <TableRow>
              <TableHead className="h-7 px-1.5">Pages</TableHead>
              <TableHead className="h-7 px-1.5">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {PAGES.map((row) => (
              <TableRow key={row.pages}>
                <TableCell className="px-1.5 py-1">{row.pages}</TableCell>
                <TableCell className="px-1.5 py-1">{row.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Progress value={64} className="w-full">
          <ProgressLabel className="text-xs">Inked</ProgressLabel>
          <ProgressValue className="text-xs" />
        </Progress>
        <Button type="button" size="sm" className="self-start">
          Send to editor
        </Button>
      </CardContent>
    </Card>
  );
}
