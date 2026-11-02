import { Badge } from "@/registry/ui/badge/badge";
import { Button } from "@/registry/ui/button/button";

/** Hero cell "Badges and buttons": the label and action primitives, two lines at most. */
export function HeroBadges() {
  return (
    <div className="flex w-full flex-col items-start gap-4">
      <div className="flex flex-wrap gap-2">
        <Badge>New</Badge>
        <Badge variant="secondary">Ch. 12</Badge>
        <Badge variant="outline">Vol. 3</Badge>
        <Badge variant="spot" lang="ja">
          完結
        </Badge>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm">
          Read now
        </Button>
        <Button type="button" size="sm" variant="outline">
          Later
        </Button>
      </div>
    </div>
  );
}
