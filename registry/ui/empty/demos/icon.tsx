import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/registry/ui/empty/empty";

export default function EmptyIconDemo() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon" />
        <EmptyTitle>All caught up</EmptyTitle>
        <EmptyDescription>
          You have read every chapter so far. <a href="#follow">Follow the series</a> to hear when
          the next one drops.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
