import { Badge } from "@/registry/ui/badge/badge";
import { Button } from "@/registry/ui/button/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/registry/ui/table/table";

const series = [
  { title: "Night Market", chapter: 48, status: "Ongoing", variant: "secondary" },
  { title: "Rooftop Courier", chapter: 112, status: "Hiatus", variant: "destructive" },
  { title: "Two Umbrellas", chapter: 30, status: "Complete", variant: "outline" },
] as const;

export default function TableStatusBadgesVariant() {
  return (
    <div className="w-full max-w-md">
      <Table label="Series you follow">
        <TableHeader>
          <TableRow>
            <TableHead>Series</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="pr-3">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {series.map((item) => (
            <TableRow key={item.title}>
              <TableCell>
                <div className="font-medium">{item.title}</div>
                <div className="text-xs text-muted-foreground">Latest: ch. {item.chapter}</div>
              </TableCell>
              <TableCell>
                <Badge variant={item.variant}>{item.status}</Badge>
              </TableCell>
              {/* pr-3: a button's ink outline reaches past its box; at the table's edge it would
                  make the table scroll by half a pixel. */}
              <TableCell className="pr-3 text-right">
                <Button size="xs" variant="outline" aria-label={`Read ${item.title}`}>
                  Read
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
