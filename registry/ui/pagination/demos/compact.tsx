import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/registry/ui/pagination/pagination";

// Previous and next only, as at the foot of a chapter page.
export default function PaginationCompactDemo() {
  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href="#chapter-11" text="Chapter 11" />
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href="#chapter-13" text="Chapter 13" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
