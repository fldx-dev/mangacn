import { Skeleton } from "@/registry/ui/skeleton/skeleton";

export default function SkeletonDefaultDemo() {
  return (
    <div className="flex w-full max-w-xs items-center gap-4">
      <Skeleton className="size-12 shrink-0 rounded-full" />
      <div className="grid flex-1 gap-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}
