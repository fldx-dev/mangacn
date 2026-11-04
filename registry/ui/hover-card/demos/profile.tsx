import { Avatar, AvatarFallback } from "@/registry/ui/avatar/avatar";
import { Badge } from "@/registry/ui/badge/badge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/registry/ui/hover-card/hover-card";

export default function HoverCardProfileDemo() {
  return (
    <HoverCard defaultOpen>
      <HoverCardTrigger
        href="#mangaka"
        className="text-sm font-medium underline underline-offset-4"
      >
        @rooftop-ink
      </HoverCardTrigger>
      <HoverCardContent className="w-72">
        <div className="flex gap-3">
          <Avatar size="lg">
            <AvatarFallback>AT</AvatarFallback>
          </Avatar>
          <div className="grid min-w-0 gap-1.5">
            <p className="font-medium">
              Aoi Takahashi <span lang="ja">高橋あおい</span>
            </p>
            <p className="text-muted-foreground">Rooftop Runners, Last Train, Paper Moon.</p>
            <div className="flex flex-wrap gap-1.5">
              <Badge>Seinen</Badge>
              <Badge variant="outline">Weekly</Badge>
              <Badge variant="secondary">3 series</Badge>
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
