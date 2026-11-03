import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/registry/ui/pagination/pagination";

// A page count between previous and next: fits a phone whatever the number of pages.
export default function PaginationCountDemo() {
  return (
    <Pagination>
      <PaginationContent className="gap-2">
        <PaginationItem>
          <PaginationPrevious href="#page-6" />
        </PaginationItem>
        <PaginationItem className="px-2 text-sm">
          Page <span className="font-display">7</span> of 12
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href="#page-8" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
