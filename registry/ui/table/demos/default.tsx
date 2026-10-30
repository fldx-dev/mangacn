import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/registry/ui/table/table";

const chapters = [
  { number: 9, title: "Night market", pages: 18, status: "Published" },
  { number: 10, title: "The ferry", pages: 20, status: "Published" },
  { number: 11, title: "Two umbrellas", pages: 19, status: "Lettering" },
  { number: 12, title: "Rooftop", pages: 18, status: "Inking" },
];

export default function TableDefaultDemo() {
  return (
    <div className="w-full max-w-md">
      <Table>
        <TableCaption>Volume 2, chapters in progress.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">No.</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Pages</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {chapters.map((chapter) => (
            <TableRow key={chapter.number}>
              <TableCell className="font-medium">{chapter.number}</TableCell>
              <TableCell>{chapter.title}</TableCell>
              <TableCell>{chapter.status}</TableCell>
              <TableCell className="text-right">{chapter.pages}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={3}>Total</TableCell>
            <TableCell className="text-right">75</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
