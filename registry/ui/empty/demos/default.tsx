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
        <EmptyDescription>This series has no pages yet.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button size="sm">New chapter</Button>
      </EmptyContent>
    </Empty>
  );
}
