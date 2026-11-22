import { Skeleton } from "@/registry/ui/skeleton/skeleton";

const rows = ["first", "second", "third", "fourth"];

export default function SkeletonChapterListVariant() {
  return (
    // While the chapters load, the list says so to screen readers and draws the rows it will hold.
    <div aria-busy="true" className="w-full max-w-md">
      <span role="status" className="sr-only">
        Loading chapters
      </span>
      <ul className="grid gap-4">
        {rows.map((row) => (
          <li key={row} className="flex items-center gap-3">
            <Skeleton className="h-14 w-10 shrink-0" />
            <div className="grid flex-1 gap-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="h-5.5 w-12 shrink-0" />
          </li>
        ))}
      </ul>
    </div>
  );
}
