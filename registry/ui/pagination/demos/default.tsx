import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/registry/ui/pagination/pagination";

// Twelve pages on page 6: first and last, the current page and its neighbours, ellipses between.
export default function PaginationDefaultDemo() {
  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href="#page-5" />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#page-1">1</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationEllipsis />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#page-5">5</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#page-6" isActive>
            6
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#page-7">7</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationEllipsis />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#page-12">12</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href="#page-7" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
