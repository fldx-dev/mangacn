import { Button } from "@/registry/ui/button/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/registry/ui/empty/empty";

export default function EmptyDefaultDemo() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia />
        <EmptyTitle>No chapters yet</EmptyTitle>
        <EmptyDescription>
          This series has no pages. Start the first chapter or import pages you have inked.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div className="flex flex-wrap justify-center gap-2">
          <Button>Start a chapter</Button>
          <Button variant="outline">Import pages</Button>
        </div>
      </EmptyContent>
    </Empty>
  );
}
