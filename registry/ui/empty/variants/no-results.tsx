import { SearchXIcon } from "lucide-react";
import { Button } from "@/registry/ui/button/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/registry/ui/empty/empty";

export default function EmptyNoResultsVariant() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SearchXIcon />
        </EmptyMedia>
        <EmptyTitle>No series match “Kaiju Bakery”</EmptyTitle>
        <EmptyDescription>Check the spelling, or search by the author’s pen name.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="flex-row flex-wrap justify-center">
        <Button size="sm" variant="outline">
          Clear search
        </Button>
        <Button size="sm">Browse all series</Button>
      </EmptyContent>
    </Empty>
  );
}
