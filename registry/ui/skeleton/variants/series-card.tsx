import { Card, CardContent, CardFooter, CardHeader } from "@/registry/ui/card/card";
import { Skeleton } from "@/registry/ui/skeleton/skeleton";

export default function SkeletonSeriesCardVariant() {
  return (
    // The card is real; only what it will show is pencilled in until the series arrives.
    <Card aria-busy="true" className="w-full max-w-xs">
      <span role="status" className="sr-only">
        Loading series
      </span>
      <CardHeader className="grid-cols-[auto_1fr] items-center gap-3">
        <Skeleton shape="ellipse" className="size-10" />
        <div className="grid gap-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </CardHeader>
      <CardContent className="grid gap-3">
        <Skeleton className="aspect-video w-full" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
      </CardContent>
      <CardFooter className="gap-2">
        <Skeleton className="h-8 flex-1" />
        <Skeleton className="h-8 w-20" />
      </CardFooter>
    </Card>
  );
}
