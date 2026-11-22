import {
  BookmarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Columns2Icon,
  ShareIcon,
  SquareIcon,
} from "lucide-react";
import { Button } from "@/registry/ui/button/button";
import { Separator } from "@/registry/ui/separator/separator";

export default function SeparatorInAToolbarVariant() {
  return (
    <div className="flex h-8 w-fit max-w-full items-center gap-2">
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon-sm" aria-label="Previous page">
          <ChevronLeftIcon />
        </Button>
        <span className="px-1 text-sm tabular-nums">12 / 18</span>
        <Button variant="ghost" size="icon-sm" aria-label="Next page">
          <ChevronRightIcon />
        </Button>
      </div>
      <Separator orientation="vertical" />
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon-sm" aria-label="Single page" aria-pressed="true">
          <SquareIcon />
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label="Two-page spread" aria-pressed="false">
          <Columns2Icon />
        </Button>
      </div>
      <Separator orientation="vertical" />
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon-sm" aria-label="Bookmark page">
          <BookmarkIcon />
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label="Share chapter">
          <ShareIcon />
        </Button>
      </div>
    </div>
  );
}
